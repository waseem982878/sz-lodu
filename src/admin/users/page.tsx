
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Loader2, CircleUserRound, Shield, Mail, Phone, Calendar, AlertTriangle, CheckCircle, Wallet, Edit } from "lucide-react";
import { collection, query, orderBy, onSnapshot, Timestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/models/user.model";
import { useRouter } from "next/navigation";
import Link from "next/link";


export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: UserProfile[] = [];
      snapshot.forEach((doc) => {
        usersData.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleUser = async (userId: string, currentStatus: boolean) => {
    if (confirm(`Are you sure you want to ${!currentStatus ? 'activate' : 'block'} this user?`)) {
        try {
            await updateDoc(doc(db, 'users', userId), {
                isActive: !currentStatus
            });
            alert("User status updated.");
        } catch (error) {
            alert('Error updating user status');
        }
    }
  };


  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber?.includes(searchTerm)
    );
  }, [users, searchTerm]);

  return (
    <div className="p-0 sm:p-2 space-y-4">
       <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Wallet (Dep/Win)</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <tr><TableCell colSpan={6} className="text-center py-10"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></tr>}
                {!loading && filteredUsers.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="p-2">
                      <div className="flex items-center gap-2">
                          <CircleUserRound className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <p className="font-semibold text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{user.uid}</p>
                          </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-2">
                      <div className="text-xs">
                        <p>{user.email}</p>
                        <p className="text-muted-foreground">{user.phoneNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell className="p-2">
                      <p className="text-xs font-semibold">
                          ₹{user.depositBalance.toFixed(0)} / <span className="text-green-600">₹{user.winningsBalance.toFixed(0)}</span>
                      </p>
                    </TableCell>
                    <TableCell className="p-2">
                      <Badge variant={
                        user.kycStatus === 'Verified' ? 'default' :
                        user.kycStatus === 'Pending' ? 'secondary' : 'destructive'
                      }>
                        {user.kycStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-2">
                       <Badge variant={user.isActive === false ? 'destructive' : 'default'}>
                         {user.isActive === false ? 'Blocked' : 'Active'}
                       </Badge>
                    </TableCell>
                    <TableCell className="p-2 flex gap-1">
                       <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/users/${user.uid}`}>
                            <Edit className="h-3 w-3 mr-1"/> View
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant={user.isActive === false ? 'default' : 'destructive'}
                        onClick={() => handleToggleUser(user.uid, user.isActive !== false)}
                      >
                        {user.isActive === false ? 'Unblock' : 'Block'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!loading && filteredUsers.length === 0 && (
                <p className="text-center py-10 text-muted-foreground">No users found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
