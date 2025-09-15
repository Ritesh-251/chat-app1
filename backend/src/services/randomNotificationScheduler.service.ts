import cron from 'node-cron';
import admin from "../firebase.js";
import User from "../models/user.model.js";

class RandomNotificationScheduler {
    private scheduledJobs: Map<string, any> = new Map();
    
    // Time-specific messages for different periods
    private notificationMessages = {
        early: [ // 5-6 PM (Early evening)
            "🌅 Evening study session time! Let's make it productive!",
            "📚 Perfect time to review today's learnings!",
            "⚡ Quick 30-min study boost before dinner?",
            "🎯 Focus mode: ON! Let's tackle one topic!",
            "💡 Your brain is fresh - ideal time to learn!"
        ],
        prime: [ // 7-9 PM (Prime study time)
            "🔥 Prime study hours! This is your golden time!",
            "🚀 Peak focus time - let's dive deep into learning!",
            "🧠 Your mind is at its sharpest right now!",
            "📖 The best students study at this hour - join them!",
            "💪 Power through that challenging chapter now!",
            "🌟 Make this evening count - future you will thank you!"
        ],
        late: [ // 9-11 PM (Late evening)
            "🌙 Evening wind-down with some light reading?",
            "📝 Perfect time for revision before bed!",
            "🔖 Quick review session to end the day strong!",
            "💭 Let knowledge be your last thought tonight!",
            "📑 Light study session = sweet dreams!"
        ]
    };

    constructor() {
        this.initializeDailyScheduler();
        console.log('🔔 Random Notification Scheduler initialized');
    }

    /**
     * Initialize daily scheduler that sets random times each day
     */
    private initializeDailyScheduler() {
        // Run every day at 12:01 AM to schedule random notifications for the day
        cron.schedule('1 0 * * *', () => {
            console.log('🗓️ Setting up random notifications for today...');
            this.scheduleRandomNotificationsForToday();
        });

        // Also schedule for today on startup
        this.scheduleRandomNotificationsForToday();
    }

    /**
     * Schedule 1-3 random notifications between 5 PM - 11 PM
     */
    private scheduleRandomNotificationsForToday() {
        // Clear existing scheduled jobs for today
        this.clearTodaysJobs();

        // Generate 1-3 random times between 5 PM (17:00) and 11 PM (23:00)
        const numberOfNotifications = Math.floor(Math.random() * 3) + 1; // 1-3 notifications
        const randomTimes = this.generateRandomTimes(17, 23, numberOfNotifications);

        console.log(`📅 Scheduling ${numberOfNotifications} random notifications for today:`, 
                   randomTimes.map(time => `${time.hour}:${time.minute.toString().padStart(2, '0')}`));

        // Schedule each random time
        randomTimes.forEach((time, index) => {
            const jobKey = `random-${Date.now()}-${index}`;
            const cronExpression = `${time.minute} ${time.hour} * * *`;
            
            const job = cron.schedule(cronExpression, async () => {
                await this.sendRandomNotification(time.hour);
                console.log(`✅ Sent random notification at ${time.hour}:${time.minute.toString().padStart(2, '0')}`);
            }, {
                timezone: "Asia/Kolkata" // Adjust timezone as needed
            });

            this.scheduledJobs.set(jobKey, job);
        });
    }

    /**
     * Generate random times between start and end hour
     */
    private generateRandomTimes(startHour: number, endHour: number, count: number) {
        const times = [];
        const usedTimes = new Set();

        while (times.length < count) {
            const hour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
            const minute = Math.floor(Math.random() * 60);
            const timeKey = `${hour}:${minute}`;

            // Avoid duplicate times
            if (!usedTimes.has(timeKey)) {
                times.push({ hour, minute });
                usedTimes.add(timeKey);
            }
        }

        // Sort by time
        return times.sort((a, b) => a.hour === b.hour ? a.minute - b.minute : a.hour - b.hour);
    }

    /**
     * Send notification to all active users
     */
    private async sendRandomNotification(hour: number) {
        try {
            // Get appropriate message based on time
            const messageCategory = this.getMessageCategory(hour);
            const messages = this.notificationMessages[messageCategory];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];

            // Get all users (we'll improve this to get FCM tokens from database later)
            const users = await User.find({ isActive: { $ne: false } }).select('_id email');
            
            console.log(`📢 Sending random notification to ${users.length} users: "${randomMessage}"`);

            // For now, we'll use the existing endpoint logic
            // TODO: Get actual FCM tokens from user tokens collection
            const notificationPayload = {
                notification: {
                    title: this.getNotificationTitle(hour),
                    body: randomMessage,
                },
                data: {
                    type: 'study_reminder',
                    hour: hour.toString(),
                    timestamp: new Date().toISOString()
                }
            };

            // This would send to stored FCM tokens
            // For now, just log the notification
            console.log('📱 Notification ready to send:', notificationPayload);

            // TODO: Send to actual FCM tokens when we have them stored
            // await this.sendToStoredFCMTokens(notificationPayload);

        } catch (error) {
            console.error('❌ Error sending random notification:', error);
        }
    }

    /**
     * Get message category based on hour
     */
    private getMessageCategory(hour: number): 'early' | 'prime' | 'late' {
        if (hour >= 17 && hour < 19) return 'early';
        if (hour >= 19 && hour < 21) return 'prime';
        return 'late';
    }

    /**
     * Get notification title based on time
     */
    private getNotificationTitle(hour: number): string {
        if (hour >= 17 && hour < 19) return "🌅 Evening Study Time";
        if (hour >= 19 && hour < 21) return "🔥 Prime Study Hours";
        return "🌙 Night Study Session";
    }

    /**
     * Clear all scheduled jobs for today
     */
    private clearTodaysJobs() {
        this.scheduledJobs.forEach((job, key) => {
            job.destroy();
        });
        this.scheduledJobs.clear();
    }

    /**
     * Get today's scheduled times (for debugging)
     */
    public getTodaysSchedule() {
        return Array.from(this.scheduledJobs.keys());
    }

    /**
     * Manually trigger a test notification
     */
    public async sendTestNotification() {
        const currentHour = new Date().getHours();
        await this.sendRandomNotification(currentHour);
    }
}

export default RandomNotificationScheduler;