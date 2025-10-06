
"use client";
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  CircleUser,
  Menu,
  Search,
  Users,
  Wallet,
  Settings,
  Shield,
  LogOut,
  ArrowRightLeft,
  PieChart,
  UserCheck,
  Gamepad2,
  Clock,
  BarChart,
  UserPlus,
  CheckCircle,
  ArrowDown,
  ArrowUp,
  UserClock,
  IndianRupee,
} from "lucide-react";
import Image from "next/image";

// Reusable Stat Card Component
const StatCard = ({
  title,
  value,
  percentage,
  icon: Icon,
  color,
  increase = true,
}: {
  title: string;
  value: string;
  percentage: string;
  icon: React.ElementType;
  color: string;
  increase?: boolean;
}) => (
  <div
    className={`rounded-2xl p-6 text-white shadow-lg hover:transform hover:-translate-y-1 transition-transform duration-300 ${color}`}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-white text-opacity-80 text-sm">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
        <p
          className={`${
            increase ? "text-green-200" : "text-red-200"
          } text-sm mt-2 flex items-center`}
        >
          {increase ? (
            <ArrowUp className="mr-1 h-4 w-4" />
          ) : (
            <Clock className="mr-1 h-4 w-4" />
          )}
          {percentage}
        </p>
      </div>
      <div className="bg-white bg-opacity-20 p-3 rounded-xl">
        <Icon className="text-2xl" />
      </div>
    </div>
  </div>
);

// Sidebar Navigation Link
const NavLink = ({
  icon: Icon,
  label,
  count,
  active,
}: {
  icon: React.ElementType;
  label: string;
  count?: string;
  active?: boolean;
}) => (
  <a
    href="#"
    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
      active
        ? "bg-purple-50 text-purple-600 border border-purple-200"
        : "text-gray-700 hover:bg-gray-100"
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="sidebar-text font-medium flex-1">{label}</span>
    {count && (
      <span
        className={`text-xs px-2 py-1 rounded-full ${
          label === "Users"
            ? "bg-green-100 text-green-800"
            : label === "Transactions"
            ? "bg-blue-100 text-blue-800"
            : "bg-orange-100 text-orange-800"
        }`}
      >
        {count}
      </span>
    )}
  </a>
);

// Quick Action Button
const QuickActionButton = ({
  icon: Icon,
  title,
  subtitle,
  color,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
}) => (
  <button
    className={`p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-${color}-300 hover:bg-${color}-50 transition-colors text-center group`}
  >
    <Icon
      className={`text-2xl text-${color}-500 mb-2 mx-auto group-hover:text-${color}-600`}
    />
    <p className="font-medium text-gray-700">{title}</p>
    <p className="text-xs text-gray-500">{subtitle}</p>
  </button>
);

export default function AdminDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg flex flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="p-4 border-b h-[73px] flex items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Gamepad2 className="text-white" />
            </div>
            <div
              className={`sidebar-text overflow-hidden ${
                sidebarCollapsed ? "hidden" : ""
              }`}
            >
              <h1 className="text-xl font-bold text-gray-800 whitespace-nowrap">
                SZ Ludo
              </h1>
              <p className="text-xs text-gray-500 whitespace-nowrap">
                Admin Panel
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-2">
          <NavLink icon={PieChart} label="Dashboard" active />
          <NavLink icon={Users} label="Users" count="1.2K" />
          <NavLink icon={ArrowRightLeft} label="Transactions" count="48" />
          <NavLink icon={Shield} label="KYC Management" count="23" />
          <NavLink icon={Wallet} label="Payment UPIs" />
          <NavLink icon={UserCheck} label="Agents" />
          <NavLink icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center space-x-3">
            <Image
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
              alt="Admin"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full border-2 border-purple-200 flex-shrink-0"
            />
            <div
              className={`sidebar-text overflow-hidden ${
                sidebarCollapsed ? "hidden" : ""
              }`}
            >
              <p className="text-sm font-medium text-gray-800 whitespace-nowrap">
                Admin User
              </p>
              <p className="text-xs text-gray-500 whitespace-nowrap">
                Super Admin
              </p>
            </div>
            <button
              className={`ml-auto text-gray-400 hover:text-gray-600 ${
                sidebarCollapsed ? "hidden" : ""
              }`}
            >
              <ChevronDown />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="text-gray-600" />
              </button>
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-purple-600">
                <Bell />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 text-gray-600 hover:text-purple-600">
                <Settings />
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <button className="flex items-center space-x-2 text-gray-700 hover:text-purple-600">
                <LogOut />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl p-8 text-white mb-8 shadow-lg">
            <div className="flex justify-between items-start flex-wrap">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, Admin! 👋
                </h1>
                <p className="text-purple-100 opacity-90">
                  Here's what's happening with your platform today.
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-sm">Today's Date</p>
                <p className="text-xl font-bold">December 19, 2024</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value="1,248"
              percentage="12.5% increase"
              icon={Users}
              color="bg-gradient-to-br from-blue-500 to-purple-500"
            />
            <StatCard
              title="Today's Revenue"
              value="₹45,280"
              percentage="8.3% increase"
              icon={IndianRupee}
              color="bg-gradient-to-br from-orange-400 to-red-500"
            />
            <StatCard
              title="Active Games"
              value="86"
              percentage="5.2% increase"
              icon={Gamepad2}
              color="bg-gradient-to-br from-cyan-400 to-sky-500"
            />
            <StatCard
              title="Pending KYC"
              value="23"
              percentage="Needs attention"
              icon={UserShield}
              color="bg-gradient-to-br from-green-400 to-teal-500"
              increase={false}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">
                  Revenue Analytics
                </h2>
                <select className="border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
              <div className="h-64 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart className="text-4xl mb-2 mx-auto" />
                  <p>Revenue Chart Visualization</p>
                  <p className="text-sm">(Chart would be rendered here)</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <QuickActionButton
                  icon={UserPlus}
                  title="Add User"
                  subtitle="Create new user"
                  color="purple"
                />
                <QuickActionButton
                  icon={CheckCircle}
                  title="Approve KYC"
                  subtitle="23 pending"
                  color="green"
                />
                <QuickActionButton
                  icon={ArrowRightLeft}
                  title="Transactions"
                  subtitle="48 pending"
                  color="blue"
                />
                <QuickActionButton
                  icon={Settings}
                  title="Settings"
                  subtitle="Platform config"
                  color="orange"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

