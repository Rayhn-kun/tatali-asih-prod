import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

export default function(prisma: PrismaClient) {
  const router = Router();

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'invalid' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid' });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
    
    res.json({ 
      token,
      user: {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        class: user.class,
        role: user.role
      }
    });
  });

  router.post('/register', async (req, res) => {
    try {
      const { name, email, password, phone, class: userClass } = req.body;
      if (!email || !password || !name) return res.status(400).json({ error: 'name,email,password required' });
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ error: 'email exists' });
      const hash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({ data: { name, email, passwordHash: hash, phone: phone || null, class: userClass || null } });
      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
      
      res.json({ 
        token, 
        user: { 
          id: Number(user.id), 
          name: user.name, 
          email: user.email,
          phone: user.phone,
          class: user.class,
          role: user.role
        } 
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'server error' });
    }
  });

  // placeholder reset password - implement via email/token in production
  router.post('/reset-request', async (req, res) => {
    const { email } = req.body;
    // In production: create token, send email with link. Here we just respond with ok if user exists.
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(200).json({ ok: true }); // don't reveal existence
    // create audit log
    await prisma.auditLog.create({ data: { actorUserId: user.id, action: 'RESET_REQUEST', entity: 'User', entityId: user.id } });
    res.json({ ok: true });
  });

  router.post('/reset', async (req, res) => {
    const { email, newPassword } = req.body;
    // placeholder: directly reset if user exists (unsafe for production)
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'not found' });
    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
    res.json({ ok: true });
  });

  // Refresh token endpoint (issue new access token if refresh token cookie valid)
  router.post('/refresh', async (req, res) => {
    try {
      const token = req.cookies?.refreshToken || req.headers['x-refresh-token'] || null;
      if (!token) return res.status(401).json({ error: 'no token' });
      let payload;
      try {
        payload = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        return res.status(401).json({ error: 'invalid token' });
      }
      const user = await prisma.user.findUnique({ where: { id: Number((payload as any).userId) } });
      if (!user) return res.status(401).json({ error: 'invalid' });
      const accessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
      res.json({ token: accessToken });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'server error' });
    }
  });

  // Logout: clear refresh token cookie (frontend should call this)
  router.post('/logout', async (req, res) => {
    res.clearCookie('refreshToken', { httpOnly: true, path: '/' });
    res.json({ ok: true });
  });

  return router;
}