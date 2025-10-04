import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Transaction } from '@/models/transaction.model';

const TransactionList = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!user) return;
            
            setLoading(true);
            setError(null);

            try {
                const idToken = await user.getIdToken();
                const response = await fetch('/api/transactions', {
                     headers: {
                        'Authorization': idToken,
                    },
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to fetch transactions');
                }
                const data = await response.json();
                setTransactions(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [user]);

    if (loading) return <p>Loading transactions...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="max-w-4xl mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-4">My Transactions</h2>
            {transactions.length === 0 ? (
                <p>You have no transactions.</p>
            ) : (
                <ul className="space-y-4">
                    {transactions.map((tx) => (
                        <li key={tx.id} className="p-4 border rounded-lg flex justify-between items-center">
                            <div>
                                <p className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'credit' ? '+' : '-'} ${tx.amount.toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-500">{tx.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-700">{tx.status}</p>
                                <p className="text-xs text-gray-400">
                                    {/* @ts-ignore */}
                                    {new Date(tx.createdAt.seconds * 1000).toLocaleString()}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default TransactionList;
