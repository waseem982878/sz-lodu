
"use client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { db } from "@/firebase/config";
import { collection, query, where, onSnapshot, orderBy, or } from "firebase/firestore";
import type { Battle } from "@/models/battle.model";
import type { Transaction } from "@/models/transaction.model";
import { Loader2, IndianRupee } from "lucide-react";

type GameHistory = Battle;

function GameHistoryCard({ game }: { game: GameHistory }) {
    const { user } = useAuth();
    if (!user) return null;

    const isCreator = game.creator.id === user.uid;
    const opponent = isCreator ? game.opponent : game.creator;
    const isWin = game.winnerId === user.uid;

    const getDisplayStatus = (): { text: string; variant: "default" | "destructive" | "secondary" | "outline" } => {
        switch (game.status) {
            case 'completed':
                return isWin ? { text: 'Won', variant: 'default' } : { text: 'Lost', variant: 'destructive' };
            case 'cancelled':
                return { text: 'Cancelled', variant: 'secondary' };
            case 'open':
                return { text: 'Waiting', variant: 'outline' };
            case 'inprogress':
                return { text: 'In Progress', variant: 'outline' };
            case 'result_pending':
                return { text: 'Result Pending', variant: 'outline' };
            default:
                return { text: game.status, variant: 'outline' };
        }
    }

    const displayStatus = getDisplayStatus();

    return (
        <Card className="p-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Image 
                        src={opponent?.avatarUrl || "https://picsum.photos/40/40"} 
                        alt={opponent?.name || "Opponent"} 
                        width={40} height={40} 
                        className="rounded-full" 
                        data-ai-hint="user avatar"
                    />
                    <div>
                        <p className="font-bold">vs {opponent?.name || 'Waiting...'}</p>
                        <p className="text-sm text-muted-foreground">
                            {game.createdAt?.toDate ? game.createdAt.toDate().toLocaleDateString() : 'Just now'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`font-bold text-lg ${displayStatus.text === 'Won' ? 'text-green-500' : displayStatus.text === 'Lost' ? 'text-red-500' : ''}`}>
                       {displayStatus.text === 'Won' ? `+₹${(game.amount * 2 * 0.95).toFixed(0)}` : `₹${game.amount}`}
                    </p>
                    <Badge variant={displayStatus.variant}>{displayStatus.text}</Badge>
                </div>
            </div>
        </Card>
    )
}

function TransactionHistoryCard({ transaction }: { transaction: Transaction }) {
    const isDeposit = transaction.type === 'deposit';
    
    const statusVariant = {
        'completed': 'default',
        'pending': 'outline',
        'rejected': 'destructive'
    } as const;

    return (
        <Card className="p-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                     <div className={`flex items-center justify-center h-10 w-10 rounded-full ${isDeposit ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                        <IndianRupee className={`h-5 w-5 ${isDeposit ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                        <p className="font-bold capitalize">{transaction.type}</p>
                         <p className="text-sm text-muted-foreground">
                            {transaction.createdAt?.toDate ? transaction.createdAt.toDate().toLocaleString() : 'Just now'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                     <p className={`font-bold text-lg ${isDeposit ? 'text-green-500' : 'text-red-500'}`}>
                       {isDeposit ? `+₹${transaction.amount}` : `-₹${transaction.amount}`}
                    </p>
                    <Badge variant={statusVariant[transaction.status]}>{transaction.status}</Badge>
                </div>
            </div>
        </Card>
    )
}

export default function HistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const [games, setGames] = useState<Battle[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            if (!authLoading) setLoading(false);
            return;
        };

        setLoading(true);

        // Fetch Game History
        const gamesQuery = query(
            collection(db, 'battles'),
            or(
                where('creator.id', '==', user.uid),
                where('opponent.id', '==', user.uid)
            ),
            orderBy('createdAt', 'desc')
        );

        const unsubscribeGames = onSnapshot(gamesQuery, snap => {
             const userGames = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Battle));
             setGames(userGames);
             setLoading(false);
        }, error => {
            console.error("Error fetching game history:", error);
            setLoading(false);
        });

        // Fetch Transaction History
        const transactionsQuery = query(
            collection(db, 'transactions'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
            const userTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
            setTransactions(userTransactions);
            setLoading(false);
        }, error => {
            console.error("Error fetching transaction history:", error);
            setLoading(false);
        });

        return () => {
            unsubscribeGames();
            unsubscribeTransactions();
        }
    }, [user, authLoading]);
    
    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-center">History</h1>
            <Tabs defaultValue="games">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="games">Game History</TabsTrigger>
                    <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                </TabsList>
                <TabsContent value="games">
                    <Card>
                        <CardHeader>
                            <CardTitle>Game History</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {games.length > 0 ? (
                                games.map(game => <GameHistoryCard key={game.id} game={game} />)
                            ) : (
                                <p className="text-muted-foreground text-center py-8">No games played yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="transactions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {transactions.length > 0 ? (
                                transactions.map(transaction => <TransactionHistoryCard key={transaction.id} transaction={transaction} />)
                            ) : (
                                <p className="text-muted-foreground text-center py-8">No transactions yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

    
