import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app.js"
import {connectDb} from "./db/index.js";
import SocketService from "./services/socket.service.js";
import RandomNotificationScheduler from "./services/randomNotificationScheduler.service.js";

// Create HTTP server and Socket.IO server
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for development
        methods: ["GET", "POST"]
    }
});

// Make io available globally
(global as any).io = io;

connectDb().then(
    ()=>{
        console.log("Database successfully conected");
        
        // Initialize Socket service
        const socketService = new SocketService(io);
        
        // Make socket service available globally
        (global as any).socketService = socketService;
        
        // Initialize Random Notification Scheduler
        const notificationScheduler = new RandomNotificationScheduler();
        (global as any).notificationScheduler = notificationScheduler;
        
        httpServer.listen(8000,()=>{
            console.log('🚀 Server is running at port 8000 with Socket.IO support');
            console.log('🔔 Random notification scheduler is active (5-11 PM)');
        });
    }).catch((errors)=>{
        console.log("Failed while connecting to dB",errors);
        process.exit(1);
    })