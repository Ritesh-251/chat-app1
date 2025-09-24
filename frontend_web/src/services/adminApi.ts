// Types for analytics and export
export interface AnalyticsTrends {
  _id: string;
  count: number;
}
export interface AnalyticsTopUser {
  name: string;
  email: string;
  chatCount: number;
}
export interface AnalyticsResponse {
  success: boolean;
  data: {
    period: string;
    chatTrends: AnalyticsTrends[];
    topUsers: AnalyticsTopUser[];
    generatedAt: string;
  };
}

// API configuration and admin authentication services
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://10.6.192.157:8000/api/v1';

console.log('🔧 API Configuration:');
console.log('VITE_API_URL from env:', import.meta.env.VITE_API_URL);
console.log('Final API_BASE_URL:', API_BASE_URL);

// Types for admin authentication
export interface AdminLoginData {
  email: string;
  password: string;
}

export interface AdminSignupData {
  name: string;
  email: string;
  password: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminAuthResponse {
  success: boolean;
  message: string;
  data: {
    admin: AdminUser;
    accessToken: string;
  };
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

class AdminApiService {
  async getStudentMostRecentChat(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/students/${userId}/recent-chat`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get student recent chat');
      }
      return data;
    } catch (error) {
      console.error('Get student most recent chat error:', error);
      throw error;
    }
  }

  async getStudentMostRecentChatByEmail(email: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/students/recent-chat-by-email?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get student recent chat by email');
      }
      return data;
    } catch (error) {
      console.error('Get student most recent chat by email error:', error);
      throw error;
    }
  }
  async getMostRecentChat() {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/recent`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get most recent chat');
      }
      return data;
    } catch (error) {
      console.error('Get most recent chat error:', error);
      throw error;
    }
  }
  private getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async login(loginData: AdminLoginData): Promise<AdminAuthResponse> {
    try {
      console.log('🚀 Making login request to:', `${API_BASE_URL}/admin/login`);
      console.log('🔑 Login data:', loginData);
      
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token in localStorage
      if (data.data?.accessToken) {
        localStorage.setItem('adminToken', data.data.accessToken);
        localStorage.setItem('adminUser', JSON.stringify(data.data.admin));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async signup(signupData: AdminSignupData): Promise<AdminAuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Store token in localStorage
      if (data.data?.accessToken) {
        localStorage.setItem('adminToken', data.data.accessToken);
        localStorage.setItem('adminUser', JSON.stringify(data.data.admin));
      }

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      // Clear local storage regardless of response
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');

      return data;
    } catch (error) {
      // Clear local storage even if API call fails
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      console.error('Logout error:', error);
      return { success: true, message: 'Logged out locally' };
    }
  }

  async getProfile(): Promise<{ success: boolean; data: AdminUser }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get profile');
      }

      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Dashboard API methods
  async getDashboardStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get dashboard stats');
      }

      return data;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  }

  async getAllStudents(page = 1, limit = 10, search = '') {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`${API_BASE_URL}/admin/students?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get students');
      }

      return data;
    } catch (error) {
      console.error('Get students error:', error);
      throw error;
    }
  }

  async getAllChats(page = 1, limit = 10, userId?: string, flagged?: boolean) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(userId && { userId }),
        ...(flagged !== undefined && { flagged: flagged.toString() }),
      });

      const response = await fetch(`${API_BASE_URL}/admin/chats?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get chats');
      }

      return data;
    } catch (error) {
      console.error('Get chats error:', error);
      throw error;
    }
  }
async getAnalytics(): Promise<AnalyticsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/analytics`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok || !data.success || !data.data) {
      throw new Error(data.message || 'Failed to get analytics');
    }
    return data;
  } catch (error) {
    console.error('Get analytics error:', error);
    throw error;
  }
}

  async getRecentChats(limit = 5) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/chats?limit=${limit}&sort=createdAt&order=desc`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get recent chats');
      }

      return data;
    } catch (error) {
      console.error('Get recent chats error:', error);
      throw error;
    }
  }

  async exportData(type = 'all', format = 'xlsx') {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/export?type=${type}&format=${format}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export data');
      }

      // Handle file download
      if (format === 'xlsx') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-app-export-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return { success: true, message: 'Export downloaded successfully' };
      } else {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Export data error:', error);
      throw error;
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem('adminToken');
  }

  getStoredAdmin(): AdminUser | null {
    const adminData = localStorage.getItem('adminUser');
    return adminData ? JSON.parse(adminData) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('adminToken');
  }
}

export const adminApiService = new AdminApiService();
