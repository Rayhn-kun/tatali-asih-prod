import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

export default function(prisma: PrismaClient) {
  const router = Router();

  // Create new order (authenticated users)
  router.post('/', requireAuth, async (req: any, res) => {
    try {
      const { items, deliveryMethod, addressOrClass, notes } = req.body;
      const userId = req.user.id;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items are required' });
      }

      // Generate order code
      const orderCode = `KOP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;

      // Transaction to create order and update stock
      const result = await prisma.$transaction(async (tx) => {
        let subtotal = 0;
        const orderItems = [];

        // Validate products and calculate subtotal
        for (const item of items) {
          const product = await tx.product.findUnique({ 
            where: { id: Number(item.productId) } 
          });
          
          if (!product || !product.isActive) {
            throw new Error(`Product ${item.productId} not found or inactive`);
          }
          
          if (product.stock < Number(item.qty)) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.qty}`);
          }

          const itemTotal = product.priceRp * Number(item.qty);
          subtotal += itemTotal;
          
          orderItems.push({
            productId: product.id,
            qty: Number(item.qty),
            priceRp: product.priceRp
          });
        }

        // Create order
        const order = await tx.order.create({
          data: {
            orderCode,
            userId: Number(userId),
            status: 'PENDING',
            deliveryMethod: deliveryMethod || 'AMBIL',
            addressOrClass: addressOrClass || '',
            notes: notes || '',
            subtotalRp: subtotal
          }
        });

        // Create order items (but don't reduce stock yet - only when status changes to DIPROSES)
        for (const item of orderItems) {
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              ...item
            }
          });
        }

        // Create audit log
        await tx.auditLog.create({
          data: {
            actorUserId: Number(userId),
            action: 'CREATE',
            entity: 'Order',
            entityId: order.id,
            meta: { orderCode, subtotal, itemCount: items.length }
          }
        });

        return order;
      });

      res.status(201).json({ 
        success: true, 
        orderId: result.id, 
        orderCode: result.orderCode 
      });
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ error: error.message || 'Failed to create order' });
    }
  });

  // Get user's orders
  router.get('/my', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const orders = await prisma.order.findMany({
        where: { userId: Number(userId) },
        include: {
          items: {
            include: {
              product: {
                select: { name: true, unit: true, imageUrl: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(orders);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get all orders (admin only)
  router.get('/', requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const status = req.query.status as string;
      const from = req.query.from as string;
      const to = req.query.to as string;
      const page = Math.max(1, parseInt(String(req.query.page || '1')));
      const size = Math.min(100, Math.max(1, parseInt(String(req.query.size || '20'))));

      const where: any = {};
      
      if (status) {
        where.status = status;
      }
      
      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: {
              select: { name: true, email: true, class: true }
            },
            items: {
              include: {
                product: {
                  select: { name: true, unit: true }
                }
              }
            }
          },
          take: size,
          skip: (page - 1) * size,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.order.count({ where })
      ]);

      res.json({
        data: orders,
        pagination: {
          page,
          size,
          total,
          pages: Math.ceil(total / size)
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get single order
  router.get('/:id', requireAuth, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const userId = req.user.id;
      const isAdmin = req.user.role === 'ADMIN';

      const where: any = { id };
      if (!isAdmin) {
        where.userId = Number(userId);
      }

      const order = await prisma.order.findUnique({
        where,
        include: {
          user: {
            select: { name: true, email: true, class: true }
          },
          items: {
            include: {
              product: {
                select: { name: true, unit: true, imageUrl: true }
              }
            }
          }
        }
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Update order status (admin only)
  router.patch('/:id/status', requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const id = Number(req.params.id);
      const { status, notes } = req.body;
      const adminId = req.user.id;

      if (!['PENDING', 'DIPROSES', 'DITOLAK', 'SELESAI'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      if (status === 'DITOLAK' && !notes) {
        return res.status(400).json({ error: 'Notes required for rejected orders' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const currentOrder = await tx.order.findUnique({
          where: { id },
          include: { items: true }
        });

        if (!currentOrder) {
          throw new Error('Order not found');
        }

        // Business logic for stock management
        if (currentOrder.status === 'PENDING' && status === 'DIPROSES') {
          // Reduce stock when order is processed
          for (const item of currentOrder.items) {
            const product = await tx.product.findUnique({
              where: { id: item.productId }
            });
            
            if (!product || product.stock < item.qty) {
              throw new Error(`Insufficient stock for product ID ${item.productId}`);
            }

            await tx.product.update({
              where: { id: item.productId },
              data: { stock: product.stock - item.qty }
            });
          }
        }

        // Update order
        const updatedOrder = await tx.order.update({
          where: { id },
          data: {
            status,
            notes: notes || currentOrder.notes,
            updatedAt: new Date()
          }
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            actorUserId: Number(adminId),
            action: 'UPDATE_STATUS',
            entity: 'Order',
            entityId: id,
            meta: { 
              oldStatus: currentOrder.status, 
              newStatus: status, 
              notes,
              orderCode: currentOrder.orderCode
            }
          }
        });

        return updatedOrder;
      });

      res.json(result);
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ error: error.message || 'Failed to update order status' });
    }
  });

  return router;
}
