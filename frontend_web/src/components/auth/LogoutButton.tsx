"use client"

import { useAuth } from "@/contexts/AuthContext"

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ className = "", children }: LogoutButtonProps) {
  const { logout, isLoading } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      // Redirect to login page
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <button 
      onClick={handleLogout} 
      disabled={isLoading}
      className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? "Logging out..." : (children || "Logout")}
    </button>
  )
}

// Simple logout hook for programmatic use
export function useLogout() {
  const { logout } = useAuth()
  
  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return handleLogout
}
