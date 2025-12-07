import swaggerUi from 'swagger-ui-express';


import openapi from './openapi.json';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import usersRouter from './routes/users';
import authRouter from './routes/auth';
import reportsRouter from './routes/reports';

// Handle BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  const int = Number.parseInt(this.toString());
  return int ?? this.toString();
};

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));


app.use('/api/products', productsRouter(prisma));
app.use('/api/orders', ordersRouter(prisma));
app.use('/api/users', usersRouter(prisma));
app.use('/api/auth', authRouter(prisma));
app.use('/api/reports', reportsRouter(prisma));

const port = (process as any).env.PORT || 8000;
app.listen(port, () => {
  console.log(`API running on http://0.0.0.0:${port}`);
});

