'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Wallet,
  ShieldCheck,
  Loader2,
  ArrowRight,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Calendar,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type { Transaction } from '@/models/transaction.model';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalUsers: number;
  totalDeposits: number;
  pendingTransactions: number;
  pendingKYC: number;
  todayRevenue: number;
  activeUsers: number;
  conversionRate: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDeposits: 0,
    pendingTransactions: 0,
    pendingKYC: 0,
    todayRevenue: 0,
    activeUsers: 0,
    conversionRate: 0,
  });

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const usersQuery = collection(db, 'users');
        const depositsQuery = query(
          collection(db, 'transactions'),
          where('type', '==', 'deposit'),
          where('status', '==', 'completed')
        );
        const recentTxQuery = query(
          collection(db, 'transactions'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const activeUsersQuery = query(
          collection(db, 'users'),
          where('lastActive', '>=', Timestamp.fromDate(last24Hours))
        );
        const todayDepositsQuery = query(
            collection(db, 'transactions'),
            where('type', '==', 'deposit'),
            where('status', '==', 'completed'),
            where('createdAt', '>=', Timestamp.fromDate(todayStart))
        );

        const [usersSnap, depositsSnap, recentTxSnap, activeUsersSnap, todayDepositsSnap] = await Promise.all([
          getDocs(usersQuery),
          getDocs(depositsQuery),
          getDocs(recentTxQuery),
          getDocs(activeUsersQuery),
          getDocs(todayDepositsQuery),
        ]);

        const totalDepositAmount = depositsSnap.docs.reduce(
          (sum, doc) => sum + (doc.data().amount || 0),
          0
        );
        const todayRevenue = todayDepositsSnap.docs.reduce(
          (sum, doc) => sum + (doc.data().amount || 0),
          0
        );
        
        // This query is expensive and depends on a specific field.
        // A more scalable approach might involve a separate counter.
        const usersWithDepositsSnap = await getDocs(query(
          collection(db, 'users'),
          where('totalDeposits', '>', 0)
        ));

        setStats((prev) => ({
          ...prev,
          totalUsers: usersSnap.size,
          totalDeposits: totalDepositAmount,
          todayRevenue,
          activeUsers: activeUsersSnap.size,
          conversionRate:
            usersSnap.size > 0 ? (usersWithDepositsSnap.size / usersSnap.size) * 100 : 0,
        }));

        setRecentTransactions(
          recentTxSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Transaction))
        );
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(
          'Failed to load dashboard data. You may not have the required permissions. Please contact support.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    const pendingKycUnsub = onSnapshot(
      query(collection(db, 'users'), where('kycStatus', '==', 'Pending')),
      (snap) => setStats((prev) => ({ ...prev, pendingKYC: snap.size }))
    );

    const pendingTxUnsub = onSnapshot(
      query(collection(db, 'transactions'), where('status', '==', 'pending')),
      (snap) => setStats((prev) => ({ ...prev, pendingTransactions: snap.size }))
    );

    return () => {
      pendingKycUnsub();
      pendingTxUnsub();
    };
  }, []);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    description,
    className = '',
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: number; // Placeholder value
    description?: string;
    className?: string;
  }) => (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <div
            className={`flex items-center text-xs ${
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
            {trend >= 0 ? (
              <ArrowUpRight className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-1" />
            )}
            {/* Note: Trend is a placeholder value */}
            {Math.abs(trend)}% from last week
          </div>
        )}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Card className="w-full max-w-lg bg-red-50 border-red-200">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-red-700">Dashboard Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-red-600">{error}</p>
            <Button className="w-full mt-6" onClick={() => window.location.reload()}>Reload Page</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dashboard Overview</h1>
          <p className="text-muted-foreground">Real-time analytics and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend={8.2} // Placeholder
          description="Registered users"
        />

        <StatCard
          title="Today's Revenue"
          value={`₹${stats.todayRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend={15.3} // Placeholder
          description="Total deposits today"
        />

        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={Activity}
          description="Active in last 24 hours"
        />

        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
          trend={-2.1} // Placeholder
          description="Depositing users"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Deposits"
          value={`₹${stats.totalDeposits.toLocaleString()}`}
          icon={CreditCard}
          className="lg:col-span-2"
        />

        <Link href="/admin/kyc" className="no-underline">
          <StatCard
            title="Pending KYC"
            value={stats.pendingKYC}
            icon={ShieldCheck}
            description="Awaiting verification"
          />
        </Link>

        <Link href="/admin/transactions?status=pending" className="no-underline">
            <StatCard
              title="Pending Transactions"
              value={stats.pendingTransactions}
              icon={AlertTriangle}
              description="Require action"
            />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Frequently used admin functions</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => router.push('/admin/transactions')}
              variant="outline"
              className="h-16 flex-col gap-1">
              <CreditCard className="h-5 w-5" />
              Transactions
            </Button>
            <Button
              onClick={() => router.push('/admin/users')}
              variant="outline"
              className="h-16 flex-col gap-1">
              <Users className="h-5 w-5" />
              Users
            </Button>
            <Button
              onClick={() => router.push('/admin/kyc')}
              variant="outline"
              className="h-16 flex-col gap-1">
              <ShieldCheck className="h-5 w-5" />
              KYC Review
            </Button>
            <Button
              onClick={() => router.push('/admin/payments')}
              variant="outline"
              className="h-16 flex-col gap-1">
              <Wallet className="h-5 w-5" />
              Payment UPIs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest 5 transactions across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          transaction.type === 'deposit'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                        {transaction.type === 'deposit' ? (
                          <ArrowDownRight className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.userId?.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{transaction.amount}</p>
                      <Badge
                        variant={
                          transaction.status === 'completed'
                            ? 'default'
                            : transaction.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No recent transactions
              </p>
            )}
            <Button
              onClick={() => router.push('/admin/transactions')}
              variant="ghost"
              className="w-full mt-4">
              View All Transactions
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
