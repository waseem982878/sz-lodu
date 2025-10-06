export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">🎮 SZ Ludo</h1>
        <p className="text-xl mb-8">The Ultimate Real Money Ludo Experience</p>
        <div className="space-x-4">
          <a href="/admin" className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Admin Panel
          </a>
          <a href="/dashboard" className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors">
            User Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
