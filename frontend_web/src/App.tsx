import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Pages/Loginpage';
import Signup from './components/auth/Signuppage';
import { LogoutButton } from './components/auth/LogoutButton';
import { DashboardTab } from './components/Pages/dashboard/tabs/DashboardTab';
import { 
  MessageSquare, 
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
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="px-8 py-4 flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center shadow">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight">ChatApp Admin Dashboard</h1>
              <p className="text-sm text-neutral-500">Monitor student AI interactions and classroom activities</p>
            </div>
          </div>
          
          {/* User Info and Actions */}
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            
            {/* User Profile */}
            <div className="flex items-center gap-3 px-3 py-2 bg-neutral-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-green-700">
                  {admin?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="text-sm">
                <div className="font-medium text-neutral-900">{admin?.name || 'Admin'}</div>
                <div className="text-xs text-neutral-500">{admin?.email || 'Teacher'}</div>
              </div>
            </div>
            
            <LogoutButton className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </LogoutButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Content */}
          <DashboardTab />
        </div>
      </main>
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
