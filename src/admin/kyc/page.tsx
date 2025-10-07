"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import Image from "next/image";
import { Loader2, AlertTriangle, CheckCircle, Search, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserProfile } from "@/models/user.model";

interface KycRequest extends UserProfile {
  id: string;
}

function KycDetailModal({ user, isOpen, onClose }: { user: KycRequest | null, isOpen: boolean, onClose: () => void }) {
    const [rejectionReason, setRejectionReason] = useState("");

    if (!user) return null;

    const handleApprove = async () => {
        if (!user) return;
        try {
            await updateDoc(doc(db, "users", user.id), { kycStatus: "approved", kycNotes: "" });
            onClose();
        } catch (error) {
            console.error("Error approving KYC: ", error);
        }
    };

    const handleReject = async () => {
        if (!user || !rejectionReason.trim()) return;
        try {
            await updateDoc(doc(db, "users", user.id), { kycStatus: "rejected", kycNotes: rejectionReason });
            onClose();
        } catch (error) {
            console.error("Error rejecting KYC: ", error);
        }
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>KYC Details for {user.displayName}</DialogTitle>
            <DialogDescription>Review and verify user-submitted KYC information.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">User Information</h3>
              <p><strong>UID:</strong> {user.uid}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Phone:</strong> {user.phoneNumber}</p>
              <p><strong>DOB:</strong> {user.dob}</p>
              <p><strong>Aadhaar No:</strong> {user.aadhaarNumber}</p>
              <p><strong>PAN No:</strong> {user.panNumber}</p>
            </div>
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Documents</h3>
                <div>
                    <p className="font-semibold">Aadhaar Card</p>
                    {user.aadhaarCardUrl ? 
                      <Image src={user.aadhaarCardUrl} alt="Aadhaar Card" width={300} height={200} className="rounded-lg border"/> : 
                      <p className="text-muted-foreground">Not provided</p>}
                </div>
                <div>
                    <p className="font-semibold">PAN Card</p>
                     {user.panCardUrl ? 
                      <Image src={user.panCardUrl} alt="PAN Card" width={300} height={200} className="rounded-lg border"/> : 
                      <p className="text-muted-foreground">Not provided</p>}
                </div>
            </div>
          </div>
          {user.kycStatus === 'pending' && (
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-2">Actions</h3>
              <div className="space-y-2">
                <textarea
                    placeholder="Enter reason for rejection (required if rejecting)"
                    className="w-full p-2 border rounded text-sm"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleApprove}>Approve</Button>
                    <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>Reject</Button>
                </div>
              </div>
            </div>
           )}
           {user.kycStatus === 'rejected' && user.kycNotes && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
                    <p className="font-bold flex items-center gap-2"><AlertTriangle size={16} /> Rejection Reason:</p>
                    <p>{user.kycNotes}</p>
                </div>
            )}
        </DialogContent>
      </Dialog>
    )
}

export default function AdminKycPage() {
    const [kycRequests, setKycRequests] = useState<KycRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<KycRequest | null>(null);
    const [filter, setFilter] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const q = query(collection(db, "users"), where("kycStatus", "!=", "none"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as KycRequest));
            setKycRequests(requests);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching KYC requests: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredRequests = kycRequests.filter(req => {
        const matchesFilter = filter === 'all' || req.kycStatus === filter;
        const matchesSearch = !searchTerm || req.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || req.uid.includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    const statusVariants: {[key: string]: "default" | "secondary" | "destructive" | "outline"} = {
        pending: "secondary",
        approved: "default",
        rejected: "destructive"
    }

    return (
        <div className="space-y-4">
            <KycDetailModal user={selectedUser} isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} />
            <Card>
                <CardHeader>
                    <CardTitle>KYC Management</CardTitle>
                    <CardDescription>Review and manage user KYC submissions.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or UID"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 w-full"
                            />
                        </div>
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email/Phone</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRequests.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.displayName || user.uid}</TableCell>
                                        <TableCell>{user.email || user.phoneNumber}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariants[user.kycStatus || 'pending'] || 'secondary'}>
                                                {user.kycStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredRequests.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">
                                            No requests found.
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
