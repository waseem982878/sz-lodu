
"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, Eye, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, query, orderBy, doc, runTransaction, serverTimestamp, where, onSnapshot, updateDoc, increment, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { Transaction } from "@/models/transaction.model";
import type { Agent } from "@/models/agent.model";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";


function ScreenshotModal({ imageUrl }: { imageUrl: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Eye className="mr-1 h-4 w-4" /> View</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-primary">Deposit Screenshot</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center items-center p-4">
                    <Image src={imageUrl} alt="Deposit Screenshot" width={300} height={600} className="max-h-[80vh] w-auto object-contain" />
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function TransactionsPage() {
  const [deposits, setDeposits] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);

  
  useEffect(() => {
    // Mock agent for now as there is no login
     setCurrentAgent({
            id: 'mock-agent-id',
            name: 'Mock Agent',
            email: 'agent@example.com',
            floatBalance: 100000,
            usedAmount: 0,
            remainingBalance: 100000,
            isActive: true,
        });


    setLoading(true);
    
    const depositQuery = query(collection(db, "transactions"), where("type", "==", "deposit"), orderBy("createdAt", "desc"));
    const withdrawalQuery = query(collection(db, "transactions"), where("type", "==", "withdrawal"), orderBy("createdAt", "desc"));
    
    const unsubDeposits = onSnapshot(depositQuery, (snap) => {
        const depositData: Transaction[] = [];
        snap.forEach(doc => depositData.push({ id: doc.id, ...doc.data() } as Transaction));
        setDeposits(depositData);
        setLoading(false);
    }, (err) => {
        setLoading(false);
    });

    const unsubWithdrawals = onSnapshot(withdrawalQuery, (snap) => {
        const withdrawalData: Transaction[] = [];
        snap.forEach(doc => withdrawalData.push({ id: doc.id, ...doc.data() } as Transaction));
        setWithdrawals(withdrawalData);
        setLoading(false);
    }, (err) => {
        setLoading(false);
    });

    return () => {
        unsubDeposits();
        unsubWithdrawals();
    };
  }, []);
  
  const handleDeposit = async (transaction: Transaction, newStatus: 'completed' | 'rejected') => {
      if(transaction.status !== 'pending' || !currentAgent) return;
      const transRef = doc(db, 'transactions', transaction.id);
      const userRef = doc(db, 'users', transaction.userId);

      try {
          await runTransaction(db, async (t) => {
              if (newStatus === 'completed') {
                  const depositAmount = transaction.amount;
                  const bonusAmount = transaction.bonusAmount || 0;
                  const totalCredit = depositAmount + bonusAmount;

                  t.update(userRef, { depositBalance: increment(totalCredit) });
                  
                  if (transaction.upiId) {
                       const upiQuery = query(collection(db, "payment_upis"), where("upiId", "==", transaction.upiId));
                       const upiDocs = await getDocs(upiQuery);
                       if(!upiDocs.empty) {
                           const upiRef = upiDocs.docs[0].ref;
                           t.update(upiRef, { currentReceived: increment(transaction.amount) });
                       }
                  }
              }
              t.update(transRef, { 
                  status: newStatus, 
                  updatedAt: serverTimestamp(),
                  processedBy: { id: currentAgent.id, name: currentAgent.name }
              });
          });
          alert(`Deposit has been ${newStatus}.`);
      } catch (error) {
          alert("Error updating deposit status.");
      }
  }
  
  const handleWithdrawal = async (transaction: Transaction, newStatus: 'completed' | 'rejected') => {
       if(transaction.status !== 'pending' || !currentAgent) return;
       const transRef = doc(db, 'transactions', transaction.id);
       const userRef = doc(db, 'users', transaction.userId);
       
       try {
           await runTransaction(db, async (t) => {
                const agentRef = doc(db, 'agents', currentAgent.id);
                
                if (newStatus === 'rejected') {
                    // Refund the amount to the user's winnings balance if rejected
                    t.update(userRef, { winningsBalance: increment(transaction.amount) });
                    t.update(transRef, { 
                        status: newStatus, 
                        updatedAt: serverTimestamp(), 
                        notes: "Admin rejected withdrawal.",
                        processedBy: { id: currentAgent.id, name: currentAgent.name }
                    });
                } else { // Approved
                    const agentDoc = await t.get(agentRef);
                    if (!agentDoc.exists()) throw new Error("Agent not found");
                    const agentData = agentDoc.data() as Agent;
                    // Check if agent has enough float balance (if not infinite)
                    if (agentData.floatBalance !== Infinity && (agentData.floatBalance - agentData.usedAmount) < transaction.amount) {
                        throw new Error("Agent has insufficient float balance to approve this withdrawal.");
                    }
                    
                    // Increment the agent's used amount
                    t.update(agentRef, { usedAmount: increment(transaction.amount) });
                    
                    // Update transaction status
                    t.update(transRef, { 
                        status: newStatus, 
                        updatedAt: serverTimestamp(), 
                        notes: "Admin approved withdrawal. Awaiting payment confirmation.",
                        processedBy: { id: currentAgent.id, name: currentAgent.name }
                    });
                }
           });
           alert(`Withdrawal has been ${newStatus}.`);
       } catch (error) {
            const err = error as Error;
            alert(`Error updating withdrawal status: ${err.message}`);
       }
  }
  
  const confirmPaymentSent = async (transactionId: string) => {
      if (confirm("Are you sure you have sent the payment for this withdrawal? This marks the final step.")) {
        const transRef = doc(db, 'transactions', transactionId);
        await updateDoc(transRef, {
            paymentSent: true,
            notes: "Payment confirmed by agent."
        });
        alert("Payment marked as sent.");
      }
  }

  const renderTable = (type: 'deposit' | 'withdrawal', data: Transaction[]) => {
    if (loading) return <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!currentAgent) return <div className="text-center py-10 text-red-500">Your agent profile is not set up. Please contact the super admin.</div>
    
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="hidden sm:table-cell">Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="hidden sm:table-cell">Processed By</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map(t => (
                        <TableRow key={t.id}>
                            <TableCell className="font-mono text-xs truncate max-w-24 sm:max-w-xs">{t.userId}</TableCell>
                            <TableCell>
                                ₹{t.amount}
                                {t.type === 'deposit' && t.bonusAmount && <span className="text-green-600 text-xs ml-1 block sm:inline">(+₹{t.bonusAmount} bonus)</span>}
                            </TableCell>
                            <TableCell className="text-xs hidden sm:table-cell whitespace-nowrap">{new Date((t.createdAt as any)?.seconds * 1000).toLocaleString()}</TableCell>
                            <TableCell>
                                <Badge variant={t.status === 'completed' ? 'default' : t.status === 'pending' ? 'secondary' : 'destructive'}>{t.status}</Badge>
                                {t.status === 'completed' && t.paymentSent && type === 'withdrawal' && <Badge className="ml-1 bg-blue-500 hidden sm:inline-flex">Paid</Badge>}
                            </TableCell>
                            
                            <TableCell>
                                {t.type === 'deposit' && t.screenshotUrl && (<ScreenshotModal imageUrl={t.screenshotUrl} />)}
                                {t.type === 'withdrawal' && t.withdrawalDetails && (<span className="text-xs truncate block w-28">{t.withdrawalDetails.method}: {t.withdrawalDetails.address}</span>)}
                            </TableCell>

                            <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{t.processedBy?.name || 'N/A'}</TableCell>

                            <TableCell>
                                {t.status === 'pending' && (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button size="sm" variant="default" onClick={() => type === 'deposit' ? handleDeposit(t, 'completed') : handleWithdrawal(t, 'completed')}>
                                            <Check className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Approve</span>
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => type === 'deposit' ? handleDeposit(t, 'rejected') : handleWithdrawal(t, 'rejected')}>
                                            <X className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Reject</span>
                                        </Button>
                                    </div>
                                )}
                                 {t.status === 'completed' && !t.paymentSent && type === 'withdrawal' && (
                                    <Button size="sm" variant="secondary" onClick={() => confirmPaymentSent(t.id)}>
                                        <Send className="h-4 w-4 mr-1"/> <span className="hidden sm:inline">Confirm</span>
                                    </Button>
                                 )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Transactions</h1>
      <Tabs defaultValue="deposits">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposits">Deposit Requests</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawal Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="deposits">
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Deposit History</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTable('deposit', deposits)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Withdrawal History</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTable('withdrawal', withdrawals)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
