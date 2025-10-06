import Link from 'next/link'

export default function AdminDashboard() {
  const stats = [
    { name: 'Total Users', value: '1,248', change: '+12%', changeType: 'positive' },
    { name: 'Today\'s Revenue', value: '₹45,280', change: '+8%', changeType: 'positive' },
    { name: 'Active Games', value: '86', change: '+5%', changeType: 'positive' },
    { name: 'Pending KYC', value: '23', change: 'Needs attention', changeType: 'negative' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Super Admin</span>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      stat.changeType === 'positive' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {stat.changeType === 'positive' ? '↑' : '⚠'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{stat.value}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <span className={`font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-gray-500"> from yesterday</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Link href="/admin/users" className="group">
                <div className="p-4 border-2 border-gray-200 rounded-lg text-center hover:border-purple-300 hover:bg-purple-50 transition-colors">
                  <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-purple-100 group-hover:bg-purple-200">
                    <span className="text-xl">👥</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-900">Users</p>
                    <p className="text-xs text-gray-500">Manage users</p>
                  </div>
                </div>
              </Link>

              <Link href="/admin/transactions" className="group">
                <div className="p-4 border-2 border-gray-200 rounded-lg text-center hover:border-green-300 hover:bg-green-50 transition-colors">
                  <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 group-hover:bg-green-200">
                    <span className="text-xl">💳</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-900">Transactions</p>
                    <p className="text-xs text-gray-500">View all transactions</p>
                  </div>
                </div>
              </Link>

              <Link href="/admin/kyc" className="group">
                <div className="p-4 border-2 border-gray-200 rounded-lg text-center hover:border-orange-300 hover:bg-orange-50 transition-colors">
                  <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-orange-100 group-hover:bg-orange-200">
                    <span className="text-xl">🛡️</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-900">KYC</p>
                    <p className="text-xs text-gray-500">23 pending</p>
                  </div>
                </div>
              </Link>

              <Link href="/admin/payments" className="group">
                <div className="p-4 border-2 border-gray-200 rounded-lg text-center hover:border-blue-300 hover:bg-blue-50 transition-colors">
                  <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200">
                    <span className="text-xl">💰</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-900">Payments</p>
                    <p className="text-xs text-gray-500">UPI management</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[
                { user: 'Rajesh Kumar', action: 'Deposit', amount: '₹2,500', time: '2 min ago', status: 'completed' },
                { user: 'Priya Singh', action: 'Withdrawal', amount: '₹1,500', time: '5 min ago', status: 'pending' },
                { user: 'Amit Sharma', action: 'KYC Submitted', amount: '', time: '10 min ago', status: 'pending' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      <span className={`text-sm ${
                        activity.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {activity.status === 'completed' ? '✓' : '⏳'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{activity.user}</p>
                      <p className="text-sm text-gray-500">{activity.action} • {activity.time}</p>
                    </div>
                  </div>
                  {activity.amount && (
                    <div className={`font-semibold ${
                      activity.action === 'Deposit' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {activity.amount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
