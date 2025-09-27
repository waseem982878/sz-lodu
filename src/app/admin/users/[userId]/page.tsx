
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, orderBy, or, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { UserProfile } from "@/models/user.model";
import type { Transaction } from "@/models/transaction.model";
import type { Battle } from "@/models/battle.model";
import { Loader2, ArrowLeft, Mail, Phone, Calendar, UserCheck, Wallet, Gamepad2, Trophy, Percent, Edit, CircleUserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { updateUserBalances } from "@/services/user-agent-service";


function EditBalanceModal({ user, onUpdate }: { user: UserProfile, onUpdate: () => void }) {
    const [depositBalance, setDepositBalance] = useState(user.depositBalance);
    const [winningsBalance, setWinningsBalance] = useState(user.winningsBalance);
    const [isSaving, setIsSaving] = useState(false);
    const [open, setOpen] = useState(false);

    const handleSave = async () => {
        if (confirm("Are you sure you want to manually override this user's balance? This action is irreversible.")) {
            setIsSaving(true);
            try {
                await updateUserBalances(user.uid, depositBalance, winningsBalance);
                alert("Balances updated successfully!");
                onUpdate(); // Trigger data refresh on parent
                setOpen(false);
            } catch (error) {
                alert("Failed to update balances.");
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2">
                    <Edit className="h-3 w-3" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-primary">Edit Balance for {user.name}</DialogTitle>
                    <DialogDescription>
                        Manually set the deposit and winnings balance. This will not create a transaction record.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="deposit" className="text-right">Deposit</Label>
                        <Input
                            id="deposit"
                            type="number"
                            value={depositBalance}
                            onChange={(e) => setDepositBalance(Number(e.target.value))}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="winnings" className="text-right">Winnings</Label>
                        <Input
                            id="winnings"
                            type="number"
                            value={winningsBalance}
                            onChange={(e) => setWinningsBalance(Number(e.target.value))}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


type StatCardProps = {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
    children?: React.ReactNode;
}

const StatCard = ({ icon: Icon, label, value, color, children }: StatCardProps) => (
    <Card className={`bg-opacity-10 border-l-4 ${color}`}>
        <CardContent className="p-3 flex items-center gap-3">
            <div className={`p-2 rounded-full bg-opacity-20 ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            {children}
        </CardContent>
    </Card>
);


export default function UserDetailPage({ params }: { params: { userId: string } }) {
    const router = useRouter();
    const { userId } = params;
    const [user, setUser] = useState<UserProfile | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [battles, setBattles] = useState<Battle[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAllData = useCallback(() => {
        if (!userId) return;
        setLoading(true);

        const userRef = doc(db, 'users', userId);
        const userUnsub = onSnapshot(userRef, (userSnap) => {
            if (userSnap.exists()) {
                setUser({ uid: userSnap.id, ...userSnap.data() } as UserProfile);
            }
            setLoading(false);
        }, () => setLoading(false));

        const transQuery = query(collection(db, 'transactions'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
        const transUnsub = onSnapshot(transQuery, (transSnap) => {
            setTransactions(transSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
        });

        const battlesQuery = query(
            collection(db, 'battles'),
            or(where('creator.id', '==', userId), where('opponent.id', '==', userId)),
            orderBy('createdAt', 'desc')
        );
        const battlesUnsub = onSnapshot(battlesQuery, (battlesSnap) => {
            setBattles(battlesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Battle)));
        });

        return () => {
            userUnsub();
            transUnsub();
            battlesUnsub();
        };

    }, [userId]);


    useEffect(() => {
        const unsub = fetchAllData();
        return () => unsub && unsub();
    }, [fetchAllData]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (!user) {
        return <div className="text-center py-10">User not found.</div>;
    }

    const winRate = user.gamesPlayed > 0 ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(0) : 0;

    return (
        <div className="space-y-4">
            <Button onClick={() => router.back()} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Users</Button>
            
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start gap-4">
                    <div className="w-20 h-20 rounded-full border-4 border-primary bg-muted flex items-center justify-center">
                        <CircleUserRound className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                        <CardTitle className="text-2xl text-primary">{user.name}</CardTitle>
                        <div className="space-y-1 mt-1 text-xs text-muted-foreground">
                            <p className="flex items-center gap-2"><Mail className="h-3 w-3" /> <span>{user.email}</span></p>
                            <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> <span>{user.phoneNumber}</span></p>
                            <p className="flex items-center gap-2"><Calendar className="h-3 w-3" /> <span>Joined on {new Date((user.createdAt as any).seconds * 1000).toLocaleDateString()}</span></p>
                            <p className="flex items-center gap-2 pt-1"><UserCheck className="h-4 w-4" /> <Badge variant={user.kycStatus === 'Verified' ? 'default' : 'secondary'}>{user.kycStatus}</Badge></p>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <StatCard 
                    icon={Wallet} 
                    label={`Dep: ₹${user.depositBalance.toFixed(0)} | Win: ₹${user.winningsBalance.toFixed(0)}`} 
                    value={`₹${(user.depositBalance + user.winningsBalance).toFixed(0)}`} 
                    color="border-blue-500 text-blue-500"
                >
                   <EditBalanceModal user={user} onUpdate={fetchAllData} />
                </StatCard>
                <StatCard icon={Gamepad2} label="Games Played" value={user.gamesPlayed} color="border-orange-500 text-orange-500" />
                <StatCard icon={Trophy} label="Games Won" value={user.gamesWon} color="border-green-500 text-green-500" />
                <StatCard icon={Percent} label="Win Rate" value={`${winRate}%`} color="border-purple-500 text-purple-500" />
            </div>

            <Tabs defaultValue="transactions">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                    <TabsTrigger value="battles">Battle History</TabsTrigger>
                </TabsList>
                <TabsContent value="transactions">
                    <Card>
                        <CardHeader><CardTitle className="text-primary">Transactions</CardTitle></CardHeader>
                        <CardContent className="overflow-x-auto">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell className="capitalize"><Badge variant={t.type === 'deposit' ? 'default' : 'destructive'} className={t.type === 'deposit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{t.type}</Badge></TableCell>
                                            <TableCell>₹{t.amount.toFixed(2)}</TableCell>
                                            <TableCell><Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>{t.status}</Badge></TableCell>
                                            <TableCell>{new Date((t.createdAt as any).seconds * 1000).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="battles">
                     <Card>
                        <CardHeader><CardTitle className="text-primary">Battles</CardTitle></CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Opponent</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Result</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {battles.map(b => {
                                        const isCreator = b.creator.id === userId;
                                        const opponent = isCreator ? b.opponent : b.creator;
                                        const isWin = b.winnerId === userId;
                                        return (
                                            <TableRow key={b.id}>
                                                <TableCell>{opponent?.name || 'N/A'}</TableCell>
                                                <TableCell>₹{b.amount}</TableCell>
                                                <TableCell><Badge variant={b.status === 'completed' ? 'default' : 'secondary'}>{b.status}</Badge></TableCell>
                                                <TableCell>
                                                    {b.status === 'completed' ? (
                                                        isWin ? <Badge className="bg-green-500">Won</Badge> : <Badge variant="destructive">Lost</Badge>
                                                    ) : 'N/A'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
