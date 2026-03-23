import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">WebApp Starter</h1>
            </div>
            <nav className="flex space-x-4">
              <Link 
                href="/login" 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                Sign Up
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl mb-8 transform hover:scale-110 transition-transform duration-300">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-6 animate-fade-in">
            Welcome to Your Next Web Application
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            A comprehensive, production-ready starter kit for building modern web applications. Enterprise-grade architecture with authentication, user management, and scalable patterns.
          </p>
          
          <div className="space-y-4 sm:space-y-0 sm:space-x-6 sm:flex sm:justify-center">
            <Link 
              href="/register"
              className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 rounded-2xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl"
            >
              Get Started
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link 
              href="/login"
              className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-blue-600 px-10 py-4 rounded-2xl text-lg font-semibold border-2 border-blue-200 hover:border-blue-300 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              Sign In
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6">
              Why Choose This Premium Starter?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Enterprise-grade features and patterns to accelerate your web application development
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Enterprise Architecture</h3>
              <p className="text-gray-600 leading-relaxed">
                Production-ready patterns with PostgreSQL, generic DAO, service layers, and comprehensive error handling
              </p>
            </div>
            
            <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Advanced Authentication</h3>
              <p className="text-gray-600 leading-relaxed">
                JWT with refresh tokens, role-based access control, and secure session management
              </p>
            </div>
            
            <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002 2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002 2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Developer Experience</h3>
              <p className="text-gray-600 leading-relaxed">
                Hot reload, comprehensive documentation, TypeScript throughout, and one-command setup
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md mt-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2026 WebApp Starter Kit. Built with ❤️ by Alsirius Ltd.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
