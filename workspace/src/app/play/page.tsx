
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trophy, Swords, Users, PlusCircle, Hourglass, Gamepad2, Loader2, Wallet, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/auth-context";
import { createBattle, getBattles, acceptBattle } from "@/services/battle-service";
import type { Battle, GameType } from "@/models/battle.model";
import { onSnapshot, query, where, collection } from "firebase/firestore";
import { db } from "@/firebase/config";

function MyBattleCard({ battle }: { battle: Battle }) {
    const router = useRouter();
    const { user } = useAuth();
    if (!user) return null;

    const isCreator = battle.creator.id === user.uid;
    // Determine the correct page to navigate to based on battle status and user role
    const handleView = () => {
        if(battle.status === 'open' && isCreator) {
            router.push(`/create/${battle.id}`);
        } else {
            router.push(`/game/${battle.id}`);
        }
    };
    
    // For creators, opponent is null in 'open' state
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
                    data-ai-hint="user avatar" 
                />
                <div>
                    <p className="font-bold text-sm">vs {displayOpponent.name}</p>
                    <p className="text-xs text-muted-foreground">{battle.status.charAt(0).toUpperCase() + battle.status.slice(1)}</p>
                </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-md text-primary">₹{battle.amount}</p>
                    <Button size="sm" className="mt-1 bg-primary hover:bg-primary/80 text-primary-foreground rounded-full shadow h-7 px-3 text-xs" onClick={handleView}>
                        {battle.status === 'open' ? 'Waiting' : 'View'}
                        <Gamepad2 className="ml-1 h-3 w-3" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}


function OpenBattleCard({ battle, onPlay }: { battle: Battle, onPlay: (battleId: string) => void }) {
  return (
    <Card className="p-2 bg-card border-l-4 border-green-500 shadow-md transition-all hover:shadow-lg hover:border-green-600">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image src={battle.creator.avatarUrl} alt={battle.creator.name} width={32} height={32} className="rounded-full border" data-ai-hint="user avatar" />
          <div>
            <p className="text-xs text-muted-foreground">Challenger</p>
            <p className="font-bold text-sm">{battle.creator.name}</p>
          </div>
        </div>
        <div className="text-right">
            <p className="font-bold text-md text-green-500">₹{battle.amount}</p>
            <Button size="sm" className="mt-1 bg-green-500 hover:bg-green-600 text-white rounded-full shadow h-7 px-3 text-xs" onClick={() => onPlay(battle.id)}>
                Accept
                <Swords className="ml-1 h-3 w-3" />
            </Button>
        </div>
      </div>
    </Card>
  );
}

