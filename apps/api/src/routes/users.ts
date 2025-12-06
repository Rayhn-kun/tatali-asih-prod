import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

export default function(prisma: PrismaClient) {
  const router = Router();

  router.get('/me', requireAuth, async (req: any, res) => {
    const user = await prisma.user.findUnique({ where: { id: Number(req.user.id) }, select: { id: true, name: true, email: true, phone: true, class: true, role: true } });
    res.json(user);
  });

  router.get('/orders', requireAuth, async (req: any, res) => {
    const orders = await prisma.order.findMany({ where: { userId: Number(req.user.id) }, include: { items: true } });
    res.json(orders);
  });

  return router;
}
