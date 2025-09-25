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

    // Get the correct URI based on app ID
    let uri: string;
    if (appId === 'app2') {
        uri = process.env.MONGODB_URI2 || '';
        if (!uri) throw new Error("Missing MONGODB_URI2 for App2");
    } else {
        uri = process.env.MONGODB_URI || '';
        if (!uri) throw new Error("Missing MONGODB_URI for App1");
    }
    
    console.log(`📱 Creating database connection for ${appId}: ${uri}`);
    
    // Create new connection for this app
    const connection = mongoose.createConnection(uri);
    connections[appId] = connection;
    
    return connection;
};