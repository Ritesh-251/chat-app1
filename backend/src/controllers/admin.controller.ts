import { Request, Response } from "express";
import Admin from "../models/admin.model";
import User from "../models/user.model";
import Chat from "../models/chat.model";
import { UsageLog } from "../models/usageLog.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/Apierror";
import * as XLSX from 'xlsx';

// Extend Request interface to include admin
declare global {
    namespace Express {
        interface Request {
            admin?: any;
        }
    }
}

// Admin Login
export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Check if admin is active
    if (!admin.isActive) {
        throw new ApiError(401, "Admin account is deactivated");
    }

    // Verify password
    const isPasswordValid = await admin.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Generate access token
    const accessToken = admin.generateAccessToken();

    // Remove password from response
    const adminData = {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive,
        createdAt: admin.createdAt
    };

    res.status(200).json({
        success: true,
        message: "Admin logged in successfully",
        data: {
            admin: adminData,
            accessToken
        }
    });
});

// Admin Signup
export const adminSignup = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
        throw new ApiError(409, "Admin with this email already exists");
    }

    // Create new admin
    const admin = await Admin.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        isActive: true
    });

    // Generate access token
    const accessToken = admin.generateAccessToken();

    // Remove password from response
    const adminData = {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive,
        createdAt: admin.createdAt
    };

    res.status(201).json({
        success: true,
        message: "Admin account created successfully",
        data: {
            admin: adminData,
            accessToken
        }
    });
});

// Admin Logout
export const adminLogout = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Admin logged out successfully"
    });
});

// Get Admin Profile
export const getAdminProfile = asyncHandler(async (req: Request, res: Response) => {
    const admin = await Admin.findById(req.admin._id).select("-password");
    
    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    res.status(200).json({
        success: true,
        data: admin
    });
});

// Get Dashboard Stats/KPIs
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    try {
        // Get total users count
        const totalUsers = await User.countDocuments();
        
        // Get active chats (chats from last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const activeChats = await Chat.countDocuments({
            createdAt: { $gte: yesterday },
            isActive: true
        });

        // Get total chats
        const totalChats = await Chat.countDocuments({
            isActive: true
        });

        // Get flagged content count (assuming we have a flagged field)
        const flaggedContent = await Chat.countDocuments({
            flagged: true,
            isActive: true
        });

        // Calculate average response time (mock data for now)
        const avgResponseTime = "2.3s";

        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const dailyStats = await Chat.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo },
                    isActive: true
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                kpis: {
                    totalUsers,
                    activeChats,
                    totalChats,
                    flaggedContent,
                    avgResponseTime
                },
                chartData: dailyStats,
                lastUpdated: new Date()
            }
        });
    } catch (error) {
        throw new ApiError(500, "Error fetching dashboard stats");
    }
});

// Get All Students
export const getAllStudents = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = "" } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    const searchQuery = search 
        ? {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        }
        : {};

    // Get users with chat count and most recent chat
    const students = await User.aggregate([
        { $match: searchQuery },
        {
            $lookup: {
                from: 'chats',
                let: { userId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $and: [ { $eq: ['$userId', '$$userId'] }, { $ne: ['$status', 'user-deleted'] } ] } } },
                    { $sort: { createdAt: -1 } },
                ],
                as: 'chats',
            }
        },
        {
            $addFields: {
                chatCount: { $size: '$chats' },
                lastActivity: { $max: '$chats.createdAt' },
                recentChat: {
                    $cond: [
                        { $gt: [ { $size: '$chats' }, 0 ] },
                        {
                            $let: {
                                vars: { rc: { $arrayElemAt: ['$chats', 0] } },
                                in: {
                                    chatId: '$$rc._id',
                                    createdAt: '$$rc.createdAt',
                                    title: { $ifNull: ['$$rc.title', ''] },
                                    firstMessage: {
                                        $cond: [
                                            { $gt: [ { $size: '$$rc.messages' }, 0 ] },
                                            { $arrayElemAt: ['$$rc.messages.content', 0] },
                                            ''
                                        ]
                                    }
                                }
                            }
                        },
                        null
                    ]
                }
            }
        },
        {
            $project: {
                password: 0,
                chats: 0,
                isActive: 1,
                course: 1
            }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum }
    ]);

    const totalStudents = await User.countDocuments(searchQuery);

    res.status(200).json({
        success: true,
        data: {
            students,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalStudents / limitNum),
                totalStudents,
                hasNext: pageNum * limitNum < totalStudents,
                hasPrev: pageNum > 1
            }
        }
    });
});

