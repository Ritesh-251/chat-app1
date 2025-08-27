import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Pages/Loginpage';
import Signup from './components/auth/Signuppage';
import { LogoutButton } from './components/auth/LogoutButton';
import { DashboardTab } from './components/Pages/dashboard/tabs/DashboardTab';
import { StudentsTab } from './components/Pages/dashboard/tabs/StudentsTab';
// import { AnalyticsTab } from './components/Pages/dashboard/tabs/AnalyticsTab';
import { AlertsTab } from './components/Pages/dashboard/tabs/AlertsTab';
import { ClassesTab } from './components/Pages/dashboard/tabs/ClassesTab';
import { SettingsTab } from './components/Pages/dashboard/tabs/SettingsTab';
import { SidebarItem } from './components/Pages/dashboard/SidebarItem';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  BookOpen, 
  Settings,
  LogOut,
  Bell
} from 'lucide-react';

// Router component to handle different pages
function AppRouter() {
  const { isAuthenticated, isLoading, admin } = useAuth();
  const [currentPage, setCurrentPage] = useState(
    window.location.pathname === '/signup' ? 'signup' : 'login'
  );

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login/signup
  if (!isAuthenticated) {
    if (currentPage === 'signup') {
      return (
        <div>
          <Signup />
          <div className="fixed bottom-4 left-4">
            <button 
              onClick={() => setCurrentPage('login')}
              className="text-green-700 hover:underline text-sm"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div>
        <Login />
        <div className="fixed bottom-4 right-4">
          <button 
            onClick={() => setCurrentPage('signup')}
            className="text-green-700 hover:underline text-sm"
          >
            Need an account? Sign up →
          </button>
        </div>
      </div>
    );
  }

  // If authenticated, show dashboard
  return <TeacherDashboard admin={admin} />;
}

// Main dashboard component
function TeacherDashboard({ admin }: { admin: any }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: MessageSquare },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'students':
        return <StudentsTab />;
      case 'analytics':
        return <div className="p-4">Analytics Tab is disabled.</div>;
      case 'alerts':
        return <AlertsTab />;
      case 'classes':
        return <ClassesTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col shadow-sm">
        {/* Logo/Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-200">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center shadow">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">ChatApp Admin</h1>
            <p className="text-xs text-neutral-500">Teacher Dashboard</p>
          </div>
        </div>
        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <SidebarItem
                key={item.id}
                icon={<IconComponent className="w-5 h-5" />}
                label={item.label}
                active={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
              />
            );
          })}
        </nav>
        {/* User Profile & Logout */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-3 p-3 rounded-lg">
            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-base font-semibold text-green-700">
                {admin?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{admin?.name || 'Admin'}</div>
              <div className="text-xs text-neutral-500 truncate">{admin?.email || 'Teacher'}</div>
            </div>
          </div>
          <LogoutButton className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </LogoutButton>
        </div>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-neutral-200 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              {sidebarItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Monitor student AI interactions and manage classroom activities
            </p>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            <div className="text-xs text-neutral-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </header>
        {/* Page Content */}
        <main className="flex-1 p-8 overflow-auto min-w-0">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}

// Main App component with Auth Provider
function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
