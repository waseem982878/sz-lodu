
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Download, History, IndianRupee, Swords, TrendingUp, TrendingDown, CircleDotDashed, ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Battle } from "@/models/battle.model";
import type { Transaction } from "@/models/transaction.model";
import imagePaths from '@/lib/image-paths.json';


function BalanceCard({ title, balance, buttonText, buttonAction, icon: Icon, variant }: {
  title: string;
  balance: number;
  buttonText: string;
  buttonAction: () => void;
  icon: React.ElementType;
  variant: 'primary' | 'secondary';
}) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm font-medium text-muted-foreground`}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${variant === 'primary' ? 'text-primary' : 'text-green-600'}`}>₹{balance.toFixed(2)}</p>
        <Button onClick={buttonAction} size="sm" className={`w-full mt-4 ${variant === 'primary' ? 'bg-primary hover:bg-primary/90' : 'bg-green-600 hover:bg-green-700'}`}>
          <Icon className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  )
}

function GameHistoryCard({ game }: { game: Battle }) {
    const user = { uid: "mock-user-id" };

    const isCreator = game.creator.id === user.uid;
    const opponent = isCreator ? game.opponent : game.creator;
    const isWin = game.winnerId === user.uid;

    const getDisplayStatus = (): { text: string; variant: "default" | "destructive" | "secondary" | "outline", color: string, icon: React.ElementType } => {
        switch (game.status) {
            case 'completed':
                return isWin 
                    ? { text: 'Won', variant: 'default', color: 'text-green-500', icon: TrendingUp } 
                    : { text: 'Lost', variant: 'destructive', color: 'text-red-500', icon: TrendingDown };
            case 'cancelled':
                return { text: 'Cancelled', variant: 'secondary', color: 'text-gray-500', icon: CircleDotDashed };
            default:
                 const statusText = game.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                return { text: statusText, variant: 'outline', color: 'text-yellow-500', icon: History };
        }
    }

    const displayStatus = getDisplayStatus();
    const prizeMoney = (game.amount * 2 * 0.95); // 5% commission

    return (
        <Card className="p-4 transition-all hover:shadow-md">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Image 
                        src={opponent?.avatarUrl || "https://picsum.photos/40/40"} 
                        alt={opponent?.name || "Opponent"} 
                        width={40} height={40} 
                        className="rounded-full border" 
                    />
                    <div>
                        <p className="font-bold text-sm">vs {opponent?.name || 'Waiting...'}</p>
                        <p className="text-xs text-muted-foreground">
                            {game.createdAt?.toDate ? game.createdAt.toDate().toLocaleString() : 'Just now'}
                        </p>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                     <p className={`font-bold text-lg ${displayStatus.color}`}>
                       {game.status === 'completed' 
                           ? (isWin ? `+₹${prizeMoney.toFixed(0)}` : `-₹${game.amount}`)
                           : `₹${game.amount}`
                       }
                    </p>
                    <Badge variant={displayStatus.variant} className="flex items-center gap-1">
                        <displayStatus.icon className="h-3 w-3"/>
                        {displayStatus.text}
                    </Badge>
                </div>
            </div>
        </Card>
    )
}

