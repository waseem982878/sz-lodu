
"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, XCircle, Eye, Download, Search } from "lucide-react";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { Transaction } from "@/models/transaction.model";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { handleApproveDeposit, handleApproveWithdrawal, handleRejectTransaction } from "@/services/transaction-service";


function ScreenshotModal({ imageUrl }: { imageUrl: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Eye className="mr-1 h-4 w-4" /> View Proof</Button>
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');

  useEffect(() => {
    setLoading(true);
    let q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    
    if (filterType !== 'all') {
      q = query(q, where('type', '==', filterType));
    }
    if (filterStatus !== 'all') {
      q = query(q, where('status', '==', filterStatus));
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const transactionsData: Transaction[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setTransactions(transactionsData);
        setLoading(false);
      },
      (error) => {
        console.error('Transaction fetch error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filterType, filterStatus]);
  
  const onApproveDeposit = async (transaction: Transaction) => {
      try {
          await handleApproveDeposit(transaction);
          alert('Deposit approved successfully.');
      } catch (error) {
          alert(`Error approving deposit: ${(error as Error).message}`);
      }
  }

  const onReject = async (transaction: Transaction) => {
      const reason = prompt('Rejection reason:');
      if (!reason) return;
      try {
        await handleRejectTransaction(transaction.id, reason, transaction.type, transaction.userId, transaction.amount);
        alert('Transaction rejected');
      } catch (error) {
        alert(`Error rejecting transaction: ${(error as Error).message}`);
      }
  };
  
   const onApproveWithdrawal = async (transaction: Transaction) => {
      try {
        await handleApproveWithdrawal(transaction.id);
        alert('Withdrawal approved. Please send the payment manually.');
      } catch (error) {
        alert(`Error approving withdrawal: ${(error as Error).message}`);
      }
  };


  const filteredTransactions = transactions.filter(t =>
    (t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.upiId?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-0 sm:p-2 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Transaction Management</h1>
        <Button disabled>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
          <CardContent className="p-2 grid grid-cols-1 md:grid-cols-4 gap-2">
             <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, User ID, UPI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
             </div>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="p-2 border rounded-md bg-background text-sm"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="p-2 border rounded-md bg-background text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">User ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <tr><TableCell colSpan={6} className="text-center py-10"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></tr>}
                {!loading && filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-xs break-all p-2">{transaction.userId}</TableCell>
                    <TableCell className="p-2">₹{transaction.amount}</TableCell>
                    <TableCell className="p-2">
                      <Badge variant={transaction.type === 'deposit' ? 'default' : 'secondary'} className={transaction.type === 'deposit' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-2">
                      <Badge variant={
                        transaction.status === 'completed' ? 'default' :
                        transaction.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap p-2">
                      {transaction.createdAt?.toDate().toLocaleString()}
                    </TableCell>
                    <TableCell className="flex gap-1 p-2">
                      {transaction.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => transaction.type === 'deposit' ? onApproveDeposit(transaction) : onApproveWithdrawal(transaction)}
                            className="bg-green-600 hover:bg-green-700 h-8"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => onReject(transaction)}
                             className="h-8"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                       {transaction.screenshotUrl && (
                         <ScreenshotModal imageUrl={transaction.screenshotUrl} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {!loading && filteredTransactions.length === 0 && (
                <p className="text-center py-10 text-muted-foreground">No transactions found for the selected filters.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