// Get All Chats
export const getAllChats = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, userId, flagged } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filterQuery: any = { status: { $ne: 'user-deleted' } };
    
    if (userId) {
        filterQuery.userId = userId;
    }
    
    if (flagged === 'true') {
        filterQuery.flagged = true;
    }

    const chats = await Chat.find(filterQuery)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    const totalChats = await Chat.countDocuments(filterQuery);

    res.status(200).json({
        success: true,
        data: {
            chats,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalChats / limitNum),
                totalChats,
                hasNext: pageNum * limitNum < totalChats,
                hasPrev: pageNum > 1
            }
        }
    });
});

// Get Analytics Data
export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { period = '7d' } = req.query;
    
    let startDate = new Date();
    
    switch (period) {
        case '24h':
            startDate.setHours(startDate.getHours() - 24);
            break;
        case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
        default:
            startDate.setDate(startDate.getDate() - 7);
    }

    // Chat trends over time
    const chatTrends = await Chat.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
                status: { $ne: 'user-deleted' }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { 
                        format: period === '24h' ? "%H:00" : "%Y-%m-%d", 
                        date: "$createdAt" 
                    }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Top users by chat count
    const topUsers = await Chat.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
                status: { $ne: 'user-deleted' }
            }
        },
        {
            $group: {
                _id: '$userId',
                chatCount: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
            }
        },
        {
            $unwind: '$user'
        },
        {
            $project: {
                name: '$user.name',
                email: '$user.email',
                chatCount: 1
            }
        },
        { $sort: { chatCount: -1 } },
        { $limit: 10 }
    ]);

    res.status(200).json({
        success: true,
        data: {
            period,
            chatTrends,
            topUsers,
            generatedAt: new Date()
        }
    });
});

