
"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, Eye, FileText } from "lucide-react";
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { UserProfile } from "@/models/user.model";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import Image from "next/image";

function KycDetailsModal({ user }: { user: UserProfile }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1"/> View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-primary">KYC Details for {user.name}</DialogTitle>
          <DialogDescription>Review the user's submitted information and documents.</DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2 text-primary">User Information</h3>
            <div className="text-sm"><strong>Aadhaar Number:</strong> {user.aadhaarNumber || 'N/A'}</div>
            <div className="text-sm"><strong>PAN Number:</strong> {user.panNumber || 'N/A'}</div>
            <div className="text-sm"><strong>Date of Birth:</strong> {user.dob || 'N/A'}</div>
            <div className="text-sm"><strong>UPI ID for Payout:</strong> {user.upiId || 'N/A'}</div>
          </div>
          <div className="space-y-4">
             <h3 className="font-semibold text-lg border-b pb-2 text-primary">Uploaded Documents</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium mb-2">Aadhaar Card</p>
                  {user.aadhaarCardUrl ? (
                    <a href={user.aadhaarCardUrl} target="_blank" rel="noopener noreferrer">
                      <Image src={user.aadhaarCardUrl} alt="Aadhaar Card" width={200} height={120} className="rounded-lg border object-cover cursor-pointer" />
                    </a>
                  ) : (<p className="text-muted-foreground text-sm">Not provided</p>)}
                </div>
                 <div>
                  <p className="font-medium mb-2">PAN Card</p>
                  {user.panCardUrl ? (
                     <a href={user.panCardUrl} target="_blank" rel="noopener noreferrer">
                        <Image src={user.panCardUrl} alt="PAN Card" width={200} height={120} className="rounded-lg border object-cover cursor-pointer" />
                     </a>
                  ) : (<p className="text-muted-foreground text-sm">Not provided</p>)}
                </div>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function KycPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending");

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "users"), where("kycStatus", "==", filter));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching KYC requests:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter]);

  const handleKycUpdate = async (userId: string, status: 'Verified' | 'Rejected') => {
      let reasonForRejection: string | null = '';
      if (status === 'Rejected') {
          reasonForRejection = prompt("Reason for rejection (optional):");
          if (reasonForRejection === null) { // User clicked cancel
            return;
          }
      }
      
      if (confirm(`Are you sure you want to ${status} this KYC application?`)) {
          const userRef = doc(db, 'users', userId);
          try {
            await updateDoc(userRef, {
                kycStatus: status,
                kycNotes: status === 'Rejected' ? reasonForRejection : '',
            });
            alert(`User KYC has been successfully ${status.toLowerCase()}.`);
          } catch (e) {
            alert(`Failed to update KYC status: ${(e as Error).message}`);
          }
      }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">KYC Management</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">KYC Submissions</CardTitle>
          <CardDescription>Review and approve or reject user KYC submissions.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12" />
              <p className="mt-4">No {filter.toLowerCase()} KYC requests found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>User Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Details & Documents</TableHead>
                          <TableHead>Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {users.map(user => (
                          <TableRow key={user.uid}>
                              <TableCell>{user.name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                  <KycDetailsModal user={user} />
                              </TableCell>
                              <TableCell>
                                  {user.kycStatus === 'Pending' && (
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleKycUpdate(user.uid, 'Verified')} className="bg-green-600 hover:bg-green-700">
                                            <Check className="h-4 w-4 mr-1"/> Approve
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleKycUpdate(user.uid, 'Rejected')}>
                                            <X className="h-4 w-4 mr-1"/> Reject
                                        </Button>
                                    </div>
                                  )}
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
