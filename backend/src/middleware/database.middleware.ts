import { Request, Response, NextFunction } from 'express';
import { getDbConnection } from '../db';

export const databaseMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const appId = req.appId || 'app1';
    
    try {
        // Get the database connection for this app
        const dbConnection = getDbConnection(appId);
        
        // Attach the connection to the request for use in controllers
        req.dbConnection = dbConnection;
        
        console.log(`🔌 Database connection set for ${appId}`);
        next();
    } catch (error) {
        console.error(`❌ Database connection error for ${appId}:`, error);
        res.status(500).json({ error: 'Database connection failed' });
    }
};