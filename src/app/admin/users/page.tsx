
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Loader2 } from "lucide-react";
import Image from "next/image";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { UserProfile } from "@/models/user.model";
import { useRouter } from "next/navigation";

export default function UsersPage() {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: UserProfile[] = [];
      snapshot.forEach(doc => usersData.push({ uid: doc.id, ...doc.data() } as UserProfile));
      setAllUsers(usersData);
      setLoading(false);
    }, (error) => {
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const filteredUsers = useMemo(() => {
      if (!searchTerm) return allUsers;
      return allUsers.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phoneNumber?.includes(searchTerm)
      );
  }, [allUsers, searchTerm]);
  
  const handleUserClick = (userId: string) => {
      router.push(`/admin/users/${userId}`);
  }

  const formatLastSeen = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate();
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">User Management</h1>
        <Button disabled>
          <UserPlus className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">All Users ({filteredUsers.length})</CardTitle>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, email, or phone..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="hidden md:table-cell">Contact</TableHead>
                        <TableHead>KYC</TableHead>
                        <TableHead className="hidden lg:table-cell">Wallet</TableHead>
                        <TableHead className="hidden md:table-cell">Joined</TableHead>
                        <TableHead>Last Seen</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredUsers.map((user) => (
                        <TableRow key={user.uid} onClick={() => handleUserClick(user.uid)} className="cursor-pointer">
                        <TableCell>
                            <div className="flex items-center gap-3">
                            <Image src={user.avatarUrl} alt={user.name} width={40} height={40} className="rounded-full" />
                            <div>
                                <span className="font-medium">{user.name}</span>
                                <div className="text-gray-500 text-sm md:hidden">{user.phoneNumber}</div>
                            </div>
                            </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                            <div>{user.email}</div>
                            <div className="text-gray-500 text-sm">{user.phoneNumber}</div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={user.kycStatus === 'Verified' ? 'default' : user.kycStatus === 'Pending' ? 'secondary' : 'destructive'}>{user.kycStatus}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                            ₹{user.depositBalance.toFixed(0)} / <span className="text-green-600 font-medium">₹{user.winningsBalance.toFixed(0)}</span>
                        </TableCell>
                        <TableCell className="text-gray-500 hidden md:table-cell">
                            {user.createdAt instanceof Timestamp ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}
                        </TableCell>
                         <TableCell className="text-gray-500 whitespace-nowrap">
                            {formatLastSeen(user.lastSeen)}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
