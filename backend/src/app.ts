import express from "express";
import cors from 'cors'
import userRouter from './routes/user.route'
import chatRouter from './routes/chat.routes'
import adminRouter from './routes/admin.route'
import consentRoutes from "./routes/consent.routes";
import usageRoutes from "./routes/usagelog.routes";
import notificationRouter from "./routes/notification.route";
import chatbotRoutes from "./routes/chatbot.routes";
import { databaseMiddleware } from './middleware/database.middleware';
import "./jobs/notification.job";

const app = express();

app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-App-ID'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middleware to detect app type and set database
app.use((req, res, next) => {
  const appId = req.headers['x-app-id'] as string || 'app1';
  req.appId = appId; // Add appId to request object
  // Debug: log appId for incoming requests to help diagnose app routing
  console.log(`➡️ Incoming REST request: ${req.method} ${req.path} - appId=${appId}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database middleware - must come after appId is set
app.use(databaseMiddleware);

// API Routes
app.use('/api/v1/user', userRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/admin', adminRouter);
app.use("/api/v1/consent", consentRoutes);
app.use("/api/v1/usage", usageRoutes);
app.use('/api/v1/notification',notificationRouter);
app.use("/api/v1/chatbot", chatbotRoutes);

export default app;