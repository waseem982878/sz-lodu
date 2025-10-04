import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white p-6">
        <nav>
          <ul>
            <li className="mb-4"><a href="/dashboard/profile" className="text-gray-700 hover:text-blue-500">Profile</a></li>
            <li className="mb-4"><a href="/dashboard/kyc" className="text-gray-700 hover:text-blue-500">KYC</a></li>
            <li className="mb-4"><a href="/dashboard/transactions" className="text-gray-700 hover:text-blue-500">Transactions</a></li>
            <li className="mb-4"><a href="/dashboard/payment-proof" className="text-gray-700 hover:text-blue-500">Payment Proof</a></li>
            <li className="mb-4"><a href="/dashboard/battle-result" className="text-gray-700 hover:text-blue-500">Battle Result</a></li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-10">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
