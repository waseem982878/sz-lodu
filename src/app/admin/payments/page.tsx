
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { PaymentUpi } from "@/models/payment-upi.model";

export default function PaymentsAdminPage() {
    const [upis, setUpis] = useState<PaymentUpi[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state for new UPI
    const [newUpiId, setNewUpiId] = useState("");
    const [newPayeeName, setNewPayeeName] = useState("");
    const [newDailyLimit, setNewDailyLimit] = useState(100000);

    useEffect(() => {
        const q = collection(db, "payment_upis");
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const upiData: PaymentUpi[] = [];
            snapshot.forEach(doc => upiData.push({ id: doc.id, ...doc.data() } as PaymentUpi));
            setUpis(upiData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAddUpi = async () => {
        if (!newUpiId || !newPayeeName || newDailyLimit <= 0) {
            alert("Please fill all fields correctly.");
            return;
        }
        setIsSaving(true);
        try {
            await addDoc(collection(db, "payment_upis"), {
                upiId: newUpiId,
                payeeName: newPayeeName,
                dailyLimit: newDailyLimit,
                currentReceived: 0,
                isActive: true,
            });
            // Clear form
            setNewUpiId("");
            setNewPayeeName("");
            setNewDailyLimit(100000);
        } catch (error) {
            alert("Failed to add UPI ID.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (upi: PaymentUpi) => {
        const upiRef = doc(db, 'payment_upis', upi.id);
        await updateDoc(upiRef, { isActive: !upi.isActive });
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this UPI ID? This cannot be undone.")) {
            await deleteDoc(doc(db, 'payment_upis', id));
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">Payment UPI Management</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Add New UPI ID</CardTitle>
                    <CardDescription>Add a new UPI for receiving payments. It will be active by default.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-upi-id">UPI ID</Label>
                        <Input id="new-upi-id" value={newUpiId} onChange={(e) => setNewUpiId(e.target.value)} placeholder="yourname@okhdfc" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-payee-name">Payee Name</Label>
                        <Input id="new-payee-name" value={newPayeeName} onChange={(e) => setNewPayeeName(e.target.value)} placeholder="John Doe" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="new-daily-limit">Daily Limit (₹)</Label>
                        <Input id="new-daily-limit" type="number" value={newDailyLimit} onChange={(e) => setNewDailyLimit(Number(e.target.value))} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleAddUpi} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Add UPI
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Manage Existing UPIs</CardTitle>
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
                                    <TableHead>UPI ID</TableHead>
                                    <TableHead>Payee Name</TableHead>
                                    <TableHead>Limit</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {upis.map(upi => {
                                    const progress = upi.dailyLimit > 0 ? (upi.currentReceived / upi.dailyLimit) * 100 : 0;
                                    return (
                                        <TableRow key={upi.id}>
                                            <TableCell className="font-medium">{upi.upiId}</TableCell>
                                            <TableCell>{upi.payeeName}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col w-40">
                                                    <span className="text-xs whitespace-nowrap">₹{upi.currentReceived.toLocaleString()} / ₹{upi.dailyLimit.toLocaleString()}</span>
                                                    <div className="w-full bg-muted rounded-full h-2.5 mt-1">
                                                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={upi.isActive ? 'default' : 'secondary'}>
                                                    {upi.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="flex gap-2 items-center">
                                                <Switch checked={upi.isActive} onCheckedChange={() => handleToggleActive(upi)} />
                                                <Button variant="destructive" size="icon" onClick={() => handleDelete(upi.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                       </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
