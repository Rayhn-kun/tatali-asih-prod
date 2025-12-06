import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

export default function(prisma: PrismaClient) {
  const router = Router();

  // Public route - get products with search, pagination, and filtering
  router.get('/', async (req, res) => {
    try {
      const q = String(req.query.q || '');
      const category = String(req.query.category || '');
      const page = Math.max(1, parseInt(String(req.query.page || '1')));
      const size = Math.min(100, Math.max(1, parseInt(String(req.query.size || '20'))));
      const sort = String(req.query.sort || 'name');
      
      const where: any = { isActive: true };
      
      if (q) {
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ];
      }
      
      if (category) {
        where.category = category;
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          take: size,
          skip: (page - 1) * size,
          orderBy: { [sort]: 'asc' }
        }),
        prisma.product.count({ where })
      ]);

      res.json({
        data: products,
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

  // Public route - get single product
  router.get('/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) return res.status(404).json({ error: 'Product not found' });
      res.json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Admin only routes
  router.post('/', requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { sku, name, category, unit, priceRp, stock, imageUrl, description } = req.body;
      
      if (!name || !priceRp) {
        return res.status(400).json({ error: 'Name and price are required' });
      }

      const product = await prisma.product.create({
        data: {
          sku,
          name,
          category,
          unit,
          priceRp: parseInt(priceRp),
          stock: parseInt(stock || 0),
          imageUrl,
          description
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          actorUserId: req.user.id,
          action: 'CREATE',
          entity: 'Product',
          entityId: product.id,
          meta: { productName: name }
        }
      });

      res.status(201).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.patch('/:id', requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const id = Number(req.params.id);
      const updates = req.body;

      if (updates.priceRp) updates.priceRp = parseInt(updates.priceRp);
      if (updates.stock !== undefined) updates.stock = parseInt(updates.stock);

      const product = await prisma.product.update({
        where: { id },
        data: updates
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          actorUserId: req.user.id,
          action: 'UPDATE',
          entity: 'Product',
          entityId: product.id,
          meta: { updates }
        }
      });

      res.json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.delete('/:id', requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const id = Number(req.params.id);
      
      // Soft delete by setting isActive to false
      const product = await prisma.product.update({
        where: { id },
        data: { isActive: false }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          actorUserId: req.user.id,
          action: 'DELETE',
          entity: 'Product',
          entityId: product.id,
          meta: { productName: product.name }
        }
      });

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
}
