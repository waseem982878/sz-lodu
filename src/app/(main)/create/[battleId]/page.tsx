"use client";

import { useEffect, useState, useMemo } from "react";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, useParams } from "next/navigation";
import type { Battle } from "@/models/battle.model";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Loader2, User, Swords, Shield, Copy, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const StatusIndicator = ({ status }: { status: Battle['status'] }) => {
  const statusInfo = useMemo(() => {
    switch (status) {
      case "waiting":
        return { text: "Waiting for opponent...", color: "bg-yellow-500" };
      case "active":
        return { text: "Game in progress!", color: "bg-green-500" };
      case "completed":
        return { text: "Game Over", color: "bg-blue-500" };
      case "cancelled":
        return { text: "Game Cancelled", color: "bg-red-500" };
      default:
        return { text: "Starting...", color: "bg-gray-500" };
    }
  }, [status]);

  return (
    <div className="flex items-center justify-center gap-2 p-2 bg-secondary rounded-lg">
      <div className={`w-3 h-3 rounded-full ${statusInfo.color} animate-pulse`}></div>
      <span className="text-sm font-medium">{statusInfo.text}</span>
    </div>
  );
};

const PlayerCard = ({ player, isCreator, isReady }: { 
    player: { id: string; name: string; avatarUrl?: string; } | undefined;
    isCreator: boolean;
    isReady?: boolean;
}) => {
  if (!player) {
    return (
      <Card className="w-full flex flex-col items-center justify-center p-6 border-dashed">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Waiting for opponent...</p>
      </Card>
    );
  }

  return (
    <Card className={`w-full p-4 flex flex-col items-center relative ${isReady ? 'border-green-500' : ''}`}>
        {isReady && <div className="absolute top-2 right-2 text-green-500"><Check /></div>}
      <Avatar className="w-16 h-16 border-2 border-primary">
        <AvatarImage src={player.avatarUrl} />
        <AvatarFallback><User /></AvatarFallback>
      </Avatar>
      <p className="mt-2 font-bold text-lg">{player.name}</p>
      <Badge variant={isCreator ? "default" : "secondary"} className="mt-1">
        {isCreator ? "Creator" : "Opponent"}
      </Badge>
    </Card>
  );
};


export default function BattlePage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const battleId = params.battleId as string;

  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { width, height } = useWindowSize();

  useEffect(() => {
    if (!battleId) return;

    const battleRef = doc(db, "battles", battleId);

    const unsubscribe = onSnapshot(battleRef, async (docSnap) => {
      if (docSnap.exists()) {
        const battleData = { id: docSnap.id, ...docSnap.data() } as Battle;

        // Join game if user is opponent and not already joined
        if (user && userProfile && !battleData.opponent && battleData.creator.id !== user.uid) {
            try {
                await updateDoc(battleRef, { 
                    opponent: { id: user.uid, name: userProfile.displayName || 'New Player', avatarUrl: userProfile.photoURL || '' },
                    status: 'waiting_for_players_ready' 
                });
                toast.success('You have joined the battle!');
            } catch (err) {
                console.error("Error joining battle: ", err);
                toast.error('Failed to join the battle.');
            }
        }
        
        setBattle(battleData);
      } else {
        setError("Battle not found. It might have been cancelled or never existed.");
        toast.error("Battle not found!");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [battleId, user, userProfile]);

  useEffect(() => {
    if (battle?.status === "active") {
      toast.info("Game is starting!");
      router.push(`/game/${battleId}`);
    }
  }, [battle?.status, battleId, router]);
  
  const handleReady = async () => {
      if (!user || !battle) return;
      const battleRef = doc(db, "battles", battleId);
      const currentReadyPlayers = battle.readyPlayers || [];
      
      if (!currentReadyPlayers.includes(user.uid)) {
          const newReadyPlayers = [...currentReadyPlayers, user.uid];
          await updateDoc(battleRef, { readyPlayers: newReadyPlayers });

          // If both players are ready, start the game
          if (newReadyPlayers.length === 2) {
               await updateDoc(battleRef, { status: 'active' });
          }
      }
  };

  const copyToClipboard = () => {
    const inviteLink = `${window.location.origin}/battle/${battleId}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopied(false), 2000);
    });
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
  
  const isCreator = user?.uid === battle.creator.id;
  const isOpponent = user?.uid === battle.opponent?.id;
  const isPlayer = isCreator || isOpponent;
  const isUserReady = user && battle.readyPlayers?.includes(user.uid);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
        {battle.status === 'completed' && battle.winner?.id === user?.uid && <Confetti width={width} height={height} />}

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl"> <Swords /> Battle Lobby</CardTitle>
          <CardDescription>Get ready for a duel!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-primary/10 rounded-lg text-center">
            <p className="text-sm text-primary">Battle Amount</p>
            <p className="text-3xl font-bold text-primary">₹{battle.amount}</p>
            <p className="text-xs text-primary/80">Winner takes ₹{(battle.amount * 2 * 0.95).toFixed(2)} (after 5% fee)</p>
          </div>
          
          <StatusIndicator status={battle.status} />

          <div className="grid grid-cols-2 gap-4 items-start">
            <PlayerCard player={battle.creator} isCreator={true} isReady={battle.readyPlayers?.includes(battle.creator.id)} />
            <PlayerCard player={battle.opponent} isCreator={false} isReady={battle.opponent && battle.readyPlayers?.includes(battle.opponent.id)} />
          </div>

          {battle.status === 'waiting' && (
            <Card className="p-4 space-y-2">
              <p className="text-center font-semibold">Waiting for an opponent...</p>
              <p className="text-center text-sm text-muted-foreground">Share this link to invite someone.</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/battle/${battleId}`}
                  className="flex-1 p-2 border rounded bg-muted text-sm"
                />
                <Button onClick={copyToClipboard} size="icon">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </Card>
          )}
          
          {battle.status === 'waiting_for_players_ready' && isPlayer && (
              <div className="text-center">
                <Button onClick={handleReady} disabled={isUserReady} className="w-full">
                    {isUserReady ? 'Waiting for other player...' : 'I am Ready!'}
                </Button>
              </div>
          )}
          
           {battle.status === 'completed' && (
              <Card className="p-4 text-center">
                  <h3 className="text-xl font-bold">
                      {battle.winner?.id === user?.uid ? 'Congratulations, You Won!' : 'Sorry, You Lost.'}
                  </h3>
                   <Button onClick={() => router.push('/')} className="mt-4">Play Again</Button>
              </Card>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
