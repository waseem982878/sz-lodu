"use client";

import { useEffect, useState, useMemo } from "react";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, useParams } from "next/navigation";
import type { Battle } from "@/models/battle.model";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Loader2, User, Swords, Shield, Copy, Check, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import TicTacToeGame from "@/components/games/tic-tac-toe";
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const GameRenderer = ({ gameId, gameType, battle }: { gameId: string, gameType: Battle['gameType'], battle: Battle }) => {
    switch (gameType) {
        case 'tic_tac_toe':
            return <TicTacToeGame gameId={gameId} battle={battle} />;
        // Add other game components here
        default:
            return (
                <div className="text-center p-8 bg-muted rounded-lg">
                     <Info className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 font-semibold">Coming Soon!</p>
                    <p className="text-sm text-muted-foreground">This game is not yet implemented. Check back later!</p>
                </div>
            );
    }
};


export default function GamePage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;

  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width, height } = useWindowSize();

  useEffect(() => {
    if (!gameId) return;

    const battleRef = doc(db, "battles", gameId);

    const unsubscribe = onSnapshot(battleRef, (docSnap) => {
      if (docSnap.exists()) {
        const battleData = { id: docSnap.id, ...docSnap.data() } as Battle;
        setBattle(battleData);

        if (battleData.status === 'completed') {
            // Maybe show a toast that the game has ended
        }

      } else {
        setError("Battle not found. It might have been cancelled or never existed.");
        toast.error("Battle not found!");
        router.push('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [gameId, router]);

  const handleRematch = async () => {
    if (!battle || !user) return;

    // Logic for rematch
    toast.info('Rematch functionality to be implemented.');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center">
            <Card className="p-8">
                <CardHeader>
                    <CardTitle className="text-2xl text-destructive">Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{error}</p>
                    <Button onClick={() => router.push('/')} className="mt-4">Go Home</Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!battle) return null;

  const isPlayer = user && (battle.creator.id === user.uid || battle.opponent?.id === user.uid);
  const winner = battle.winner;
  const isWinner = typeof winner === 'object' && winner !== null && 'id' in winner && winner.id === user?.uid;

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
        {isWinner && <Confetti width={width} height={height} recycle={false} />}
        
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Avatar className="w-10 h-10 border-2">
                            <AvatarImage src={battle.creator.avatarUrl} />
                            <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold">{battle.creator.name}</p>
                            <p className="text-xs text-muted-foreground">Creator</p>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">vs</p>
                        <p className="text-sm text-primary">₹{battle.amount}</p>
                    </div>
                     <div className="flex items-center gap-2">
                         <div>
                            <p className="font-bold text-right">{battle.opponent?.name || '??'}</p>
                            <p className="text-xs text-muted-foreground text-right">Opponent</p>
                        </div>
                        <Avatar className="w-10 h-10 border-2">
                            <AvatarImage src={battle.opponent?.avatarUrl} />
                            <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {battle.status === 'active' || battle.status === 'inprogress' ? (
                     <GameRenderer gameId={gameId} gameType={battle.gameType} battle={battle} />
                ) : battle.status === 'completed' ? (
                     <div className="text-center p-8">
                        <h2 className="text-2xl font-bold mb-4">
                            {isWinner ? `🎉 You Won ₹${(battle.amount * 1.9).toFixed(2)}! 🎉` : "😔 You Lost 😔"}
                        </h2>
                        <p className="text-muted-foreground">The game has ended.</p>
                        <div className="mt-6 flex justify-center gap-4">
                            <Button onClick={() => router.push('/')}>Go Home</Button>
                            {/* <Button variant="outline" onClick={handleRematch}>Request Rematch</Button> */}
                        </div>
                    </div>
                ) : (
                     <div className="text-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="mt-4 font-semibold">Waiting for game to start...</p>
                        <p className="text-sm text-muted-foreground">Current status: {battle.status}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
