
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trophy, Swords, Hourglass, PlusCircle, BrainCircuit, Loader2, ArrowLeft, Users, CircleUserRound } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, Suspense, useMemo } from "react";
import type { Battle, GameType } from "@/models/battle.model";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { createBattle, acceptBattle } from "@/services/battle-service";
import { collection, query, where, onSnapshot, Timestamp, or } from "firebase/firestore";
import { db } from "@/firebase/config";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";


function InfoDialog({ open, onClose, title, message }: { open: boolean, onClose: () => void, title: string, message: string }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-primary">{title}</DialogTitle>
          <DialogDescription className="pt-4">
            {message}
          </DialogDescription>
        </DialogHeader>
         <DialogFooter>
          <DialogClose asChild>
            <Button onClick={onClose}>OK</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


const initialMockBattles: Battle[] = [
    { id: 'mock1', amount: 5000, gameType: 'classic', status: 'inprogress', creator: { id: 'c1', name: 'Thunder Bolt', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Thunder' }, opponent: { id: 'o1', name: 'Captain Ludo', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Captain' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock2', amount: 10000, gameType: 'classic', status: 'inprogress', creator: { id: 'c2', name: 'King Slayer', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=King' }, opponent: { id: 'o2', name: 'Ludo Legend', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Legend' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock3', amount: 2500, gameType: 'classic', status: 'inprogress', creator: { id: 'c3', name: 'Dice Master', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Dice' }, opponent: { id: 'o3', name: 'Rani', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Rani' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock4', amount: 1000, gameType: 'popular', status: 'inprogress', creator: { id: 'c4', name: 'Raja Babu', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Raja' }, opponent: { id: 'o4', name: 'Smart Player', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Smart' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock5', amount: 50, gameType: 'classic', status: 'inprogress', creator: { id: 'c5', name: 'Ankit', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Ankit' }, opponent: { id: 'o5', name: 'Priya', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Priya' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock6', amount: 7500, gameType: 'classic', status: 'inprogress', creator: { id: 'c6', name: 'High Roller', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=High' }, opponent: { id: 'o6', name: 'Big Shot', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Big' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock7', amount: 300, gameType: 'popular', status: 'inprogress', creator: { id: 'c7', name: 'Vikram', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Vikram' }, opponent: { id: 'o7', name: 'Simran', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Simran' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock8', amount: 1500, gameType: 'classic', status: 'inprogress', creator: { id: 'c8', name: 'The Pro', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Pro' }, opponent: { id: 'o8', name: 'Challenger', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Challenger' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock9', amount: 200, gameType: 'classic', status: 'inprogress', creator: { id: 'c9', name: 'Player 1', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Player1' }, opponent: { id: 'o9', name: 'Player 2', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Player2' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock10', amount: 6000, gameType: 'popular', status: 'inprogress', creator: { id: 'c10', name: 'Winner', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Winner' }, opponent: { id: 'o10', name: 'Loser', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Loser' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock11', amount: 100, gameType: 'classic', status: 'inprogress', creator: { id: 'c11', name: 'John', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=John' }, opponent: { id: 'o11', name: 'Doe', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Doe' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock12', amount: 8000, gameType: 'classic', status: 'inprogress', creator: { id: 'c12', name: 'Expert', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Expert' }, opponent: { id: 'o12', name: 'Newbie', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Newbie' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock13', amount: 4000, gameType: 'popular', status: 'inprogress', creator: { id: 'c13', name: 'Alpha', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Alpha' }, opponent: { id: 'o13', name: 'Beta', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Beta' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock14', amount: 800, gameType: 'classic', status: 'inprogress', creator: { id: 'c14', name: 'Sultan', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Sultan' }, opponent: { id: 'o14', name: 'Badshah', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Badshah' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock15', amount: 9500, gameType: 'classic', status: 'inprogress', creator: { id: 'c15', name: 'Titan', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Titan' }, opponent: { id: 'o15', name: 'Hulk', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Hulk' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock16', amount: 750, gameType: 'popular', status: 'inprogress', creator: { id: 'c16', name: 'Aarav', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Aarav' }, opponent: { id: 'o16', name: 'Vihaan', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Vihaan' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock17', amount: 1200, gameType: 'classic', status: 'inprogress', creator: { id: 'c17', name: 'Isha', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Isha' }, opponent: { id: 'o17', name: 'Aanya', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Aanya' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock18', amount: 3500, gameType: 'classic', status: 'inprogress', creator: { id: 'c18', name: 'Boss', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Boss' }, opponent: { id: 'o18', name: 'Chief', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Chief' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock19', amount: 250, gameType: 'popular', status: 'inprogress', creator: { id: 'c19', name: 'Test 1', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Test1' }, opponent: { id: 'o19', name: 'Test 2', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Test2' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock20', amount: 9000, gameType: 'classic', status: 'inprogress', creator: { id: 'c20', name: 'Last King', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=LastKing' }, opponent: { id: 'o20', name: 'Final Boss', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Final' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
];

const initialMockOpenBattles: Battle[] = [
    { id: 'mock-open-1', amount: 100, gameType: 'classic', status: 'open', creator: { id: 'c21', name: 'New Challenger', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=NewChallenger' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock-open-2', amount: 500, gameType: 'classic', status: 'open', creator: { id: 'c22', name: 'Ludo Pro', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=LudoPro' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock-open-3', amount: 2000, gameType: 'popular', status: 'open', creator: { id: 'c23', name: 'Big Player', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=BigPlayer' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock-open-4', amount: 50, gameType: 'classic', status: 'open', creator: { id: 'c24', name: 'Friendly Match', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Friendly' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock-open-5', amount: 300, gameType: 'popular', status: 'open', creator: { id: 'c25', name: 'Quick Game', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Quick' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock-open-6', amount: 7500, gameType: 'classic', status: 'open', creator: { id: 'c26', name: 'High Stakes', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=HighStakes' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock-open-7', amount: 150, gameType: 'classic', status: 'open', creator: { id: 'c27', name: 'Evening Game', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Evening' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock-open-8', amount: 4000, gameType: 'popular', status: 'open', creator: { id: 'c28', name: 'Pro Gamer', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=ProGamer' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock-open-9', amount: 600, gameType: 'classic', status: 'open', creator: { id: 'c29', name: 'Challenge Me', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=ChallengeMe' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock-open-10', amount: 10000, gameType: 'classic', status: 'open', creator: { id: 'c30', name: 'The King', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=TheKing' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock-open-11', amount: 250, gameType: 'popular', status: 'open', creator: { id: 'c31', name: 'Let\'s Play', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=LetsPlay' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'mock-open-12', amount: 1200, gameType: 'classic', status: 'open', creator: { id: 'c32', name: 'Master Player', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Master' }, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
];


function MyBattleCard({ battle }: { battle: Battle }) {
    const router = useRouter();
    const { user } = useAuth();
    if (!user) return null;

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
    const displayOpponentName = opponent ? opponent.name : 'Waiting...';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
        >
            <Card className="p-2 bg-card border-l-4 border-primary shadow-md transition-all hover:shadow-lg">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 ring-2 ring-primary bg-primary/10 flex items-center justify-center">
                        <CircleUserRound className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">vs {displayOpponentName}</p>
                        <p className="text-xs text-muted-foreground">{battle.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
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
        </motion.div>
    );
}


function OpenBattleCard({ battle, onPlay }: { battle: Battle, onPlay: (battleId: string) => void }) {
  const isPractice = battle.amount === 0;
  return (
    <motion.div
        layout
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
    >
        <Card className="p-2 bg-card border-l-4 border-green-500 shadow-md transition-all hover:shadow-lg hover:border-green-600">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 ring-2 ring-green-500 bg-green-500/10 flex items-center justify-center">
                    <CircleUserRound className="w-5 h-5 text-green-500" />
                </div>
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
    </motion.div>
  );
}

function OngoingBattleCard({ battle }: { battle: Battle }) {
    const router = useRouter();
    if (!battle.opponent) return null;
    
    const handleViewBattle = () => {
        if (battle.id.startsWith('mock')) {
             return;
        }
        router.push(`/game/${battle.id}`);
    }

    return (
        <Card className="p-2 bg-card border-l-4 border-blue-500 shadow-md cursor-pointer" onClick={handleViewBattle}>
            <div className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                LIVE
            </div>
            <div className="flex justify-between items-center text-center">
                <div className="flex flex-col items-center gap-1 w-1/3">
                    <div className="w-8 h-8 rounded-full border-2 ring-2 ring-blue-500 bg-blue-500/10 flex items-center justify-center">
                        <CircleUserRound className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="font-semibold text-xs truncate w-full">{battle.creator.name}</span>
                </div>
                
                <div className="text-center px-1">
                    <p className="text-xs text-muted-foreground">Prize</p>
                    <p className="font-bold text-lg text-green-500">₹{battle.amount}</p>
                    <p className="text-orange-400 font-bold text-md -my-0.5 animate-clash">VS</p>
                </div>

                 <div className="flex flex-col items-center gap-1 w-1/3">
                    <div className="w-8 h-8 rounded-full border-2 ring-2 ring-red-500 bg-red-500/10 flex items-center justify-center">
                        <CircleUserRound className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="font-semibold text-xs truncate w-full">{battle.opponent.name}</span>
                </div>
            </div>
        </Card>
    )
}

function SectionDivider({ title }: { title: string }) {
    return (
      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-muted-foreground/20"></div>
        <span className="flex-shrink mx-4 text-lg font-bold bg-gradient-to-r from-primary via-card-foreground to-primary bg-clip-text text-transparent animate-animate-shine bg-[length:200%_auto]">
            {title}
        </span>
        <div className="flex-grow border-t border-muted-foreground/20"></div>
      </div>
    );
}

function PlayPageContent() {
  const router = useRouter();

  const { user, userProfile, loading: authLoading } = useAuth();

  const [amount, setAmount] = useState("");
  const [allActiveBattles, setAllActiveBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [mockBattles, setMockBattles] = useState<Battle[]>(() => [...initialMockBattles].sort(() => Math.random() - 0.5));
  const [mockOpenBattles, setMockOpenBattles] = useState<Battle[]>(() => [...initialMockOpenBattles].sort(() => Math.random() - 0.5));
  const [dialogState, setDialogState] = useState({ open: false, title: '', message: '' });

  const showDialog = (title: string, message: string) => {
    setDialogState({ open: true, title, message });
  };


  useEffect(() => {
    if (!user) return;
    setLoading(true);
    
    const battlesQuery = query(
        collection(db, "battles"), 
        where('status', 'in', ['open', 'inprogress', 'waiting_for_players_ready', 'result_pending'])
    );

    const unsubscribe = onSnapshot(battlesQuery, (snapshot) => {
        const battlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Battle));
        setAllActiveBattles(battlesData);
        setLoading(false);
    }, (err) => {
        console.error("Error fetching battles: ", err);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

   useEffect(() => {
    const interval = setInterval(() => {
      setMockBattles(currentBattles => {
        if (currentBattles.length <= 1) return currentBattles;
        const newBattles = [...currentBattles];
        const shifted = newBattles.shift();
        if(shifted) {
            newBattles.push(shifted);
        }
        return newBattles;
      });
      
      setMockOpenBattles(currentBattles => {
          if (currentBattles.length <= 1) return currentBattles;
          const newBattles = [...currentBattles];
          const shifted = newBattles.pop();
          if (shifted) {
              newBattles.unshift(shifted);
          }
          return newBattles;
      });

    }, 4000);

    return () => clearInterval(interval);
  }, []);


  const { myBattles, openBattles, ongoingBattles } = useMemo(() => {
    if (!user) return { myBattles: [], openBattles: [], ongoingBattles: [] };

    const myBattles = allActiveBattles.filter(b => b.creator.id === user.uid || b.opponent?.id === user.uid);
    const openBattles = allActiveBattles.filter(b => b.status === 'open' && b.creator.id !== user.uid);
    const realOngoingBattles = allActiveBattles.filter(b => b.status === 'inprogress' && b.creator.id !== user.uid && b.opponent?.id !== user.uid);
    
    return { myBattles, openBattles, ongoingBattles: realOngoingBattles };

  }, [allActiveBattles, user]);
  
  const handleCreateBattle = async () => {
    if (!user || !userProfile || isCreating) return;

    const newAmount = parseInt(amount);
     if (isNaN(newAmount)) {
        showDialog("Invalid Amount", "Please enter a valid amount.");
        return;
    }
    
    let gameType: GameType;
    if (newAmount >= 50 && newAmount <= 50000) {
        gameType = 'classic';
    } else if (newAmount > 50000 && newAmount <= 100000) {
        gameType = 'popular';
    } else {
        showDialog("Invalid Amount", "Amount must be between ₹50 and ₹100,000.");
        return;
    }

    if (newAmount % 50 !== 0) {
        showDialog("Invalid Amount", "Battle amount must be in multiples of 50 (e.g., 50, 100, 150).");
        return;
    }
    
    const totalBalance = userProfile.depositBalance + userProfile.winningsBalance;
    if (totalBalance < newAmount) {
        showDialog("Insufficient Balance", "Insufficient balance. Please add money to your wallet.");
        router.push('/wallet');
        return;
    }

    setIsCreating(true);
    try {
        const battleId = await createBattle(newAmount, gameType, user, userProfile);
        router.push(`/create/${battleId}`);
    } catch (e) {
        showDialog("Error", `Failed to create battle: ${(e as Error).message}`);
        setIsCreating(false);
    }
  };

  const handleAcceptBattle = async (battleId: string) => {
    if (!user || !userProfile) return;

    if (battleId.startsWith('mock-open-')) {
        return;
    }
    
    const battleToAccept = openBattles.find(b => b.id === battleId);
    if (!battleToAccept) return;
    
    const totalBalance = userProfile.depositBalance + userProfile.winningsBalance;
    if (battleToAccept.amount > 0 && totalBalance < battleToAccept.amount) {
        showDialog("Insufficient Balance", "Insufficient balance to accept this battle.");
        router.push('/wallet');
        return;
    }

    try {
        await acceptBattle(battleId, user, userProfile);
        router.push(`/game/${battleId}`);
    } catch (e) {
        showDialog("Error", `Failed to accept battle: ${(e as Error).message}`);
    }
  };


  if (authLoading || !userProfile) {
      return (
          <div className="flex justify-center items-center h-full py-10">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
      )
  }
  
  const displayOngoingBattles = ongoingBattles.length > 0 ? ongoingBattles : mockBattles;
  const displayOpenBattles = openBattles.length > 0 ? openBattles : mockOpenBattles;
  
  const cardAnimationVariants = {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
  };

  return (
    <div className="space-y-2">
       <InfoDialog 
            open={dialogState.open} 
            onClose={() => setDialogState({ ...dialogState, open: false })} 
            title={dialogState.title}
            message={dialogState.message} 
        />
      <div className="flex justify-start items-center mb-4">
        <Button onClick={() => router.back()} variant="ghost" className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Games
        </Button>
      </div>

       <Card className="p-4">
        <p className="text-center font-semibold mb-2 text-muted-foreground">Create a New Challenge</p>
        <div className="flex gap-2">
          <Input 
              type="number" 
              placeholder="Enter Amount (₹50 - ₹100,000)" 
              className="bg-background border-2 focus:ring-primary focus:border-primary text-lg" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isCreating}
          />
          <Button 
              className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold text-lg"
              onClick={() => handleCreateBattle()}
              disabled={!amount || isCreating}
          >
              {isCreating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5"/>}
              Create
          </Button>
        </div>
      </Card>
      
      {myBattles.length > 0 && (
          <>
            <SectionDivider title="My Battles" />
            <div className="space-y-3">
                 <AnimatePresence>
                    {myBattles.map((battle) => (
                        <MyBattleCard key={battle.id} battle={battle} />
                    ))}
                 </AnimatePresence>
            </div>
          </>
      )}

      <SectionDivider title="Open Battles" />
      
      <div className="space-y-3">
        {loading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin"/></div> : (
            <AnimatePresence>
                {openBattles.map((battle) => (
                     <OpenBattleCard key={battle.id} battle={battle} onPlay={handleAcceptBattle} />
                ))}
                {openBattles.length === 0 && mockOpenBattles.map((battle) => (
                     <OpenBattleCard key={battle.id} battle={battle} onPlay={handleAcceptBattle} />
                ))}
            </AnimatePresence>
        )}
      </div>

      <SectionDivider title="All Ongoing Battles" />

      <div className="space-y-3">
         {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin"/></div>
         ) : (
            <AnimatePresence>
                 {ongoingBattles.map((battle) => (
                    <motion.div
                        key={battle.id}
                        layout
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={cardAnimationVariants}
                    >
                        <OngoingBattleCard battle={battle} />
                    </motion.div>
                ))}
                {ongoingBattles.length === 0 && mockBattles.map((battle) => (
                    <motion.div
                        key={battle.id}
                        layout
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={cardAnimationVariants}
                    >
                        <OngoingBattleCard battle={battle} />
                    </motion.div>
                ))}
            </AnimatePresence>
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

    