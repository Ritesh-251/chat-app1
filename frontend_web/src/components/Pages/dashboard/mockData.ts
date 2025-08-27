// Mock data for the teacher dashboard
export const usageTrend = [
  { day: "Mon", messages: 320 },
  { day: "Tue", messages: 410 },
  { day: "Wed", messages: 510 },
  { day: "Thu", messages: 470 },
  { day: "Fri", messages: 660 },
  { day: "Sat", messages: 380 },
  { day: "Sun", messages: 290 },
];

export const hourBars = Array.from({ length: 12 }).map((_, i) => ({
  hour: `${i + 8}:00`,
  count: Math.round(50 + Math.random() * 150),
}));

export const topicPie = [
  { name: "Math", value: 30 },
  { name: "Science", value: 24 },
  { name: "History", value: 16 },
  { name: "Programming", value: 18 },
  { name: "Other", value: 12 },
];

export const students = [
  { name: "Aarav Sharma", class: "CSE-A", lastActive: "10:42", totalChats: 128, flagged: 0 },
  { name: "Isha Gupta", class: "CSE-B", lastActive: "10:35", totalChats: 152, flagged: 1 },
  { name: "Rohan Mehta", class: "CSE-A", lastActive: "09:58", totalChats: 99, flagged: 0 },
  { name: "Neha Verma", class: "CSE-C", lastActive: "09:41", totalChats: 143, flagged: 2 },
  { name: "Kabir Singh", class: "CSE-A", lastActive: "09:20", totalChats: 77, flagged: 0 },
];

export const liveFeed = [
  { student: "Aarav", snippet: "Explain dynamic programming with example…", time: "now" },
  { student: "Isha", snippet: "Is this sentence grammatically correct?", time: "1m" },
  { student: "Rohan", snippet: "Why is Big-O important?", time: "3m" },
  { student: "Neha", snippet: "Derive the kinematics equation…", time: "4m" },
];

export const COLORS = ["#2E7D32", "#66BB6A", "#A5D6A7", "#1B5E20", "#81C784"];

export const BRAND_GREEN = "#2E7D32";
export const RADIUS = "rounded-[14px]";
