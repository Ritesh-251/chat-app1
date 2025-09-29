import { Request, Response } from "express";
import Admin from "../models/admin.model";
import User from "../models/user.model";
import Chat from "../models/chat.model";
import { UsageLog } from "../models/usageLog.model";
import { getUserModel, getChatModel, getUsageLogModel } from '../db/model-registry';
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
        // Determine which app(s) to export. Allow optional `appId` query param
        const requestedAppParam = (req.query.appId as string) || '';
        let APP_IDS: string[] = (process.env.APP_IDS && process.env.APP_IDS.split(',')) || ['app1', 'app2'];
        if (requestedAppParam) {
            // support comma-separated list or single app id
            const requested = requestedAppParam.split(',').map(s => s.trim()).filter(Boolean);
            if (requested.length) {
                APP_IDS = requested;
            }
        }

        // We'll collect combined arrays as well as create per-app sheets
        let combinedUsers: any[] = [];
        let combinedChats: any[] = [];
        let combinedUsageLogs: any[] = [];

        // Create a workbook early so we can append per-app sheets
        const workbook = XLSX.utils.book_new();

        for (const appId of APP_IDS) {
            try {
                const UserModel = getUserModel(appId);
                const ChatModel = getChatModel(appId);
                const UsageModel = getUsageLogModel(appId);

                const users = await UserModel.find().lean();
                const chats = await ChatModel.find({ status: { $ne: 'user-deleted' } })
                    .populate('userId', 'name email batch course country')
                    .select('messages createdAt updatedAt flagged flagReason userId')
                    .lean();
                const usageLogs = await UsageModel.find().lean();

                // Build a quick map of userId -> email for linking when population isn't available
                const emailByUserId: Record<string, string> = {};
                users.forEach((u: any) => {
                    if (u._id) emailByUserId[u._id.toString()] = u.email || '';
                });

                // ---------- Students sheet for this app ----------
                const studentsSheetApp = users.map((u: any) => {
                    const userEmail = u.email || '';
                    const userChats = chats.filter((c: any) => {
                        // Determine chat's user email
                        let chatEmail = '';
                        if (c.userId && typeof c.userId === 'object' && c.userId.email) {
                            chatEmail = c.userId.email;
                        } else if (c.userId) {
                            chatEmail = emailByUserId[(c.userId as any).toString()] || '';
                        }
                        return chatEmail && userEmail && chatEmail.toLowerCase() === userEmail.toLowerCase();
                    });

                    const lastActivity = userChats.length
                        ? new Date(Math.max(...userChats.map((c: any) => new Date(c.updatedAt).getTime()))).toLocaleString()
                        : '';

                    return {
                        AppID: appId,
                        UserEmail: userEmail,
                        Batch: u.batch || '',
                        Course: u.course || '',
                        Country: u.country || '',
                        ChatCount: userChats.length,
                        LastActivity: lastActivity,
                        CreatedAt: u.createdAt ? new Date(u.createdAt).toLocaleString() : ''
                    };
                });

                // ---------- Chats sheet for this app (use email instead of userId) ----------
                const chatsSheetApp = chats.map((c: any) => {
                    let userEmail = '';
                    if (c.userId && typeof c.userId === 'object' && c.userId.email) {
                        userEmail = c.userId.email || '';
                    } else if (c.userId) {
                        userEmail = emailByUserId[(c.userId as any).toString()] || '';
                    }

                    return {
                        AppID: appId,
                        ChatID: c._id?.toString() || '',
                        UserEmail: userEmail,
                        MessageCount: c.messages?.length || 0,
                        Flagged: c.flagged ? 'true' : 'false',
                        FlagReason: c.flagReason || '',
                        CreatedAt: c.createdAt ? new Date(c.createdAt).toLocaleString() : '',
                        UpdatedAt: c.updatedAt ? new Date(c.updatedAt).toLocaleString() : ''
                    };
                });

                // ---------- Messages sheet for this app (attach user email) ----------
                const messagesSheetApp: any[] = [];
                chats.forEach((c: any) => {
                    const chatId = c._id?.toString() || '';
                    let chatEmail = '';
                    if (c.userId && typeof c.userId === 'object' && c.userId.email) {
                        chatEmail = c.userId.email || '';
                    } else if (c.userId) {
                        chatEmail = emailByUserId[(c.userId as any).toString()] || '';
                    }

                    if (Array.isArray(c.messages)) {
                        c.messages.forEach((m: any, idx: number) => {
                            messagesSheetApp.push({
                                AppID: appId,
                                MessageID: m._id?.toString() || `${chatId}-${idx}`,
                                ChatID: chatId,
                                UserEmail: chatEmail,
                                Sender: m.role === 'user' ? 'User' : 'AI',
                                Content: m.content || '',
                                Timestamp: m.timestamp ? new Date(m.timestamp).toLocaleString() : ''
                            });
                        });
                    }
                });

                // ---------- Usage Logs sheet for this app (attach user email when possible) ----------
                const usageLogsSheetApp = usageLogs.map((log: any) => {
                    const uid = (log.userId || '')?.toString ? (log.userId || '').toString() : '';
                    const userEmail = uid ? (emailByUserId[uid] || '') : '';
                    return {
                        AppID: appId,
                        LogID: log._id?.toString() || '',
                        UserEmail: userEmail,
                        Package: log.package || '',
                        TimeUsed: log.timeUsed || 0,
                        StartTime: log.startTime ? new Date(log.startTime).toLocaleString() : '',
                        EndTime: log.endTime ? new Date(log.endTime).toLocaleString() : '',
                        CreatedAt: log.createdAt ? new Date(log.createdAt).toLocaleString() : ''
                    };
                });

                // Append per-app sheets to workbook
                XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(studentsSheetApp), `Students_${appId}`);
                XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(chatsSheetApp), `Chats_${appId}`);
                XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(messagesSheetApp), `Messages_${appId}`);
                XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(usageLogsSheetApp), `Usage_${appId}`);

                // Add to combined arrays for optional global sheets
                combinedUsers = combinedUsers.concat(users.map((u: any) => ({ ...u, _appId: appId })));
                combinedChats = combinedChats.concat(chats.map((c: any) => ({ ...c, _appId: appId })));
                combinedUsageLogs = combinedUsageLogs.concat(usageLogs.map((l: any) => ({ ...l, _appId: appId })));
            } catch (err: any) {
                console.warn(`⚠️ Skipping app ${appId} during export:`, err?.message || err);
            }
        }

        // Optionally build combined sheets (All apps) using email-based linking
        // Build combined students summary by email
        const combinedStudentsByEmail: Record<string, any> = {};
        combinedUsers.forEach((u: any) => {
            const email = (u.email || '').toLowerCase();
            if (!combinedStudentsByEmail[email]) {
                combinedStudentsByEmail[email] = { UserEmail: u.email || '', AppIDs: new Set([u._appId]), Batch: u.batch || '', Course: u.course || '', Country: u.country || '', CreatedAt: u.createdAt ? new Date(u.createdAt).toLocaleString() : '' };
            } else {
                combinedStudentsByEmail[email].AppIDs.add(u._appId);
            }
        });

        // Attach chat counts and last activity to combined students
        Object.keys(combinedStudentsByEmail).forEach(email => {
            const student = combinedStudentsByEmail[email];
            const studentChats = combinedChats.filter((c: any) => {
                // Determine chat email
                let chatEmail = '';
                if (c.userId && typeof c.userId === 'object' && c.userId.email) chatEmail = c.userId.email;
                else if (c.userId) chatEmail = c.userId.toString();
                return chatEmail && chatEmail.toLowerCase() === email;
            });
            student.ChatCount = studentChats.length;
            student.LastActivity = studentChats.length ? new Date(Math.max(...studentChats.map((c: any) => new Date(c.updatedAt).getTime()))).toLocaleString() : '';
            student.AppIDs = Array.from(student.AppIDs).join(',');
        });

        const combinedStudentsSheet = Object.values(combinedStudentsByEmail).map((s: any) => ({ AppIDs: s.AppIDs, UserEmail: s.UserEmail, Batch: s.Batch, Course: s.Course, Country: s.Country, ChatCount: s.ChatCount || 0, LastActivity: s.LastActivity || '', CreatedAt: s.CreatedAt }));

        // Combined chats/messages/usage can be built similarly if requested; for brevity we create a combined chats sheet keyed by email
        const combinedChatsSheet = combinedChats.map((c: any) => {
            let userEmail = '';
            if (c.userId && typeof c.userId === 'object' && c.userId.email) userEmail = c.userId.email || '';
            else if (c.userId) userEmail = (c.userId || '').toString();
            return { AppID: c._appId || '', ChatID: c._id?.toString() || '', UserEmail: userEmail, MessageCount: c.messages?.length || 0, Flagged: c.flagged ? 'true' : 'false', FlagReason: c.flagReason || '', CreatedAt: c.createdAt ? new Date(c.createdAt).toLocaleString() : '', UpdatedAt: c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '' };
        });

        const combinedMessagesSheet: any[] = [];
        combinedChats.forEach((c: any) => {
            const chatId = c._id?.toString() || '';
            let chatEmail = '';
            if (c.userId && typeof c.userId === 'object' && c.userId.email) chatEmail = c.userId.email || '';
            else if (c.userId) chatEmail = (c.userId || '').toString();
            if (Array.isArray(c.messages)) {
                c.messages.forEach((m: any, idx: number) => {
                    combinedMessagesSheet.push({ AppID: c._appId || '', MessageID: m._id?.toString() || `${chatId}-${idx}`, ChatID: chatId, UserEmail: chatEmail, Sender: m.role === 'user' ? 'User' : 'AI', Content: m.content || '', Timestamp: m.timestamp ? new Date(m.timestamp).toLocaleString() : '' });
                });
            }
        });

        const combinedUsageLogsSheet = combinedUsageLogs.map((log: any) => ({ AppID: log._appId || '', LogID: log._id?.toString() || '', UserID: log.userId?.toString() || '', Package: log.package || '', TimeUsed: log.timeUsed || 0, StartTime: log.startTime ? new Date(log.startTime).toLocaleString() : '', EndTime: log.endTime ? new Date(log.endTime).toLocaleString() : '', CreatedAt: log.createdAt ? new Date(log.createdAt).toLocaleString() : '' }));

        // Append combined sheets after per-app sheets
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(combinedStudentsSheet), `All_Students`);
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(combinedChatsSheet), `All_Chats`);
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(combinedMessagesSheet), `All_Messages`);
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(combinedUsageLogsSheet), `All_Usage`);

        if (format === 'xlsx') {
            // Generate buffer
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            // Set headers for file download
            const fileName = `chat-app-export-${new Date().toISOString().split('T')[0]}.xlsx`;
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        } else {
            // Return JSON format with per-app and combined data
            res.status(200).json({
                success: true,
                data: {
                    combined: {
                        students: combinedStudentsSheet,
                        chats: combinedChatsSheet,
                        messages: combinedMessagesSheet,
                        usageLogs: combinedUsageLogsSheet
                    }
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
