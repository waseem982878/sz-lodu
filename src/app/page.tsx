import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800">
      {/* Navigation */}
      <nav className="bg-white bg-opacity-10 backdrop-blur-md border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-white">🎮 SZ Ludo</h1>
              </div>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/admin" 
                className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Admin Panel
              </Link>
              <Link 
                href="/dashboard" 
                className="bg-transparent border-2 border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
              >
                User Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-transparent sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block">The Ultimate</span>
                  <span className="block text-yellow-300">Real Money Ludo</span>
                  <span className="block">Experience</span>
                </h1>
                <p className="mt-3 text-base text-gray-200 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Join thousands of players in the most exciting real money ludo platform. 
                  Play, win, and withdraw your earnings instantly with secure payments.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      href="/dashboard"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:py-4 md:text-lg md:px-10"
                    >
                      Start Playing
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      href="/admin"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-purple-700 bg-white hover:bg-gray-100 md:py-4 md:text-lg md:px-10"
                    >
                      Admin Access
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-transparent sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
            <div className="relative">
              <div className="w-80 h-80 bg-yellow-300 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl">
                🎲
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white bg-opacity-5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Why Choose SZ Ludo?
            </h2>
          </div>
          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Instant Withdrawals",
                  description: "Get your winnings instantly with secure UPI payments",
                  icon: "💰"
                },
                {
                  title: "Secure Platform",
                  description: "Bank-level security with KYC verification for all users",
                  icon: "🛡️"
                },
                {
                  title: "24/7 Support",
                  description: "Round-the-clock customer support for all your queries",
                  icon: "🎯"
                },
                {
                  title: "Fair Play",
                  description: "Completely transparent and fair gaming experience",
                  icon: "⚖️"
                }
              ].map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white bg-opacity-10 text-2xl mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-medium text-white">{feature.title}</h3>
                  <p className="mt-2 text-base text-gray-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white bg-opacity-5 backdrop-blur-md border-t border-white border-opacity-20">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <p>&copy; 2024 SZ Ludo. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-300 hover:text-white">
                Terms
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                Privacy
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