function OngoingBattleCard({ battle }: { battle: Battle }) {
    const router = useRouter();
    if (!battle.opponent) return null; // Should not happen for ongoing battles
    
    const handleViewBattle = () => {
        router.push(`/game/${battle.id}`);
    }

    return (
        <Card className="p-2 bg-gradient-to-tr from-secondary to-card shadow-lg relative overflow-hidden border cursor-pointer" onClick={handleViewBattle}>
            <div className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                LIVE
            </div>
            <div className="flex justify-between items-center text-center">
                <div className="flex flex-col items-center gap-1 w-1/3">
                    <Image src={battle.creator.avatarUrl} alt={battle.creator.name} width={32} height={32} className="rounded-full border-2 border-blue-400" data-ai-hint="user avatar" />
                    <span className="font-semibold text-xs truncate w-full">{battle.creator.name}</span>
                </div>
                
                <div className="text-center px-1">
                    <p className="text-xs text-muted-foreground">Prize</p>
                    <p className="font-bold text-lg text-green-500">₹{battle.amount}</p>
                    <p className="text-orange-400 font-bold text-md -my-0.5">VS</p>
                </div>

                 <div className="flex flex-col items-center gap-1 w-1/3">
                    <Image src={battle.opponent.avatarUrl} alt={battle.opponent.name} width={32} height={32} className="rounded-full border-2 border-red-400" data-ai-hint="user avatar" />
                    <span className="font-semibold text-xs truncate w-full">{battle.opponent.name}</span>
                </div>
            </div>
        </Card>
    )
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

  const { user, userProfile, loading: authLoading } = useAuth();
  const [amount, setAmount] = useState("");
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const battlesQuery = query(
      collection(db, 'battles'),
      where('gameType', '==', gameType),
      where('status', 'in', ['open', 'inprogress', 'waiting_for_players_ready'])
    );

    const unsubscribe = onSnapshot(battlesQuery, (snapshot) => {
      const battlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Battle));
      setBattles(battlesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching live battles:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, gameType]);
  
  const handleSetBattle = async () => {
    if (!user || !userProfile || isCreating) return;

    const newAmount = parseInt(amount);
    if (isNaN(newAmount) || newAmount < 50) {
        alert("Minimum battle amount is ₹50.");
        return;
    }

    if (newAmount % 50 !== 0) {
        alert("Battle amount must be in multiples of 50 (e.g., 50, 100, 150).");
        return;
    }
    
    const totalBalance = userProfile.depositBalance + userProfile.winningsBalance;
    if (totalBalance < newAmount) {
        alert("Insufficient balance. Please add money to your wallet.");
        router.push('/wallet/deposit');
        return;
    }

    setIsCreating(true);
    try {
        const battleId = await createBattle(newAmount, gameType, user, userProfile);
        router.push(`/create/${battleId}`);
    } catch (error) {
        console.error("Error creating battle:", error);
        if (error instanceof Error) {
            alert(`Failed to create battle: ${error.message}`);
        } else {
            alert("Failed to create battle. Please try again.");
        }
        setIsCreating(false);
    }
  };

  const handleAcceptBattle = async (battleId: string) => {
    if (!user || !userProfile) return;

    const battleToAccept = battles.find(b => b.id === battleId);
    if (!battleToAccept) return;
    
    const totalBalance = userProfile.depositBalance + userProfile.winningsBalance;
    if (totalBalance < battleToAccept.amount) {
        alert("Insufficient balance to accept this battle.");
        router.push('/wallet/deposit');
        return;
    }

    try {
        await acceptBattle(battleId, user, userProfile);
        router.push(`/game/${battleId}`);
    } catch (error) {
        console.error("Error accepting battle:", error);
         if (error instanceof Error) {
            alert(`Could not accept battle: ${error.message}`);
        } else {
            alert("Could not accept battle. It might have been taken or cancelled.");
        }
    }
  };

  if (authLoading || !userProfile) {
      return (
          <div className="flex justify-center items-center h-full py-10">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
      )
  }
  
  const myBattles = user ? battles.filter(b => b.creator.id === user.uid || b.opponent?.id === user.uid) : [];
  const openBattles = user ? battles.filter(b => b.status === 'open' && b.creator.id !== user.uid) : [];
  const allOngoingBattles = battles.filter(b => b.status === 'inprogress');
  
  const pageTitle = gameType === 'classic' ? 'Ludo Classic' : 'Popular Ludo';

  return (
    <div className="space-y-2">
       <div className="flex justify-start items-center mb-4">
        <Button onClick={() => router.back()} variant="ghost" className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Games
        </Button>
      </div>

       <Card className="p-4">
        <p className="text-center font-semibold mb-2 text-muted-foreground">Create Challenge for {pageTitle}</p>
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
              onClick={handleSetBattle}
              disabled={!amount || isCreating}
          >
              {isCreating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5"/>}
              Create
          </Button>
        </div>
      </Card>
      
      {myBattles.length > 0 && (
          <>
            <SectionDivider title="My Battles" icon={Hourglass} />
            <div className="space-y-3">
                {myBattles.map((battle) => (
                    <MyBattleCard key={battle.id} battle={battle} />
                ))}
            </div>
          </>
      )}

      <SectionDivider title="Open Battles" icon={Trophy} />
      
      <div className="space-y-3">
        {loading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin"/></div> : openBattles.length > 0 ? (
            openBattles.map((battle) => (
                <OpenBattleCard key={battle.id} battle={battle} onPlay={handleAcceptBattle} />
            ))
        ) : (
            <p className="text-center text-muted-foreground py-8">No open battles right now. Create one!</p>
        )}
      </div>

      <SectionDivider title="All Ongoing Battles" icon={Users} />

      <div className="space-y-3">
         {loading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin"/></div> : allOngoingBattles.length > 0 ? (
            allOngoingBattles.map((battle) => (
                <OngoingBattleCard key={battle.id} battle={battle} />
            ))
         ) : (
            <p className="text-center text-muted-foreground py-8">No ongoing battles at the moment.</p>
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

    