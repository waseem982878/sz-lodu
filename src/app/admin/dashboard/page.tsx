"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Swords, Wallet, ShieldQuestion, IndianRupee, Clock, Loader2 } from "lucide-react";
import type { Transaction } from "@/models/transaction.model";

const initialStats = {
    totalUsers: { title: "Total Users", value: "0", icon: Users, color: "text-blue-500", note: "" },
    activeBattles: { title: "Active Battles", value: "0", icon: Swords, color: "text-orange-500", note: "" },
    totalRevenue: { title: "Total Revenue", value: "₹0", icon: IndianRupee, color: "text-green-500", note: "From 5% commission" },
    pendingWithdrawals: { title: "Pending Withdrawals", value: "0", icon: Wallet, color: "text-yellow-500", note: "" },
    pendingKYCs: { title: "Pending KYCs", value: "0", icon: ShieldQuestion, color: "text-red-500", note: "" },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(initialStats);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const listeners = [
      onSnapshot(collection(db, "users"), 
        (snapshot) => setStats(prev => ({ ...prev, totalUsers: { ...prev.totalUsers, value: snapshot.size.toString() } })),
        (err) => setError("Failed to load user data.")
      ),
      onSnapshot(query(collection(db, "users"), where("kycStatus", "==", "Pending")),
        (snapshot) => setStats(prev => ({ ...prev, pendingKYCs: { ...prev.pendingKYCs, value: snapshot.size.toString() } })),
        (err) => setError("Failed to load KYC data.")
      ),
      onSnapshot(query(collection(db, "battles"), where('status', 'in', ['inprogress', 'result_pending', 'waiting_for_players_ready'])),
        (snapshot) => setStats(prev => ({...prev, activeBattles: {...prev.activeBattles, value: snapshot.size.toString()}})),
        (err) => setError("Failed to load battle data.")
      ),
      onSnapshot(query(collection(db, "transactions"), where('type', '==', 'withdrawal'), where('status', '==', 'pending')),
        (snapshot) => setStats(prev => ({...prev, pendingWithdrawals: {...prev.pendingWithdrawals, value: snapshot.size.toString()}})),
        (err) => setError("Failed to load withdrawal data.")
      ),
      onSnapshot(query(collection(db, "transactions"), orderBy("createdAt", "desc"), limit(5)),
        (snapshot) => {
          const recentTransactionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
          setRecentTransactions(recentTransactionsData);
        },
        (err) => setError("Failed to load recent transactions.")
      ),
    ];
    
    // A simple timeout to handle the initial loading state
    const timer = setTimeout(() => setLoading(false), 2500);

    return () => {
      listeners.forEach(unsub => unsub());
      clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (error && recentTransactions.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-[80vh] text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">Dashboard Error</h2>
            <p className="text-muted-foreground max-w-md">{error}</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
      
      {error && <p className="text-destructive text-center p-4 bg-destructive/10 rounded-md">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {Object.values(stats).map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                     <p className="text-xs text-gray-400">{stat.note || "Live data"}</p>
                </CardContent>
            </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="text-primary">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>User ID</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentTransactions.map((activity) => (
                            <TableRow key={activity.id}>
                                <TableCell>
                                    <Badge variant={activity.type === 'deposit' ? 'default' : 'destructive'} className={activity.type === 'deposit' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                                        {activity.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium">₹{activity.amount}</TableCell>
                                <TableCell className="font-mono text-xs text-gray-500 truncate max-w-24 sm:max-w-xs">{activity.userId}</TableCell>
                                <TableCell className="text-gray-500 text-sm whitespace-nowrap">
                                    {activity.createdAt?.toDate ? activity.createdAt.toDate().toLocaleString() : 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={activity.status === 'completed' ? 'default' : activity.status === 'pending' ? 'secondary' : 'destructive'}>
                                        {activity.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
