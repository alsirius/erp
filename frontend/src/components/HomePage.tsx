'use client';

import Link from 'next/link'
import { appConfig } from '../config/app-content'
import { useState } from 'react'

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {/* Subtle Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-100/20 via-transparent to-purple-100/20 pointer-events-none"></div>
        </div>
      </div>

      {/* Main Content with Glow */}
      <div className="min-h-screen relative">
        {/* Subtle Glow Around Content */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-transparent to-purple-400/5 pointer-events-none"></div>
        
        <div className="relative z-10">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{appConfig.header.title}</h1>
                </div>
                <nav className="flex space-x-4">
                  <Link 
                    href="/login" 
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  >
                    {appConfig.header.navigation.signIn}
                  </Link>
                  <Link 
                    href="/register" 
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  >
                    {appConfig.header.navigation.signUp}
                  </Link>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 0 4.5 0v-13z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2v-4a2 2 0 012-2h5.586a1 1 0 01.707.293l6.414 6.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {appConfig.documentation.button}
                  </button>
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
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-6 animate-fade-in drop-shadow-lg">
                {appConfig.hero.title}
              </h1>
              <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                {appConfig.hero.description}
              </p>
              
              <div className="space-y-4 sm:space-y-0 sm:space-x-6 sm:flex sm:justify-center">
                <Link 
                  href="/register"
                  className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 rounded-2xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl"
                >
                  {appConfig.hero.cta.getStarted}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link 
                  href="/login"
                  className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-blue-600 px-10 py-4 rounded-2xl text-lg font-semibold border-2 border-blue-200 hover:border-blue-300 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  {appConfig.hero.cta.signIn}
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
                  {appConfig.features.title}
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  {appConfig.features.subtitle}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {appConfig.features.items.map((feature, index) => (
                  <div key={index} className="group text-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                    <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl">{feature.icon}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-white/80 backdrop-blur-md mt-24 border-t border-gray-100">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <div className="text-center text-gray-600">
                <p>{appConfig.footer.copyright}</p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Documentation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">{appConfig.documentation.title}</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="prose max-w-none">
                  
                  {/* Quick Overview */}
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{appConfig.documentation.sections.overview}</h3>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                      <p className="text-gray-700">
                        <strong>{appConfig.app.description}</strong> with enterprise-grade architecture, 
                        PostgreSQL database, JWT authentication, and generic patterns for rapid development.
                      </p>
                    </div>
                  </div>

                  {/* Architecture */}
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{appConfig.documentation.sections.architecture}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Backend</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Node.js + TypeScript</li>
                          <li>• Express.js + Middleware</li>
                          <li>• PostgreSQL + SQLite</li>
                          <li>• Generic DAO Pattern</li>
                          <li>• JWT + Refresh Tokens</li>
                        </ul>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Frontend</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• React + TypeScript</li>
                          <li>• Tailwind CSS</li>
                          <li>• Generic API Client</li>
                          <li>• Custom Hooks</li>
                          <li>• Context State</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Key Features */}
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{appConfig.documentation.sections.features}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2">🔐 Authentication</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• JWT with refresh tokens</li>
                          <li>• Role-based access</li>
                          <li>• Secure sessions</li>
                        </ul>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-900 mb-2">🗄️ Database</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• PostgreSQL production</li>
                          <li>• SQLite development</li>
                          <li>• Generic DAO layer</li>
                          <li>• Migration support</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-yellow-900 mb-2">⚡ Developer XP</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Hot reload</li>
                          <li>• Type safety</li>
                          <li>• Docker support</li>
                          <li>• Auto-setup scripts</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Getting Started */}
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{appConfig.documentation.sections.gettingStarted}</h3>
                    <div className="bg-gray-900 text-white p-4 rounded-lg">
                      <pre className="text-sm">
<code>{`# Clone and setup
git clone https://github.com/alsirius/siriux.git my-app
cd my-app
npm run setup

# Start development
npm run dev

# Build for production
npm run build`}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Generic Patterns */}
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{appConfig.documentation.sections.patterns}</h3>
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                      <p className="text-gray-700 mb-4">
                        <strong>Zero boilerplate CRUD operations</strong> - Extend generic classes for instant functionality:
                      </p>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <pre className="text-xs overflow-x-auto">
<code>{`// 1. Define types
interface Product { id: string; name: string; }

// 2. Create DAO
class ProductDAO extends PostgreSQLDAO<Product, CreateDto, UpdateDto> {
  protected mapRowToEntity(row: any): Product { /* mapping */ }
  protected getInsertFields(): string[] { return ['name']; }
}

// 3. Create Service
class ProductService extends GenericService<Product, CreateDto, UpdateDto> {
  // Business logic here
}

// 4. Create Controller
class ProductController extends GenericController<Product, CreateDto, UpdateDto> {
  // Custom endpoints here
}`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Technology Stack */}
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{appConfig.documentation.sections.technology}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl mb-1">⚛️</div>
                        <div className="text-sm font-medium">Node.js</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl mb-1">📘</div>
                        <div className="text-sm font-medium">TypeScript</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl mb-1">🐘</div>
                        <div className="text-sm font-medium">PostgreSQL</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl mb-1">⚛️</div>
                        <div className="text-sm font-medium">React</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl mb-1">🎨</div>
                        <div className="text-sm font-medium">Tailwind</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl mb-1">🔐</div>
                        <div className="text-sm font-medium">JWT Auth</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl mb-1">🐳</div>
                        <div className="text-sm font-medium">Docker</div>
                      </div>
                    </div>
                  </div>

                  {/* Perfect For */}
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{appConfig.documentation.sections.perfectFor}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <div className="text-lg font-medium text-blue-900">🏢 SaaS</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <div className="text-lg font-medium text-green-900">🛒 E-commerce</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <div className="text-lg font-medium text-purple-900">🏥 Healthcare</div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg text-center">
                        <div className="text-lg font-medium text-yellow-900">📚 Education</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg text-center">
                        <div className="text-lg font-medium text-red-900">💼 Project Mgmt</div>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-lg text-center">
                        <div className="text-lg font-medium text-indigo-900">🎨 Portfolios</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
