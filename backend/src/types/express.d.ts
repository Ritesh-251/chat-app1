import { Request } from 'express';
import { Connection } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      appId?: string;
      dbConnection?: Connection;
    }
  }
}