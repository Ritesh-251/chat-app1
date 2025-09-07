import { motion } from "framer-motion";
import { MessageSquare, Users, BarChart2, AlertTriangle, Download, FileSpreadsheet, Clock } from "lucide-react";
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
import { COLORS, BRAND_GREEN } from "../mockData";
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
  // Map topUsers to pie chart data
  const topicsData = (analyticsData?.topUsers || []).map((u: any) => ({
    name: u.name || 'Unknown',
    value: u.chatCount || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Export Actions */}
      <div className="flex justify-end items-center">
        <button 
          onClick={fetchDashboardData}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 shadow-sm transition-colors"
        >
          <BarChart2 className="w-4 h-4" />
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPI title="Total Students" value={kpis.totalUsers?.toString() || "0"} icon={<Users color={BRAND_GREEN} />} />
        <KPI title="Total Messages" value={kpis.totalChats?.toString() || "0"} icon={<MessageSquare color={BRAND_GREEN} />} />
        <KPI title="Active Today" value={kpis.activeChats?.toString() || "0"} icon={<BarChart2 color={BRAND_GREEN} />} />
        <KPI title="Flags Today" value={kpis.flaggedContent?.toString() || "0"} icon={<AlertTriangle color={BRAND_GREEN} />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-green-50 to-green-100/50">
            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-green-600" /> Usage Trend
            </h3>
            <p className="text-sm text-neutral-600 mt-1">Daily chat activity over time</p>
          </div>
          <div className="p-6 h-64">
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

        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-green-50 to-green-100/50">
            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-green-600" /> Most Active Students
            </h3>
            <p className="text-sm text-neutral-600 mt-1">Students with highest chat engagement</p>
          </div>
          <div className="p-6 h-64">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-green-50 to-green-100/50">
            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" /> Recent Activity
            </h3>
            <p className="text-sm text-neutral-600 mt-1">Latest student conversations</p>
          </div>
          <div className="p-6 space-y-4">
            {recentChats.map((chat: any, idx: number) => (
              <motion.div
                key={chat._id || idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start justify-between bg-neutral-50 border border-neutral-200 rounded-lg p-4 hover:bg-green-50 transition-colors"
              >
                <div>
                  <div className="font-medium text-neutral-900">{chat.user?.name || 'Unknown User'}</div>
                  <div className="text-sm text-neutral-600 mt-1">
                    {chat.messages?.[0]?.content?.substring(0, 50) || 'No message content'}...
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">{new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-green-50 to-green-100/50">
            <div className="flex items-center gap-3 mb-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-neutral-900">Data Export Center</h3>
            </div>
            <p className="text-sm text-neutral-600">Download comprehensive reports and analytics</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Export Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-neutral-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{kpis.totalUsers || 0}</div>
                <div className="text-xs text-neutral-600 mt-1">Students</div>
              </div>
              <div className="bg-neutral-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{kpis.totalChats || 0}</div>
                <div className="text-xs text-neutral-600 mt-1">Total Chats</div>
              </div>
              <div className="bg-neutral-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{recentChats.length || 0}</div>
                <div className="text-xs text-neutral-600 mt-1">Recent Messages</div>
              </div>
              <div className="bg-neutral-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{kpis.flaggedContent || 0}</div>
                <div className="text-xs text-neutral-600 mt-1">Flagged Items</div>
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-4">
              <h4 className="font-medium text-neutral-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-green-600" />
                Available Exports
              </h4>
              
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900">Complete Data Export</div>
                      <div className="text-sm text-neutral-600">Students, chats, messages, and usage logs</div>
                    </div>
                  </div>
                  <button 
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                    onClick={async () => {
                      try {
                        await adminApiService.exportData('all', 'xlsx');
                      } catch (err) {
                        const rows = chartData.map((row: any) => ({
                          date: row._id,
                          count: row.count
                        }));
                        exportToExcel(rows, `complete-export-${new Date().toISOString().split('T')[0]}.xlsx`);
                      }
                    }}
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900">Analytics Summary</div>
                      <div className="text-sm text-neutral-600">Usage trends and engagement metrics</div>
                    </div>
                  </div>
                  <button 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                    onClick={() => {
                      const analyticsRows = [
                        { metric: 'Total Students', value: kpis.totalUsers || 0 },
                        { metric: 'Total Chats', value: kpis.totalChats || 0 },
                        { metric: 'Active Today', value: kpis.activeChats || 0 },
                        { metric: 'Flagged Content', value: kpis.flaggedContent || 0 },
                        ...chartData.map((row: any) => ({
                          metric: `Usage on ${row._id}`,
                          value: row.count
                        }))
                      ];
                      exportToExcel(analyticsRows, `analytics-${new Date().toISOString().split('T')[0]}.xlsx`);
                    }}
                  >
                    <BarChart2 className="w-4 h-4" /> Export
                  </button>
                </div>
              </div>
            </div>

            {/* Export Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-900">Export Information</h5>
                  <p className="text-sm text-blue-700 mt-1">
                    Last export: Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Data includes all records up to the current moment. Exports are generated in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
