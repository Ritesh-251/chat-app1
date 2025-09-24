import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

// Store connections for different apps
const connections: { [key: string]: mongoose.Connection } = {};

export const connectDb = () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Missing URI");
    return mongoose.connect(uri as string);
};

// Get database connection based on app ID
export const getDbConnection = (appId: string = 'app1'): mongoose.Connection => {
    if (connections[appId]) {
        return connections[appId];
    }

    const baseUri = process.env.MONGODB_URI;
    if (!baseUri) throw new Error("Missing MONGODB_URI");

    // Create different database names for different apps
    const dbName = appId === 'app2' ? 'chatapp_lite' : 'chatapp';
    
    // Replace the database name in URI
    const uri = baseUri.replace(/\/[^/?]+(\?|$)/, `/${dbName}$1`);
    
    console.log(`📱 Creating database connection for ${appId}: ${dbName}`);
    
    // Create new connection for this app
    const connection = mongoose.createConnection(uri);
    connections[appId] = connection;
    
    return connection;
};

// Helper to get models for specific app
export const getAppModels = (appId: string) => {
    const connection = getDbConnection(appId);
    return {
        connection,
        // Models will be created using this connection
        User: connection.model('User'),
        Chat: connection.model('Chat'),
        // Add other models as needed
    };
};