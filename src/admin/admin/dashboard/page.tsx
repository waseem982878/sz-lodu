
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Wallet, ShieldCheck, IndianRupee, Loader2, ArrowRight, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import type { Transaction } from "@/models/transaction.model";
import type { UserProfile } from "@/models/user.model";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";


export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    pendingTransactions: 0,
    pendingKYC: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchInitialStats = async () => {
        setLoading(true);
        try {
            const usersSnap = await getDocs(collection(db, 'users'));
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const depositsQuery = query(
              collection(db, 'transactions'),
              where('type', '==', 'deposit'),
              where('status', '==', 'completed'),
              where('createdAt', '>=', Timestamp.fromDate(today))
            );
            const depositsSnap = await getDocs(depositsQuery);

            setStats(prev => ({
                ...prev,
                totalUsers: usersSnap.size,
                totalDeposits: depositsSnap.docs.reduce((sum, doc) => sum + doc.data().amount, 0),
            }));
        } catch (error) {
            console.error("Error fetching initial dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchInitialStats();
    
    // Listeners for real-time updates on pending counts
    const pendingKycUnsub = onSnapshot(query(collection(db, 'users'), where('kycStatus', '==', 'Pending')), (snap) => {
        setStats(prev => ({ ...prev, pendingKYC: snap.size }));
    });
    const pendingTxUnsub = onSnapshot(query(collection(db, 'transactions'), where('status', '==', 'pending')), (snap) => {
        setStats(prev => ({ ...prev, pendingTransactions: snap.size }));
    });

    return () => {
        pendingKycUnsub();
        pendingTxUnsub();
    }
  }, []);

  if (loading) {
      return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
  }

  return (
    <div className="p-0 sm:p-4 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Deposits</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalDeposits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingKYC}</div>
          </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                    <Button onClick={() => router.push('/admin/transactions')} variant="outline" size="sm">Manage Transactions</Button>
                    <Button onClick={() => router.push('/admin/users')} variant="outline" size="sm">Manage Users</Button>
                    <Button onClick={() => router.push('/admin/kyc')} variant="outline" size="sm">Review KYCs</Button>
                    <Button onClick={() => router.push('/admin/battles')} variant="outline" size="sm">View Battles</Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-green-500">All systems operational.</p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
