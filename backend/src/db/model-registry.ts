import mongoose from "mongoose";
import { getDbConnection } from "./index";

// Import all schemas
import { chatSchema } from "../models/chat.model";
import { userSchema } from "../models/user.model";
import { ConsentSchema } from "../models/consent.model";
import { UsageLogSchema } from "../models/usageLog.model";
import { ChatbotProfileSchema } from "../models/chatbotProfile.model";
import { userTokenSchema } from "../models/userToken.model";

// Registry to track which models exist for which connections
const modelRegistry: { [key: string]: { [modelName: string]: mongoose.Model<any> } } = {};

export function getModel<T>(modelName: string, schema: mongoose.Schema, appId: string = 'app1'): mongoose.Model<T> {
    // Initialize registry for this appId if it doesn't exist
    if (!modelRegistry[appId]) {
        modelRegistry[appId] = {};
    }
    
    // Return existing model if already created
    if (modelRegistry[appId][modelName]) {
        return modelRegistry[appId][modelName];
    }
    
    // Get the correct database connection
    const connection = getDbConnection(appId);
    
    // Create and register the model
    const model = connection.model<T>(modelName, schema);
    modelRegistry[appId][modelName] = model;
    
    console.log(`🏷️ Created model ${modelName} for ${appId} on database: ${connection.name}`);
    
    return model;
}

// Convenience functions for specific models
export function getChatModel(appId: string = 'app1') {
    return getModel('Chat', chatSchema, appId);
}

export function getUserModel(appId: string = 'app1') {
    return getModel('User', userSchema, appId);
}

export function getConsentModel(appId: string = 'app1') {
    return getModel('Consent', ConsentSchema, appId);
}

export function getUsageLogModel(appId: string = 'app1') {
    return getModel('UsageLog', UsageLogSchema, appId);
}

export function getChatbotProfileModel(appId: string = 'app1') {
    return getModel('ChatbotProfile', ChatbotProfileSchema, appId);
}

export function getUserTokenModel(appId: string = 'app1') {
    return getModel('UserToken', userTokenSchema, appId);
}

// Generic function to get any model by name
export function getAppModel(modelName: string, appId: string = 'app1') {
    const schemaMap: { [key: string]: mongoose.Schema } = {
        'Chat': chatSchema,
        'User': userSchema,
        'Consent': ConsentSchema,
        'UsageLog': UsageLogSchema,
        'ChatbotProfile': ChatbotProfileSchema,
        'UserToken': userTokenSchema,
    };
    
    const schema = schemaMap[modelName];
    if (!schema) {
        throw new Error(`Schema not found for model: ${modelName}`);
    }
    
    return getModel(modelName, schema, appId);
}