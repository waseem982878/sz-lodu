
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PaymentService } from "@/services/payment.service";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import type { PaymentRequest } from "@/models/payment-upi.model";

export default function PaymentVerificationPage() {
  const [pendingPayments, setPendingPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "payment_requests"),
      where("status", "==", "pending"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const payments: PaymentRequest[] = [];
      snapshot.forEach(doc => {
        payments.push({ id: doc.id, ...doc.data() } as PaymentRequest);
      });
      setPendingPayments(payments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleVerifyPayment = async (paymentId: string) => {
    if (!transactionId.trim()) {
      alert("Please enter transaction ID");
      return;
    }

    setVerifying(paymentId);
    try {
      await PaymentService.verifyPayment(paymentId, transactionId.trim());
      setTransactionId("");
      alert("Payment verified successfully!");
    } catch (error) {
      console.error("Verification failed:", error);
      alert("Verification failed: " + (error as Error).message);
    } finally {
      setVerifying(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: <Clock className="h-3 w-3" />, label: 'Pending' },
      completed: { variant: 'default' as const, icon: <CheckCircle className="h-3 w-3" />, label: 'Completed' },
      failed: { variant: 'destructive' as const, icon: <XCircle className="h-3 w-3" />, label: 'Failed' },
      expired: { variant: 'outline' as const, icon: <XCircle className="h-3 w-3" />, label: 'Expired' }
    };

    const config = variants[status as keyof typeof variants] || variants.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-20">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Payment Verification</h1>
        <p className="text-muted-foreground">Manually verify UPI payments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Payments</CardTitle>
          <CardDescription>
            Verify payments by checking UPI transaction ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : pendingPayments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No pending payments
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map(payment => (
                <Card key={payment.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">Order: {payment.orderId}</span>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label>Amount</Label>
                          <p className="font-medium">₹{payment.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <Label>UPI ID</Label>
                          <p className="font-medium">{payment.upiId}</p>
                        </div>
                        <div>
                          <Label>Payee Name</Label>
                          <p className="font-medium">{payment.payeeName}</p>
                        </div>
                        <div>
                          <Label>Expires</Label>
                          <p className="font-medium">
                            {new Date(payment.expiresAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      {payment.description && (
                        <div>
                          <Label>Description</Label>
                          <p className="text-sm text-muted-foreground">{payment.description}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 min-w-80">
                      <Label htmlFor={`transaction-${payment.id}`}>Transaction ID</Label>
                      <Input
                        id={`transaction-${payment.id}`}
                        placeholder="Enter UPI transaction ID"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                      />
                      <Button
                        onClick={() => handleVerifyPayment(payment.id)}
                        disabled={verifying === payment.id}
                        className="w-full"
                      >
                        {verifying === payment.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Verify Payment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
