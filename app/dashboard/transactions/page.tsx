'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getUserTransactions } from '@/services/transaction-service';
import { Transaction } from '@/models/transaction.model';

const TransactionsPage = () => {
  const auth = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const fetchTransactions = async () => {
        try {
          setLoading(true);
          const userId = user.id;
          const userTransactions = await getUserTransactions(userId);
          setTransactions(userTransactions);
          setError(null);
        } catch (err) {
          setError('Failed to fetch transactions.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchTransactions();
    }
  }, [auth.currentUser]);

  if (loading) {
    return <p>Loading transactions...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Your Transactions</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        {transactions.length === 0 ? (
          <p>You have no transactions yet.</p>
        ) : (
          <ul className="space-y-4">
            {transactions.map((tx) => (
              <li key={tx.id} className="border-b pb-2 mb-2">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold capitalize">{tx.type.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-500">{tx.details}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.amount > 0 ? '+' : ''}₹{tx.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">{tx.status}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
