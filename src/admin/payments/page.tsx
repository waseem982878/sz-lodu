
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { PaymentUpi } from "@/models/payment-upi.model";

export default function PaymentsAdminPage() {
    const [upis, setUpis] = useState<PaymentUpi[]>([]);
    const [newUpi, setNewUpi] = useState({ upiId: '', payeeName: '', dailyLimit: '10000' });

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'payment_upis'), (snapshot) => {
            const upisData: PaymentUpi[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentUpi));
            setUpis(upisData);
        });
        return () => unsubscribe();
    }, []);

    const handleUpiToggle = async (id: string, currentStatus: boolean) => {
        const upiRef = doc(db, 'payment_upis', id);
        try {
            await updateDoc(upiRef, { isActive: !currentStatus });
        } catch (error) {
            console.error("Error updating UPI status: ", error);
            alert("Failed to update status");
        }
    };

    const handleAddUpi = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUpi.upiId || !newUpi.payeeName) {
            alert("Please fill in all fields");
            return;
        }

        try {
            await addDoc(collection(db, 'payment_upis'), {
                ...newUpi,
                dailyLimit: parseFloat(newUpi.dailyLimit),
                currentReceived: 0,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            setNewUpi({ upiId: '', payeeName: '', dailyLimit: '10000' }); // Reset form
        } catch (error) {
            console.error("Error adding new UPI: ", error);
            alert("Failed to add new UPI");
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">Payment Gateway Management</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Add New UPI</CardTitle>
                    <CardDescription>Add a new UPI ID to receive payments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddUpi} className="flex flex-wrap items-end gap-4">
                        <div className="flex-grow">
                            <label htmlFor="upiId" className="text-sm font-medium">UPI ID</label>
                            <Input id="upiId" value={newUpi.upiId} onChange={e => setNewUpi({ ...newUpi, upiId: e.target.value })} placeholder="e.g., yourname@okhdfcbank" />
                        </div>
                        <div className="flex-grow">
                            <label htmlFor="payeeName" className="text-sm font-medium">Payee Name</label>
                             <Input id="payeeName" value={newUpi.payeeName} onChange={e => setNewUpi({ ...newUpi, payeeName: e.target.value })} placeholder="e.g., John Doe" />
                        </div>
                        <div className="flex-grow">
                             <label htmlFor="dailyLimit" className="text-sm font-medium">Daily Limit</label>
                             <Input id="dailyLimit" type="number" value={newUpi.dailyLimit} onChange={e => setNewUpi({ ...newUpi, dailyLimit: e.target.value })} />
                        </div>
                        <Button type="submit">Add UPI</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Manage UPI IDs</CardTitle>
                    <CardDescription>Monitor and manage the active UPI IDs for payments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>UPI ID</TableHead>
                                    <TableHead>Payee Name</TableHead>
                                    <TableHead>Today's Collection</TableHead>
                                    <TableHead>Daily Limit</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {upis.map((upi) => (
                                    <TableRow key={upi.id}>
                                        <TableCell className="font-medium">{upi.upiId}</TableCell>
                                        <TableCell>{upi.payeeName}</TableCell>
                                        <TableCell>₹{upi.currentReceived.toLocaleString()}</TableCell>
                                        <TableCell>₹{upi.dailyLimit.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={upi.isActive ? "default" : "destructive"}>
                                                {upi.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Switch
                                                checked={upi.isActive}
                                                onCheckedChange={() => handleUpiToggle(upi.id, upi.isActive)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
