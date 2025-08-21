import express from "express";
import cors from 'cors'
import { WebSocketServer } from 'ws';
import userRouter from './routes/user.route'
import chatRouter from './routes/chat.routes'

const app = express();

app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/v1/user', userRouter);
app.use('/api/v1/chat', chatRouter);

export default app;