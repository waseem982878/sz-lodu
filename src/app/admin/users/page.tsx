'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  UserPlus,
  Loader2,
  CircleUserRound,
  Shield,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Wallet,
  Edit,
  Filter,
  MoreVertical,
  IndianRupee,
  TrendingUp,
  Ban,
  Users,
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/models/user.model';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

function InfoDialog({
  open,
  onClose,
  title,
  message,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle
            className={title === 'Success' ? 'text-green-600' : 'text-red-600'}
          >
            {title}
          </DialogTitle>
          <DialogDescription className="pt-4">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button onClick={onClose}>OK</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="pt-4">{message}</DialogDescription>
        </Header>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </DialogClose>
          <Button onClick={onConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>(
    'all'
  );
  const [kycFilter, setKycFilter] = useState<
    'all' | 'verified' | 'pending' | 'rejected' | 'not_submitted'
  >('all');

  const [dialogState, setDialogState] = useState({ open: false, title: '', message: '' });
  const [confirmationState, setConfirmationState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersData: UserProfile[] = [];
        snapshot.forEach((doc) => {
          usersData.push({ uid: doc.id, ...doc.data() } as UserProfile);
        });
        setUsers(usersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching users:', error);
        setLoading(false);
        showDialog('Error', 'Failed to fetch users. Check console for details.');
      }
    );

    return () => unsubscribe();
  }, []);

  const showDialog = (title: string, message: string) => {
    setDialogState({ open: true, title, message });
  };

  const handleToggleUser = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'block' : 'unblock';
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: !currentStatus,
        ...(!currentStatus && { blockedAt: null }), // Unset blockedAt when unblocking
        ...(currentStatus && { blockedAt: new Date() }),
      });
      showDialog('Success', `User has been successfully ${action}ed.`);
    } catch (error: any) {
      console.error(`Error ${action}ing user:`, error);
      showDialog('Error', `Failed to ${action} user: ${error.message}`);
    }
  };
  
  const confirmToggleUser = (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'Block' : 'Unblock';
    setConfirmationState({
        open: true,
        title: `${action} User?`,
        message: `Are you sure you want to ${action.toLowerCase()} this user?`,
        onConfirm: () => {
            setConfirmationState(null);
            handleToggleUser(userId, currentStatus);
        },
    });
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phoneNumber || '').includes(searchTerm) ||
        user.uid.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.isActive !== false) ||
        (statusFilter === 'blocked' && user.isActive === false);

      const kycStatus = user.kycStatus || 'not_submitted';
      const matchesKyc =
        kycFilter === 'all' ||
        (kycFilter === 'verified' && (kycStatus === 'Verified' || kycStatus === 'approved')) ||
        (kycFilter === 'pending' && kycStatus === 'Pending') ||
        (kycFilter === 'rejected' && kycStatus === 'Rejected') ||
        (kycFilter === 'not_submitted' && kycStatus === 'not_submitted');

      return matchesSearch && matchesStatus && matchesKyc;
    });
  }, [users, searchTerm, statusFilter, kycFilter]);

  const getKycBadge = (status: UserProfile['kycStatus']) => {
    switch (status) {
      case 'Verified':
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case 'Pending':
        return (
          <Badge variant="secondary">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge variant="destructive">
            <Ban className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Not Submitted</Badge>;
    }
  };

  const getStatusBadge = (isActive?: boolean) => {
    return isActive === false ? (
      <Badge variant="destructive">
        <Ban className="h-3 w-3 mr-1" />
        Blocked
      </Badge>
    ) : (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="p-4 space-y-6">
        <InfoDialog
            open={dialogState.open}
            onClose={() => setDialogState({ ...dialogState, open: false })}
            title={dialogState.title}
            message={dialogState.message}
        />
        {confirmationState && (
            <ConfirmationDialog
                open={confirmationState.open}
                onClose={() => setConfirmationState(null)}
                onConfirm={confirmationState.onConfirm}
                title={confirmationState.title}
                message={confirmationState.message}
            />
        )}

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">User Management</h1>
          <p className="text-muted-foreground">
            {filteredUsers.length} users found •{' '}
            {users.filter((u) => u.isActive !== false).length} active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/admin/users/invite">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            User Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
                <Input
                  placeholder="Search by name, email, phone, or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="p-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>

            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value as any)}
              className="p-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All KYC</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="not_submitted">Not Submitted</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Information</TableHead>
                  <TableHead>Wallet Balance</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                      <p className="text-muted-foreground mt-2">Loading users...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No users found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.uid} className="group hover:bg-muted/50">
                      <TableCell className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <CircleUserRound className="h-10 w-10 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm truncate">
                              {user.name || 'N/A'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email || 'N/A'}
                              </p>
                            </div>
                            {user.phoneNumber && (
                              <div className="flex items-center gap-2 mt-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  {user.phoneNumber}
                                </p>
                              </div>
                            )}
                            <p className="text-xs font-mono text-muted-foreground mt-1">
                              ID: {user.uid.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <IndianRupee className="h-3 w-3 mr-1 text-blue-600" />
                            <span className="font-medium">
                              {user.depositBalance?.toFixed(0) || 0}
                            </span>
                            <span className="text-muted-foreground mx-1">|</span>
                            <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                            <span className="font-medium text-green-600">
                              {user.winningsBalance?.toFixed(0) || 0}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Total: ₹
                            {((
                              user.depositBalance || 0
                            ) + (user.winningsBalance || 0)).toFixed(0)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="p-4">
                        {getKycBadge(user.kycStatus)}
                      </TableCell>

                      <TableCell className="p-4">
                        {getStatusBadge(user.isActive)}
                      </TableCell>

                      <TableCell className="p-4">
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(user.createdAt)}
                          </div>
                          {user.lastActive && (
                            <div>Last active: {formatDate(user.lastActive)}</div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/users/${user.uid}`}>
                              <Edit className="h-3 w-3 mr-1" />
                              Details
                            </Link>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/users/${user.uid}/transactions`}>
                                  View Transactions
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/users/${user.uid}/kyc`}>
                                  KYC Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Send Notification
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  confirmToggleUser(user.uid, user.isActive !== false)
                                }
                                className={
                                  user.isActive === false
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }
                              >
                                {user.isActive === false
                                  ? 'Unblock User'
                                  : 'Block User'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter((u) => u.isActive !== false).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">KYC Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {users.filter((u) => u.kycStatus === 'Pending').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Blocked Users</p>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter((u) => u.isActive === false).length}
                </p>
              </div>
              <Ban className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
