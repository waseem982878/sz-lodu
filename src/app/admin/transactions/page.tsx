"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, CheckCircle, XCircle, Eye, Download, Search, 
  Filter, Calendar, MoreVertical, IndianRupee
} from "lucide-react";
import { collection, query, orderBy, onSnapshot, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Transaction } from "@/models/transaction.model";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  handleApproveDeposit, 
  handleApproveWithdrawal, 
  handleRejectTransaction 
} from "@/services/transaction-service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Enhanced Screenshot Modal
function ScreenshotModal({ imageUrl, transactionId }: { imageUrl: string; transactionId: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="mr-1 h-4 w-4" />
          View Proof
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary">
            Transaction Proof - {transactionId.slice(-8)}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 p-4">
          <Image 
            src={imageUrl} 
            alt="Transaction Screenshot" 
            width={400} 
            height={800} 
            className="max-h-[60vh] w-auto object-contain rounded-lg border"
          />
          <Button asChild variant="outline" size="sm">
            <a href={imageUrl} download={`proof-${transactionId}.jpg`}>
              <Download className="mr-2 h-4 w-4" />
              Download Image
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Date filter component
const DateFilter = ({ onDateChange }: { onDateChange: (date: Date | null) => void }) => {
  const [date, setDate] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDate(value);
    onDateChange(value ? new Date(value) : null);
  };

  return (
    <div className="relative">
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="date"
        value={date}
        onChange={handleChange}
        className="pl-9"
        placeholder="Filter by date"
      />
    </div>
  );
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    let q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    
    // Apply filters
    const conditions = [];
    if (filterType !== 'all') {
      conditions.push(where('type', '==', filterType));
    }
    if (filterStatus !== 'all') {
      conditions.push(where('status', '==', filterStatus));
    }
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(where('createdAt', '>=', Timestamp.fromDate(startOfDay)));
      conditions.push(where('createdAt', '<=', Timestamp.fromDate(endOfDay)));
    }

    // Apply all conditions to query
    conditions.forEach(condition => {
      q = query(q, condition);
    });

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const transactionsData: Transaction[] = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Transaction));
        setTransactions(transactionsData);
        setLoading(false);
      },
      (error) => {
        console.error('Transaction fetch error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filterType, filterStatus, selectedDate]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t =>
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.upiId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.amount.toString().includes(searchTerm)
    );
  }, [transactions, searchTerm]);

  const handleAction = async (action: Function, transaction: Transaction) => {
    setProcessingId(transaction.id);
    try {
      await action(transaction);
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const getAmountColor = (type: string, status: string) => {
    if (status === 'rejected') return 'text-gray-500';
    return type === 'deposit' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Transaction Management</h1>
          <p className="text-muted-foreground">
            {filteredTransactions.length} transactions found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" disabled>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, User ID, UPI, Amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="p-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
            </select>
            
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="p-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <DateFilter onDateChange={setSelectedDate} />
          </div>
          
          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2 mt-4">
            {filterType !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Type: {filterType}
                <button onClick={() => setFilterType('all')}>×</button>
              </Badge>
            )}
            {filterStatus !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {filterStatus}
                <button onClick={() => setFilterStatus('all')}>×</button>
              </Badge>
            )}
            {selectedDate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Date: {selectedDate.toLocaleDateString()}
                <button onClick={() => setSelectedDate(null)}>×</button>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Transaction ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                      <p className="text-muted-foreground mt-2">Loading transactions...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No transactions found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="group hover:bg-muted/50">
                      <TableCell className="font-mono text-xs p-3">
                        {transaction.id.slice(-8)}
                      </TableCell>
                      <TableCell className="p-3">
                        <div>
                          <p className="font-medium text-sm">{transaction.userName || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {transaction.userId.slice(0, 8)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="p-3">
                        <div className={`flex items-center font-semibold ${getAmountColor(transaction.type, transaction.status)}`}>
                          <IndianRupee className="h-3 w-3 mr-1" />
                          {transaction.amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="p-3">
                        <Badge 
                          variant={transaction.type === 'deposit' ? 'default' : 'secondary'}
                          className={transaction.type === 'deposit' 
                            ? "bg-green-100 text-green-800 hover:bg-green-100" 
                            : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                          }
                        >
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-3">
                        <Badge variant={getStatusVariant(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-3 text-sm text-muted-foreground">
                        {transaction.createdAt?.toDate().toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          {transaction.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => handleAction(
                                  transaction.type === 'deposit' ? handleApproveDeposit : handleApproveWithdrawal,
                                  transaction
                                )}
                                disabled={processingId === transaction.id}
                                className="bg-green-600 hover:bg-green-700 h-8 px-3"
                              >
                                {processingId === transaction.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleAction(handleRejectTransaction, transaction)}
                                disabled={processingId === transaction.id}
                                className="h-8 px-3"
                              >
                                {processingId === transaction.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                              </Button>
                            </>
                          )}
                          
                          {transaction.screenshotUrl && (
                            <ScreenshotModal 
                              imageUrl={transaction.screenshotUrl} 
                              transactionId={transaction.id}
                            />
                          )}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Contact User
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Mark as Fraud
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
