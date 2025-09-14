import express from "express";
import cors from 'cors'
import userRouter from './routes/user.route'
import chatRouter from './routes/chat.routes'
import adminRouter from './routes/admin.route'
import consentRoutes from "./routes/consent.routes";
import usageRoutes from "./routes/usagelog.routes";
import notificationRouter from "./routes/notification.route"
import "./jobs/notification.job";

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
app.use('/api/v1/admin', adminRouter);
app.use("/api/v1/consent", consentRoutes);
app.use("/api/v1/usage", usageRoutes);
app.use('/api/v1/notification',notificationRouter);


export default app;