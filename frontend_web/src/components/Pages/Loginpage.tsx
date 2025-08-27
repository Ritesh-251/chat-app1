"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [localError, setLocalError] = useState<string | null>(null)
  
  const { login, isLoading, error, clearError } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear errors when user starts typing
    if (error) clearError()
    if (localError) setLocalError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    // Basic validation
    if (!formData.email || !formData.password) {
      setLocalError('Please fill in all fields')
      return
    }

    try {
      await login(formData.email, formData.password)
      // Redirect to dashboard on successful login
      window.location.href = '/dashboard'
    } catch (error: any) {
      console.error('Login failed:', error)
      // Error is handled by AuthContext
    }
  }

  const displayError = error || localError

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md">
        <div className="p-6 border-b">
          <h1 className="text-center text-2xl font-bold text-green-700">
            Teacher Login
          </h1>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {displayError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{displayError}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input 
                id="email" 
                name="email"
                type="email" 
                placeholder="Enter your email" 
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required 
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input 
                id="password" 
                name="password"
                type="password" 
                placeholder="Enter your password" 
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required 
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 px-4 rounded-xl transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
            
            <p className="text-center text-sm text-gray-600">
              Don't have an account? <a href="/signup" className="text-green-700 hover:underline">Sign up</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
