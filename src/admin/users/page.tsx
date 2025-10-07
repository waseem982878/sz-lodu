"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, where, Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/models/user.model";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Filter, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

const mockUsers: UserProfile[] = [
    // ... (Your mock users here)
];

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
        
        const unsubscribe: Unsubscribe = onSnapshot(usersQuery, (snapshot) => {
            let usersData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
            
            if (usersData.length === 0) {
                 console.log('No real users found, using mock data');
                usersData = mockUsers;
            }
            
            setUsers(usersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setUsers(mockUsers); // fallback to mock data on error
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesFilter = filter === 'all' 
            || (filter === 'active' && user.isActive) 
            || (filter === 'blocked' && !user.isActive)
            || (filter === 'kyc_verified' && user.kycStatus === 'approved');
            
        const matchesSearch = searchTerm === '' 
            || user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
            || user.email?.toLowerCase().includes(searchTerm.toLowerCase())
            || user.uid.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });
    
    const handleViewUser = (userId: string) => {
        router.push(`/admin/users/${userId}`);
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View and manage all registered users.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or UID"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 w-full"
                            />
                        </div>
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter users" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="blocked">Blocked</SelectItem>
                                <SelectItem value="kyc_verified">KYC Verified</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email / Phone</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>KYC</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               {filteredUsers.map((user) => (
                                    <TableRow key={user.uid}>
                                        <TableCell className="font-medium">{user.displayName || "N/A"}</TableCell>
                                        <TableCell>{user.email || user.phoneNumber || "N/A"}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.isActive !== false ? "default" : "destructive"}>
                                                {user.isActive !== false ? "Active" : "Blocked"}
                                            </Badge>
                                        </TableCell>
                                         <TableCell>
                                             <Badge variant={user.kycStatus === 'approved' ? "default" : "secondary"}>
                                                {user.kycStatus ? user.kycStatus.charAt(0).toUpperCase() + user.kycStatus.slice(1) : 'Not Submitted'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleViewUser(user.uid)}>
                                               <Eye className="h-4 w-4 mr-1"/> View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredUsers.length === 0 && (
                                     <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            No users found for the selected criteria.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
