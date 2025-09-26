"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Swords, Wallet, ShieldCheck, IndianRupee, Loader2, ArrowRight } from "lucide-react";
import type { Transaction } from "@/models/transaction.model";
import type { UserProfile } from "@/models/user.model";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";

const initialStats = {
    totalUsers: { title: "Total Users", value: "0", icon: Users, color: "text-blue-500" },
    activeBattles: { title: "Active Battles", value: "0", icon: Swords, color: "text-orange-500" },
    totalRevenue: { title: "Total Revenue", value: "₹0", icon: IndianRupee, color: "text-green-500" },
    pendingWithdrawals: { title: "Pending Withdrawals", value: "0", icon: Wallet, color: "text-yellow-500" },
    pendingKYCs: { title: "Pending KYCs", value: "0", icon: ShieldCheck, color: "text-red-500" },
};

function StatCard({ stat }: { stat: { title: string, value: string, icon: React.ElementType, color: string } }) {
    const Icon = stat.icon;
    return (
        <Card className="flex-1">
            <CardContent className="p-3 flex items-center gap-3">
                 <div className={`p-2 rounded-lg bg-muted`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                    <div className="text-xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(initialStats);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Transaction[]>([]);
  const [pendingKYCs, setPendingKYCs] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const listeners = [
      onSnapshot(collection(db, "users"), 
        (snapshot) => setStats(prev => ({ ...prev, totalUsers: { ...prev.totalUsers, value: snapshot.size.toString() } })),
        (err) => setError("Failed to load user data.")
      ),
      onSnapshot(query(collection(db, "users"), where("kycStatus", "==", "Pending")),
        (snapshot) => {
            setStats(prev => ({ ...prev, pendingKYCs: { ...prev.pendingKYCs, value: snapshot.size.toString() } }));
            setPendingKYCs(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
        },
        (err) => setError("Failed to load KYC data.")
      ),
      onSnapshot(query(collection(db, "battles"), where('status', 'in', ['inprogress', 'result_pending', 'waiting_for_players_ready'])),
        (snapshot) => setStats(prev => ({...prev, activeBattles: {...prev.activeBattles, value: snapshot.size.toString()}})),
        (err) => setError("Failed to load battle data.")
      ),
      onSnapshot(query(collection(db, "transactions"), where('type', '==', 'withdrawal'), where('status', '==', 'pending')),
        (snapshot) => {
            setStats(prev => ({...prev, pendingWithdrawals: {...prev.pendingWithdrawals, value: snapshot.size.toString()}}));
            setPendingWithdrawals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
        },
        (err) => setError("Failed to load withdrawal data.")
      ),
    ];
    
    const timer = setTimeout(() => setLoading(false), 2500);

    return () => {
      listeners.forEach(unsub => unsub());
      clearTimeout(timer);
    };
  }, []);

  const renderWithdrawals = () => {
      if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
      if (pendingWithdrawals.length === 0) return <p className="text-muted-foreground text-center p-4">No pending withdrawals.</p>;
      return (
          <div className="space-y-3">
              {pendingWithdrawals.slice(0, 3).map(t => (
                  <Card key={t.id} className="p-3" onClick={() => router.push('/admin/transactions')}>
                      <div className="flex justify-between items-center">
                          <div>
                              <p className="text-sm font-bold">₹{t.amount}</p>
                              <p className="text-xs text-muted-foreground break-all">{t.withdrawalDetails?.address}</p>
                          </div>
                          <Badge variant="secondary">{t.status}</Badge>
                      </div>
                  </Card>
              ))}
              <Button variant="ghost" className="w-full" asChild><Link href="/admin/transactions">View All <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
          </div>
      )
  }
  
  const renderKYCs = () => {
      if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
      if (pendingKYCs.length === 0) return <p className="text-muted-foreground text-center p-4">No pending KYC requests.</p>;
       return (
          <div className="space-y-3">
              {pendingKYCs.slice(0, 3).map(u => (
                  <Card key={u.uid} className="p-3" onClick={() => router.push('/admin/kyc')}>
                      <div className="flex justify-between items-center">
                          <div>
                              <p className="text-sm font-bold">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.email || u.phoneNumber}</p>
                          </div>
                          <Badge variant="secondary">{u.kycStatus}</Badge>
                      </div>
                  </Card>
              ))}
              <Button variant="ghost" className="w-full" asChild><Link href="/admin/kyc">View All <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
      
      {error && <p className="text-destructive text-center p-4 bg-destructive/10 rounded-md">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard stat={stats.totalUsers} />
        <StatCard stat={stats.activeBattles} />
        <StatCard stat={stats.pendingWithdrawals} />
        <StatCard stat={stats.pendingKYCs} />
        <StatCard stat={stats.totalRevenue} />
      </div>
      
       <Tabs defaultValue="withdrawals" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="withdrawals">Pending Withdrawals</TabsTrigger>
            <TabsTrigger value="kyc">Pending KYCs</TabsTrigger>
          </TabsList>
          <TabsContent value="withdrawals">
            <Card>
                <CardHeader><CardTitle className="text-primary">Action Required</CardTitle></CardHeader>
                <CardContent>
                    {renderWithdrawals()}
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="kyc">
              <Card>
                 <CardHeader><CardTitle className="text-primary">Verification Queue</CardTitle></CardHeader>
                <CardContent>
                    {renderKYCs()}
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
