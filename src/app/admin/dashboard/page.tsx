
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Swords, Wallet, ShieldQuestion, IndianRupee, Clock, Loader2 } from "lucide-react";
import type { Transaction } from "@/models/transaction.model";
import type { Battle } from "@/models/battle.model";

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

    // Listener for Users & Pending KYCs
    const usersQuery = collection(db, "users");
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
        setStats(prev => ({ ...prev, totalUsers: { ...prev.totalUsers, value: snapshot.size.toString() } }));
    }, err => { console.error("User listener error:", err); setError("Failed to load user data."); });

    const pendingKycsQuery = query(usersQuery, where("kycStatus", "==", "Pending"));
    const unsubKycs = onSnapshot(pendingKycsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, pendingKYCs: { ...prev.pendingKYCs, value: snapshot.size.toString() } }));
    }, err => { console.error("KYC listener error:", err); setError("Failed to load KYC data."); });

    // Listener for Battles Stats
    const battlesCollection = collection(db, "battles");
    const activeBattlesQuery = query(battlesCollection, where('status', 'in', ['inprogress', 'result_pending', 'waiting_for_players_ready']));
    const unsubActiveBattles = onSnapshot(activeBattlesQuery, (snapshot) => {
        setStats(prev => ({...prev, activeBattles: {...prev.activeBattles, value: snapshot.size.toString()}}))
    }, err => { console.error("Active battles error:", err); setError("Failed to load battle data."); });

    const completedBattlesQuery = query(battlesCollection, where('status', '==', 'completed'));
    const unsubCompletedBattles = onSnapshot(completedBattlesQuery, (snapshot) => {
        const totalRevenue = snapshot.docs
            .map(doc => doc.data() as Battle)
            .reduce((acc, battle) => acc + (battle.amount * 0.05), 0);
        setStats(prev => ({...prev, totalRevenue: {...prev.totalRevenue, value: `₹${totalRevenue.toLocaleString()}`}}))
    }, err => { console.error("Revenue listener error:", err); setError("Failed to load revenue data."); });

    // Listener for Pending Withdrawals
    const pendingWithdrawalsQuery = query(collection(db, "transactions"), where('type', '==', 'withdrawal'), where('status', '==', 'pending'));
    const unsubWithdrawals = onSnapshot(pendingWithdrawalsQuery, (snapshot) => {
        setStats(prev => ({...prev, pendingWithdrawals: {...prev.pendingWithdrawals, value: snapshot.size.toString()}}))
    }, err => { console.error("Withdrawals listener error:", err); setError("Failed to load withdrawal data."); });
    
    // Listener for recent transactions
    const recentTransQuery = query(collection(db, "transactions"), orderBy("createdAt", "desc"), limit(5));
    const unsubRecentTrans = onSnapshot(recentTransQuery, (snapshot) => {
        const recentTransactionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setRecentTransactions(recentTransactionsData);
    }, err => { console.error("Recent transactions error:", err); setError("Failed to load transaction data."); });

    setLoading(false);

    // Cleanup function
    return () => {
        unsubUsers();
        unsubKycs();
        unsubActiveBattles();
        unsubCompletedBattles();
        unsubWithdrawals();
        unsubRecentTrans();
    };
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (error) {
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {Object.values(stats).map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
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
                            <TableCell className="font-mono text-xs text-gray-500">{activity.userId}</TableCell>
                            <TableCell className="flex items-center gap-2 text-gray-500">
                                <Clock className="h-4 w-4" />
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
        </CardContent>
      </Card>
    </div>
  );
}
