import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

export default function(prisma: PrismaClient) {
  const router = Router();

  // Get monthly report (admin only)
  router.get('/monthly', requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const year = parseInt(String(req.query.year || new Date().getFullYear()));
      const month = parseInt(String(req.query.month || new Date().getMonth() + 1));
      const format = req.query.format as string; // 'pdf' or 'xlsx'

      // Date range for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Get completed orders for the month
      const completedOrders = await prisma.order.findMany({
        where: {
          status: 'SELESAI',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: { name: true, category: true, unit: true }
              }
            }
          },
          user: {
            select: { name: true, class: true }
          }
        }
      });

      // Calculate total revenue
      const totalRevenue = completedOrders.reduce((sum, order) => sum + order.subtotalRp, 0);

      // Calculate product sales statistics
      const productStats = new Map();
      completedOrders.forEach(order => {
        order.items.forEach(item => {
          const key = item.productId;
          if (!productStats.has(key)) {
            productStats.set(key, {
              productId: item.productId,
              productName: item.product.name,
              category: item.product.category,
              unit: item.product.unit,
              totalQty: 0,
              totalRevenue: 0,
              orderCount: 0
            });
          }
          const stats = productStats.get(key);
          stats.totalQty += item.qty;
          stats.totalRevenue += (item.priceRp * item.qty);
          stats.orderCount += 1;
        });
      });

      // Sort products by total quantity sold
      const topProducts = Array.from(productStats.values())
        .sort((a, b) => b.totalQty - a.totalQty)
        .slice(0, 10);

      // Get current stock levels
      const stockLevels = await prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          category: true,
          stock: true,
          unit: true
        },
        orderBy: { stock: 'asc' }
      });

      // Low stock items (less than 10)
      const lowStockItems = stockLevels.filter(item => item.stock < 10);

      // Daily sales breakdown
      const dailySales = new Map();
      completedOrders.forEach(order => {
        const day = order.createdAt.getDate();
        if (!dailySales.has(day)) {
          dailySales.set(day, {
            day,
            orderCount: 0,
            revenue: 0
          });
        }
        const dayStats = dailySales.get(day);
        dayStats.orderCount += 1;
        dayStats.revenue += order.subtotalRp;
      });

      const dailySalesArray = Array.from(dailySales.values()).sort((a, b) => a.day - b.day);

      const report = {
        period: {
          year,
          month,
          monthName: new Date(year, month - 1).toLocaleString('id-ID', { month: 'long' }),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        summary: {
          totalOrders: completedOrders.length,
          totalRevenue,
          averageOrderValue: completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0,
          uniqueCustomers: new Set(completedOrders.map(o => o.userId)).size
        },
        topProducts,
        stockLevels: {
          total: stockLevels.length,
          lowStock: lowStockItems.length,
          items: lowStockItems
        },
        dailySales: dailySalesArray,
        orders: completedOrders.map(order => ({
          id: order.id,
          orderCode: order.orderCode,
          customerName: order.user.name,
          customerClass: order.user.class,
          subtotal: order.subtotalRp,
          itemCount: order.items.length,
          createdAt: order.createdAt
        }))
      };

      // If format is requested, handle PDF/Excel export
      if (format === 'pdf' || format === 'xlsx') {
        // For now, return JSON with export flag
        // In production, you would use libraries like puppeteer (PDF) or exceljs (Excel)
        res.json({
          ...report,
          exportFormat: format,
          message: `Report ready for ${format.toUpperCase()} export`
        });
      } else {
        res.json(report);
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          actorUserId: req.user.id,
          action: 'GENERATE_REPORT',
          entity: 'Report',
          entityId: null,
          meta: { 
            reportType: 'monthly',
            year,
            month,
            format: format || 'json',
            totalOrders: completedOrders.length,
            totalRevenue
          }
        }
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get sales analytics (admin only)
  router.get('/analytics', requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const days = parseInt(String(req.query.days || '30'));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Order status distribution
      const statusCounts = await prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
        where: {
          createdAt: { gte: startDate }
        }
      });

      // Category performance
      const categoryStats = await prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { qty: true },
        _count: { productId: true },
        where: {
          order: {
            status: 'SELESAI',
            createdAt: { gte: startDate }
          }
        }
      });

      // Get product details for category stats
      const productIds = categoryStats.map(stat => stat.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, category: true }
      });

      const categoryPerformance = new Map();
      categoryStats.forEach(stat => {
        const product = products.find(p => p.id === stat.productId);
        if (product && product.category) {
          if (!categoryPerformance.has(product.category)) {
            categoryPerformance.set(product.category, {
              category: product.category,
              totalQty: 0,
              orderCount: 0
            });
          }
          const catStats = categoryPerformance.get(product.category);
          catStats.totalQty += stat._sum.qty || 0;
          catStats.orderCount += stat._count.productId;
        }
      });

      res.json({
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        },
        orderStatus: statusCounts.map(stat => ({
          status: stat.status,
          count: stat._count.status
        })),
        categoryPerformance: Array.from(categoryPerformance.values())
          .sort((a, b) => b.totalQty - a.totalQty)
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
}