function TransactionHistoryCard({ transaction }: { transaction: Transaction }) {
    const isDeposit = transaction.type === 'deposit';
    
    const statusVariant = {
        'pending': 'outline',
        'completed': 'default',
        'rejected': 'destructive'
    } as const;

    const Icon = isDeposit ? ArrowDownCircle : ArrowUpCircle;

    return (
        <Card className="p-4 transition-all hover:shadow-md">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                     <div className={`flex items-center justify-center h-10 w-10 rounded-full ${isDeposit ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                        <Icon className={`h-6 w-6 ${isDeposit ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                        <p className="font-bold capitalize">{transaction.type}</p>
                         <p className="text-sm text-muted-foreground">
                            {transaction.createdAt?.toDate ? transaction.createdAt.toDate().toLocaleString() : 'Just now'}
                        </p>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                     <p className={`font-bold text-lg ${isDeposit ? 'text-green-500' : 'text-red-500'}`}>
                       {isDeposit ? `+₹${transaction.amount}` : `-₹${transaction.amount}`}
                    </p>
                    <Badge variant={statusVariant[transaction.status]}>{transaction.status}</Badge>
                </div>
            </div>
        </Card>
    )
}


export default function WalletPage() {
  const router = useRouter();
  
  const userProfile = { 
      depositBalance: 1000, 
      winningsBalance: 500,
      kycStatus: 'Not Verified'
  };
  const authLoading = false;
  
  const [games, setGames] = useState<Battle[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data fetching
    setTimeout(() => {
        const mockGames: Battle[] = [
             { id: '1', amount: 100, creator: { id: 'other', name: 'Rohan', avatarUrl: 'https://picsum.photos/seed/r/40/40'}, opponent: { id: 'mock-user-id', name: 'You', avatarUrl: '...'}, status: 'completed', winnerId: 'mock-user-id', gameType: 'classic', createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } },
             { id: '2', amount: 50, creator: { id: 'mock-user-id', name: 'You', avatarUrl: '...'}, opponent: { id: 'other2', name: 'Priya', avatarUrl: 'https://picsum.photos/seed/p/40/40'}, status: 'completed', winnerId: 'other2', gameType: 'classic', createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } },
             { id: '3', amount: 200, creator: { id: 'mock-user-id', name: 'You', avatarUrl: '...'}, opponent: { id: 'other3', name: 'Amit', avatarUrl: 'https://picsum.photos/seed/a/40/40'}, status: 'cancelled', gameType: 'classic', createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } }
        ];
        const mockTransactions: Transaction[] = [
            { id: 't1', userId: 'mock-user-id', type: 'deposit', amount: 500, status: 'completed', createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } },
            { id: 't2', userId: 'mock-user-id', type: 'withdrawal', amount: 100, status: 'completed', createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } },
            { id: 't3', userId: 'mock-user-id', type: 'deposit', amount: 200, status: 'pending', createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } },
        ];
        setGames(mockGames);
        setTransactions(mockTransactions);
        setLoading(false);
    }, 500);
  }, []);


  if (authLoading || !userProfile) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  const handleAdd = () => {
    router.push('/wallet/deposit');
  };

  const handleWithdraw = () => {
    if (userProfile.kycStatus !== 'Verified') {
      alert("Please complete your KYC verification before withdrawing.");
      router.push('/profile/kyc');
      return;
    }
    router.push('/wallet/withdraw');
  };
  
  const totalBalance = userProfile.depositBalance + userProfile.winningsBalance;

  return (
    <div className="space-y-6">
       <Card className="bg-primary text-primary-foreground overflow-hidden p-4 h-[88px] flex items-center">
         <div className="flex items-center justify-between w-full">
            <div className="text-left">
                <CardTitle className="text-lg text-primary-foreground">Total Balance</CardTitle>
                <CardDescription className="text-primary-foreground/80 text-4xl sm:text-5xl font-bold pt-1">
                    ₹{totalBalance.toFixed(2)}
                </CardDescription>
            </div>
            <div className="relative h-24 w-24 flex-shrink-0 -mr-4">
                <Image
                    src={imagePaths.walletIcon.path}
                    alt={imagePaths.walletIcon.alt}
                    width={104}
                    height={104}
                    className="object-contain"
                />
            </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-2 gap-4">
        <BalanceCard
            title="Deposit Balance"
            balance={userProfile.depositBalance}
            buttonText="Add Money"
            buttonAction={handleAdd}
            icon={PlusCircle}
            variant="primary"
        />
        <BalanceCard
            title="Winnings Balance"
            balance={userProfile.winningsBalance}
            buttonText="Withdraw"
            buttonAction={handleWithdraw}
            icon={Download}
            variant="secondary"
        />
      </div>

       <Tabs defaultValue="games">
          <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="games">Game History</TabsTrigger>
              <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          </TabsList>
          <TabsContent value="games">
              <Card>
                  <CardHeader>
                      <CardTitle className="text-primary flex items-center gap-2"><Swords className="h-5 w-5"/>Game History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {loading ? (
                          <div className="flex justify-center items-center py-10">
                              <Loader2 className="h-10 w-10 animate-spin text-primary" />
                          </div>
                      ) : games.length > 0 ? (
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
                      <CardTitle className="text-primary flex items-center gap-2"><IndianRupee className="h-5 w-5"/>Transaction History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     {loading ? (
                          <div className="flex justify-center items-center py-10">
                              <Loader2 className="h-10 w-10 animate-spin text-primary" />
                          </div>
                     ) : transactions.length > 0 ? (
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
