'use client'

import { useState, useEffect } from 'react'
import { Users, UserCheck, UserX, MailPlus, Key, Settings, Activity } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import logger from '@/utils/logger'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  emailVerified: number
  createdAt: string
  phone?: string
  department?: string
}

interface RegistrationCode {
  id: string
  code: string
  usableBy: string
  createdBy: string
  createdAt: string
  usedBy?: string
  usedAt?: string
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'codes' | 'invite'>('pending')
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [registrationCodes, setRegistrationCodes] = useState<RegistrationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingUsers()
    } else if (activeTab === 'codes') {
      fetchRegistrationCodes()
    }
  }, [activeTab])

  const fetchPendingUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPendingUsers(data.data || [])
        logger.logUserAction('FETCH_PENDING_USERS', 'AdminDashboard', {
          count: data.data?.length || 0
        })
      } else {
        throw new Error('Failed to fetch pending users')
      }
    } catch (error) {
      setError((error as Error).message)
      logger.error('Failed to fetch pending users', { error: (error as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const fetchRegistrationCodes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/registration-codes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRegistrationCodes(data.data || [])
        logger.logUserAction('FETCH_REGISTRATION_CODES', 'AdminDashboard', {
          count: data.data?.length || 0
        })
      } else {
        throw new Error('Failed to fetch registration codes')
      }
    } catch (error) {
      setError((error as Error).message)
      logger.error('Failed to fetch registration codes', { error: (error as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const handleUserApproval = async (userId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const response = await fetch('/api/admin/users/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ userId, action, reason })
      })

      if (response.ok) {
        fetchPendingUsers()
        logger.logUserAction(`USER_${action.toUpperCase()}`, 'AdminDashboard', {
          userId,
          reason
        })
      } else {
        throw new Error(`Failed to ${action} user`)
      }
    } catch (error) {
      setError((error as Error).message)
      logger.error(`Failed to ${action} user`, { 
        userId, 
        action, 
        error: (error as Error).message 
      })
    }
  }

  const renderPendingUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Pending Users</h3>
        <span className="text-sm text-gray-500">{pendingUsers.length} pending</span>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Activity className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading pending users...</p>
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="text-center py-8">
          <UserCheck className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="mt-2 text-gray-600">No pending users</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <div key={user.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 rounded-full p-2">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Role: {user.role}</span>
                        {user.phone && <span>Phone: {user.phone}</span>}
                        {user.department && <span>Dept: {user.department}</span>}
                        <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUserApproval(user.id, 'approve')}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleUserApproval(user.id, 'reject')}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderRegistrationCodes = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Registration Codes</h3>
        <span className="text-sm text-gray-500">{registrationCodes.length} codes</span>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Activity className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading registration codes...</p>
        </div>
      ) : registrationCodes.length === 0 ? (
        <div className="text-center py-8">
          <Key className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="mt-2 text-gray-600">No registration codes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {registrationCodes.map((code) => (
            <div key={code.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-100 rounded-full p-2">
                      <Key className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-mono font-medium text-gray-900">{code.code}</p>
                      <p className="text-sm text-gray-500">
                        Usable by: {code.usableBy === 'anyone' ? 'Anyone' : code.usableBy}
                      </p>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Created: {new Date(code.createdAt).toLocaleDateString()}</span>
                        {code.usedBy && (
                          <span className="text-green-600">Used by {code.usedBy}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {code.usedBy ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Used
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage users and registration codes</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserCheck className="h-4 w-4 inline mr-2" />
                Pending Users
              </button>
              <button
                onClick={() => setActiveTab('codes')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'codes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Key className="h-4 w-4 inline mr-2" />
                Registration Codes
              </button>
              <button
                onClick={() => setActiveTab('invite')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'invite'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MailPlus className="h-4 w-4 inline mr-2" />
                Send Invitation
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'pending' && renderPendingUsers()}
            {activeTab === 'codes' && renderRegistrationCodes()}
            {activeTab === 'invite' && (
              <div className="text-center py-8">
                <MailPlus className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="mt-2 text-gray-600">Invitation form coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
