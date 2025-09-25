import { Request, Response, NextFunction } from 'express';
import { getDbConnection } from '../db';
import { chatSchema } from '../models/chat.model';
import { userSchema } from '../models/user.model';
import { ConsentSchema } from '../models/consent.model';
import { UsageLogSchema } from '../models/usageLog.model';
import { userTokenSchema } from '../models/userToken.model';
import { ChatbotProfileSchema } from '../models/chatbotProfile.model';

// Import the default models to override them
import ChatModel from '../models/chat.model';
import UserModel from '../models/user.model';
import { Consent as ConsentModel } from '../models/consent.model';
import { UsageLog as UsageLogModel } from '../models/usageLog.model';
import UserTokenModel from '../models/userToken.model';
import ChatbotProfileModel from '../models/chatbotProfile.model';

export const databaseMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const appId = req.appId || 'app1';
    
    try {
        // Get the correct database connection for this app
        const connection = getDbConnection(appId);
        
        // Override the models to use the app-specific connection
        // This way existing controllers don't need to change
        const originalChatModel = ChatModel.collection;
        const originalUserModel = UserModel.collection;
        
        // Create app-specific models using the correct connection
        const AppSpecificChat = connection.model('Chat', chatSchema);
        const AppSpecificUser = connection.model('User', userSchema);
        const AppSpecificConsent = connection.model('Consent', ConsentSchema);
        const AppSpecificUsageLog = connection.model('UsageLog', UsageLogSchema);
        const AppSpecificUserToken = connection.model('UserToken', userTokenSchema);
        
        // Only create ChatbotProfile for App1 (full version)
        let AppSpecificChatbotProfile = null;
        if (appId === 'app1') {
            AppSpecificChatbotProfile = connection.model('ChatbotProfile', ChatbotProfileSchema);
        }
        
        // Override the prototype methods to use app-specific models
        (req as any).Chat = AppSpecificChat;
        (req as any).User = AppSpecificUser;
        (req as any).Consent = AppSpecificConsent;
        (req as any).UsageLog = AppSpecificUsageLog;
        (req as any).UserToken = AppSpecificUserToken;
        
        // Only attach ChatbotProfile for App1
        if (AppSpecificChatbotProfile) {
            (req as any).ChatbotProfile = AppSpecificChatbotProfile;
        }
        
        console.log(`🔌 Database models created for ${appId} - using database: ${connection.name}`);
        console.log(`📊 Database URI: ${connection.host}:${connection.port}/${connection.name}`);
        next();
        
    } catch (error) {
        console.error(`❌ Database middleware error for ${appId}:`, error);
        res.status(500).json({ error: 'Database connection failed' });
    }
};