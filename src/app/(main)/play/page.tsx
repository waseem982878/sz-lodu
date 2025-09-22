
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trophy, Swords, Hourglass, PlusCircle, BrainCircuit, Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import type { Battle, GameType } from "@/models/battle.model";
import { Badge } from "@/components/ui/badge";

function MyBattleCard({ battle }: { battle: Battle }) {
    const router = useRouter();
    const user = { uid: "mock-user-id" };

    const isCreator = battle.creator.id === user.uid;
    const isPractice = battle.amount === 0;

    const handleView = () => {
        if(battle.status === 'open' && isCreator) {
            router.push(`/create/${battle.id}`);
        } else {
            router.push(`/game/${battle.id}`);
        }
    };
    
    const opponent = isCreator ? battle.opponent : battle.creator;
    const displayOpponent = opponent || { name: 'Waiting...', avatarUrl: "https://picsum.photos/32/32" };

    return (
        <Card className="p-2 bg-card border-l-4 border-primary shadow-md transition-all hover:shadow-lg">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                <Image 
                    src={displayOpponent.avatarUrl} 
                    alt={displayOpponent.name} 
                    width={32} 
                    height={32} 
                    className="rounded-full border" 
                />
                <div>
                    <p className="font-bold text-sm">vs {displayOpponent.name}</p>
                    <p className="text-xs text-muted-foreground">{battle.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
                </div>
                <div className="text-right">
                    {isPractice ? (
                         <Badge variant="secondary" className="text-blue-600">Practice</Badge>
                    ) : (
                        <p className="font-bold text-md text-primary">₹{battle.amount}</p>
                    )}
                    <Button size="sm" className="mt-1 bg-primary hover:bg-primary/80 text-primary-foreground rounded-full shadow h-7 px-3 text-xs" onClick={handleView}>
                        {battle.status === 'open' ? 'Waiting' : 'View'}
                        <Swords className="ml-1 h-3 w-3" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}


function OpenBattleCard({ battle, onPlay }: { battle: Battle, onPlay: (battleId: string) => void }) {
  const isPractice = battle.amount === 0;
  return (
    <Card className="p-2 bg-card border-l-4 border-green-500 shadow-md transition-all hover:shadow-lg hover:border-green-600">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image src={battle.creator.avatarUrl} alt={battle.creator.name} width={32} height={32} className="rounded-full border" />
          <div>
            <p className="text-xs text-muted-foreground">Challenger</p>
            <p className="font-bold text-sm">{battle.creator.name}</p>
          </div>
        </div>
        <div className="text-right">
             {isPractice ? (
                <Badge variant="secondary" className="text-blue-600">Practice</Badge>
            ) : (
                <p className="font-bold text-md text-green-500">₹{battle.amount}</p>
            )}
            <Button size="sm" className="mt-1 bg-green-500 hover:bg-green-600 text-white rounded-full shadow h-7 px-3 text-xs" onClick={() => onPlay(battle.id)}>
                Accept
                <Swords className="ml-1 h-3 w-3" />
            </Button>
        </div>
      </div>
    </Card>
  );
}

function SectionDivider({ title, icon }: { title: string, icon: React.ElementType }) {
    const Icon = icon;
    return (
      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-muted-foreground/20"></div>
        <span className="flex-shrink mx-4 text-muted-foreground flex items-center gap-2 text-sm">
            <Icon className="h-4 w-4" />
            {title}
        </span>
        <div className="flex-grow border-t border-muted-foreground/20"></div>
      </div>
    );
}

function PlayPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameParam = searchParams.get('game');
  const gameType: GameType = gameParam === 'popular' ? 'popular' : 'classic';

  const user = { uid: "mock-user-id" };
  const userProfile = { 
      name: "Guest Player", 
      avatarUrl: "https://picsum.photos/seed/guest/40/40",
      depositBalance: 1000,
      winningsBalance: 500,
  };

  const [amount, setAmount] = useState("");
  const [myBattles, setMyBattles] = useState<Battle[]>([]);
  const [otherOpenBattles, setOtherOpenBattles] = useState<Battle[]>([]);
  const [loadingMyBattles, setLoadingMyBattles] = useState(true);
  const [loadingOpenBattles, setLoadingOpenBattles] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;

    setLoadingMyBattles(true);
    setLoadingOpenBattles(true);

    // Mock fetching battles
    setTimeout(() => {
        const mockBattles: Battle[] = [
            { id: 'b1', amount: 50, gameType, status: 'open', creator: { id: 'other1', name: 'Rohan', avatarUrl: 'https://picsum.photos/seed/r/40/40'}, createdAt: new Date(), updatedAt: new Date() },
            { id: 'b2', amount: 100, gameType, status: 'open', creator: { id: 'other2', name: 'Priya', avatarUrl: 'https://picsum.photos/seed/p/40/40'}, createdAt: new Date(), updatedAt: new Date() },
            { id: 'b3', amount: 0, gameType, status: 'open', creator: { id: 'other3', name: 'Practice Bot', avatarUrl: 'https://picsum.photos/seed/bot/40/40'}, createdAt: new Date(), updatedAt: new Date() },
            { id: 'my-b1', amount: 150, gameType, status: 'open', creator: { id: user.uid, name: userProfile.name, avatarUrl: userProfile.avatarUrl }, createdAt: new Date(), updatedAt: new Date() },
            { id: 'my-b2', amount: 200, gameType, status: 'inprogress', creator: { id: user.uid, name: userProfile.name, avatarUrl: userProfile.avatarUrl }, opponent: { id: 'other4', name: 'Amit', avatarUrl: 'https://picsum.photos/seed/a/40/40' }, createdAt: new Date(), updatedAt: new Date() },
        ];
        
        setMyBattles(mockBattles.filter(b => b.creator.id === user.uid || b.opponent?.id === user.uid));
        setOtherOpenBattles(mockBattles.filter(b => b.status === 'open' && b.creator.id !== user.uid));
        
        setLoadingMyBattles(false);
        setLoadingOpenBattles(false);
    }, 500);
  }, [user, gameType]);
  
  const handleCreateBattle = async (isPractice = false) => {
    if (!user || !userProfile || isCreating) return;

    const newAmount = isPractice ? 0 : parseInt(amount);
     if (isNaN(newAmount)) {
        alert("Please enter a valid amount.");
        return;
    }
    if (!isPractice && newAmount < 50) {
        alert("Minimum battle amount is ₹50.");
        return;
    }
    if (!isPractice && newAmount % 50 !== 0) {
        alert("Battle amount must be in multiples of 50 (e.g., 50, 100, 150).");
        return;
    }
    
    const totalBalance = userProfile.depositBalance + userProfile.winningsBalance;
    if (!isPractice && totalBalance < newAmount) {
        alert("Insufficient balance. Please add money to your wallet.");
        router.push('/wallet');
        return;
    }

    setIsCreating(true);
    // Mock battle creation
    setTimeout(() => {
        const mockBattleId = `mock-${Date.now()}`;
        alert(`Battle created (mock). ID: ${mockBattleId}`);
        router.push(`/create/${mockBattleId}`);
        setIsCreating(false);
    }, 500);
  };

  const handleAcceptBattle = async (battleId: string) => {
    if (!user || !userProfile) return;

    const battleToAccept = otherOpenBattles.find(b => b.id === battleId);
    if (!battleToAccept) return;
    
    const totalBalance = userProfile.depositBalance + userProfile.winningsBalance;
    if (battleToAccept.amount > 0 && totalBalance < battleToAccept.amount) {
        alert("Insufficient balance to accept this battle.");
        router.push('/wallet');
        return;
    }

    alert(`Accepted battle ${battleId} (mock).`);
    router.push(`/game/${battleId}`);
  };


  if (!userProfile) {
      return (
          <div className="flex justify-center items-center h-full py-10">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
      )
  }
  
  const pageTitle = gameType === 'classic' ? 'Ludo Classic' : 'Popular Ludo';

  return (
    <div className="space-y-2">
      <div className="flex justify-start items-center mb-4">
        <Button onClick={() => router.back()} variant="ghost" className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Games
        </Button>
      </div>

       <Card className="p-4">
        <p className="text-center font-semibold mb-2 text-muted-foreground">Create Challenge for <span className="text-primary">{pageTitle}</span></p>
        <div className="flex gap-2">
          <Input 
              type="number" 
              placeholder="Enter Amount (min ₹50)" 
              className="bg-background border-2 focus:ring-primary focus:border-primary text-lg" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isCreating}
          />
          <Button 
              className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold text-lg"
              onClick={() => handleCreateBattle(false)}
              disabled={!amount || isCreating}
          >
              {isCreating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5"/>}
              Create
          </Button>
        </div>
         <Button 
            variant="outline"
            className="w-full mt-2 border-blue-500 text-blue-500 hover:bg-blue-500/10 hover:text-blue-600"
            onClick={() => handleCreateBattle(true)}
            disabled={isCreating}
          >
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4"/>}
              Create a Practice Match (Free)
          </Button>
      </Card>
      
      {myBattles.length > 0 && (
          <>
            <SectionDivider title="My Battles" icon={Hourglass} />
            <div className="space-y-3">
                {loadingMyBattles ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                myBattles.map((battle) => (
                    <MyBattleCard key={battle.id} battle={battle} />
                ))}
            </div>
          </>
      )}

      <SectionDivider title="Open Battles" icon={Trophy} />
      
      <div className="space-y-3">
        {loadingOpenBattles ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin"/></div> : otherOpenBattles.length > 0 ? (
            otherOpenBattles.map((battle) => (
                <OpenBattleCard key={battle.id} battle={battle} onPlay={handleAcceptBattle} />
            ))
        ) : (
            <p className="text-center text-muted-foreground py-8">No open battles right now. Create one!</p>
        )}
      </div>

    </div>
  );
}

export default function Play() {
  return (
      <Suspense fallback={<div className="flex justify-center items-center h-full py-10"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
        <PlayPageContent />
      </Suspense>
  )
}

    