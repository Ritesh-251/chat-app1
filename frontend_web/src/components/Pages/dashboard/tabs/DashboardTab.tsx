import { motion } from "framer-motion";
import { MessageSquare, Users, BarChart2, AlertTriangle, Download } from "lucide-react";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { KPI } from "../KPI";
import { adminApiService } from "../../../../services/adminApi";
import { COLORS, BRAND_GREEN, RADIUS } from "../mockData";
import { exportToExcel } from "../../../../utils/exportToExcel";

export function DashboardTab() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      
      const [statsResponse, analyticsResponse, chatsResponse] = await Promise.all([
        adminApiService.getDashboardStats(),
        adminApiService.getAnalytics(),
        adminApiService.getRecentChats(5)
      ]);

      console.log('Dashboard stats:', statsResponse);
      console.log('Analytics data:', analyticsResponse);
      console.log('Recent chats:', chatsResponse);

      setDashboardData(statsResponse.data);
      setAnalyticsData(analyticsResponse.data);
      setRecentChats(chatsResponse.data?.chats || []);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = dashboardData?.kpis || {};
  // Use backend analytics keys
  const chartData = analyticsData?.chatTrends || [];
  // If you have no hourlyData, use an empty array or mock
  const hourlyData = analyticsData?.hourlyData || [];
  // Map topUsers to pie chart data
  const topicsData = (analyticsData?.topUsers || []).map((u: any) => ({
    name: u.name || 'Unknown',
    value: u.chatCount || 0,
  }));

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Dashboard Overview</h2>
        <button 
          onClick={fetchDashboardData}
          disabled={loading}
          className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 disabled:bg-gray-400 flex items-center gap-2"
        >
          <BarChart2 className="w-4 h-4" />
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPI title="Total Students" value={kpis.totalUsers?.toString() || "0"} icon={<Users color={BRAND_GREEN} />} />
        <KPI title="Total Messages" value={kpis.totalChats?.toString() || "0"} icon={<MessageSquare color={BRAND_GREEN} />} />
        <KPI title="Active Today" value={kpis.activeChats?.toString() || "0"} icon={<BarChart2 color={BRAND_GREEN} />} />
        <KPI title="Flags Today" value={kpis.flaggedContent?.toString() || "0"} icon={<AlertTriangle color={BRAND_GREEN} />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className={`bg-white ${RADIUS} border border-neutral-200 shadow-sm`}>
          <div className="p-4 border-b border-neutral-200">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> Usage Trend
            </h3>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="_id" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke={BRAND_GREEN} strokeWidth={3} dot={{ fill: BRAND_GREEN, strokeWidth: 0, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white ${RADIUS} border border-neutral-200 shadow-sm`}>
          <div className="p-4 border-b border-neutral-200">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> Topics Split
            </h3>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={topicsData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70}>
                  {topicsData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live feed & quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`bg-white ${RADIUS} border border-neutral-200 shadow-sm`}>
          <div className="p-4 border-b border-neutral-200">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Live Feed
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {recentChats.map((chat: any, idx: number) => (
              <motion.div
                key={chat._id || idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-start justify-between bg-white border border-neutral-200 ${RADIUS} p-3`}
              >
                <div>
                  <div className="font-medium">{chat.user?.name || 'Unknown User'}</div>
                  <div className="text-sm text-neutral-600">
                    {chat.messages?.[0]?.content?.substring(0, 50) || 'No message content'}...
                  </div>
                </div>
                <span className="text-xs bg-neutral-100 px-2 py-1 rounded">
                  {new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className={`bg-white ${RADIUS} border border-neutral-200 shadow-sm`}>
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="font-semibold">Quick Actions</h3>
            <div className="flex gap-2">
              <button 
                className={`px-3 py-2 ${RADIUS} text-white flex items-center gap-2`}
                style={{ backgroundColor: BRAND_GREEN }}
                onClick={async () => {
                  try {
                    // Try backend export first
                    await adminApiService.exportData('all', 'xlsx');
                  } catch (err) {
                    // Fallback: export KPIs and chart data
                    const rows = chartData.map((row: any) => ({
                      date: row._id,
                      count: row.count
                    }));
                    exportToExcel(rows, `dashboard-usage-${new Date().toISOString().split('T')[0]}.xlsx`);
                  }
                }}
              >
                <Download className="w-4 h-4" /> Export to Excel
              </button>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm text-neutral-600">Download selected class or student conversations for record keeping.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
