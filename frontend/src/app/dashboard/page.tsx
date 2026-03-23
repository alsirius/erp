'use client'

import { useAuth } from '@/hooks/useAuth'
import { getInitials, formatDate } from '@/utils'

export default function DashboardPage() {
  const { user, logout, loading } = useAuth()

  const handleLogout = () => {
    logout()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // The useAuth hook will handle redirecting to login
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Siriux Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.firstName}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.email} • {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Welcome to Siriux Dashboard
              </h2>
              <p className="text-gray-600 mb-8">
                Your modern roster management solution is ready to use.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">User Profile</h3>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">Role: <span className="font-medium">{user.role}</span></p>
                    <p className="text-gray-600">Status: <span className="font-medium">{user.isActive ? 'Active' : 'Inactive'}</span></p>
                    <p className="text-gray-600">Member since: <span className="font-medium">{formatDate(user.createdAt)}</span></p>
                  </div>
                  <div className="mt-4">
                    <a
                      href="/profile"
                      className="w-full inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm text-center"
                    >
                      Edit Profile
                    </a>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                      Manage Rosters
                    </button>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
                      View Reports
                    </button>
                    {user.role === 'admin' && (
                      <a
                        href="/invitations"
                        className="w-full inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm text-center"
                      >
                        Manage Invitations
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">System Status</h3>
                  <p className="text-sm text-green-600">✓ Backend Connected</p>
                  <p className="text-sm text-green-600">✓ Database Online</p>
                  <p className="text-sm text-green-600">✓ Authenticated</p>
                  {!user.emailVerified && (
                    <p className="text-sm text-yellow-600 mt-2">⚠ Email not verified</p>
                  )}
                  {user.requiresApproval && !user.approvedAt && (
                    <p className="text-sm text-yellow-600 mt-2">⚠ Pending approval</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