// Export Data to Excel
export const exportData = asyncHandler(async (req: Request, res: Response) => {
    const { type = 'all', format = 'xlsx' } = req.query;

    try {
        let data: any = {};


        // Get all students
        const students = await User.find().lean();
        // Get all chats with user and messages
        const chats = await Chat.find({ status: { $ne: 'user-deleted' } })
            .populate('userId', 'name email batch course country')
            .select('messages createdAt updatedAt flagged flagReason userId')
            .lean();
        // Get all usage logs - only include user ID without populating
        const usageLogs = await UsageLog.find().lean();

        // Build Students sheet
      // ---------- Students ----------
const studentsSheet = students.map((u) => ({
  UserID: u._id.toString() || "",
  Batch: u.batch || "",
  Course: u.course || "",
  Country: u.country || "",
  ChatCount: chats.filter(
    (c) =>
      c.userId &&
      typeof c.userId === "object" &&
      (c.userId as any)._id.equals(u._id)
  ).length,
  LastActivity: (() => {
    const userChats = chats.filter(
      (c) =>
        c.userId &&
        typeof c.userId === "object" &&
        (c.userId as any)._id.equals(u._id)
    );
    if (!userChats.length) return "";
    return new Date(
      Math.max(...userChats.map((c) => new Date(c.updatedAt).getTime()))
    ).toLocaleString();
  })(),
  CreatedAt: u.createdAt ? new Date(u.createdAt).toLocaleString() : "",
}));


  
// ---------- Chats ----------
const chatsSheet = chats.map((c) => {
  let userId = "";

  if (c.userId && typeof c.userId === "object" && c.userId !== null) {
    if ("_id" in c.userId) {
      userId = (c.userId as any)._id.toString() || "";
    }
  }

  return {
    ChatID: c._id?.toString() || "",
    UserID: userId,
    MessageCount: c.messages?.length || 0,
    Flagged: c.flagged ? "true" : "false",
    FlagReason: c.flagReason || "",
    CreatedAt: c.createdAt
      ? new Date(c.createdAt).toLocaleString()
      : "",
    UpdatedAt: c.updatedAt
      ? new Date(c.updatedAt).toLocaleString()
      : "",
  };
});

        // Build Messages sheet
        let messagesSheet: any[] = [];
        chats.forEach((c) => {
            if (Array.isArray(c.messages)) {
                c.messages.forEach((m, idx) => {
                    messagesSheet.push({
                        MessageID: m._id?.toString() || `${c._id}-${idx}`,
                        ChatID: c._id?.toString() || '',
                        Sender: m.role === 'user' ? 'User' : 'AI',
                        Content: m.content || '',
                        Timestamp: m.timestamp ? new Date(m.timestamp).toLocaleString() : ''
                    });
                });
            }
        });

        // Build Usage Logs sheet
        const usageLogsSheet = usageLogs.map((log) => {
            return {
                LogID: log._id?.toString() || "",
                UserID: log.userId?.toString() || "",
                Package: log.package || "",
                TimeUsed: log.timeUsed || 0,
                StartTime: log.startTime ? new Date(log.startTime).toLocaleString() : "",
                EndTime: log.endTime ? new Date(log.endTime).toLocaleString() : "",
                CreatedAt: log.createdAt ? new Date(log.createdAt).toLocaleString() : "",
            };
        });

        if (format === 'xlsx') {
            // Create Excel workbook
            const workbook = XLSX.utils.book_new();
            // Add Students sheet
            const studentsWS = XLSX.utils.json_to_sheet(studentsSheet);
            XLSX.utils.book_append_sheet(workbook, studentsWS, "Students");
            // Add Chats sheet
            const chatsWS = XLSX.utils.json_to_sheet(chatsSheet);
            XLSX.utils.book_append_sheet(workbook, chatsWS, "Chats");
            // Add Messages sheet
            const messagesWS = XLSX.utils.json_to_sheet(messagesSheet);
            XLSX.utils.book_append_sheet(workbook, messagesWS, "Messages");
            // Add Usage Logs sheet
            const usageLogsWS = XLSX.utils.json_to_sheet(usageLogsSheet);
            XLSX.utils.book_append_sheet(workbook, usageLogsWS, "Usage Logs");
            // Generate buffer
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            // Set headers for file download
            const fileName = `chat-app-export-${new Date().toISOString().split('T')[0]}.xlsx`;
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        } else {
            // Return JSON format
            res.status(200).json({
                success: true,
                data: {
                    students: studentsSheet,
                    chats: chatsSheet,
                    messages: messagesSheet,
                    usageLogs: usageLogsSheet
                },
                exportedAt: new Date()
            });
        }

    } catch (error) {
        throw new ApiError(500, "Error exporting data");
    }
});

// Get Flagged Content
export const getFlaggedContent = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const flaggedChats = await Chat.find({ 
        flagged: true,
        status: { $ne: 'user-deleted' }
    })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

    const totalFlagged = await Chat.countDocuments({ 
        flagged: true,
        status: { $ne: 'user-deleted' }
    });

    res.status(200).json({
        success: true,
        data: {
            flaggedChats,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalFlagged / limitNum),
                totalFlagged,
                hasNext: pageNum * limitNum < totalFlagged,
                hasPrev: pageNum > 1
            }
        }
    });
});

// Toggle Flag on Chat
export const toggleChatFlag = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { flagged, reason } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    chat.flagged = flagged;
    if (reason) {
        chat.flagReason = reason;
    }
    
    await chat.save();

    res.status(200).json({
        success: true,
        message: `Chat ${flagged ? 'flagged' : 'unflagged'} successfully`,
        data: chat
    });
});
