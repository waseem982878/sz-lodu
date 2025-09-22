
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Info, CircleHelp, Copy, Trash2, TriangleAlert, Loader2, CheckCircle } from "lucide-react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { getBattle, setRoomCode as setBattleRoomCode, cancelBattle, markPlayerAsReady } from "@/services/battle-service";
import type { Battle } from "@/models/battle.model";

function RulesDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-red-500 border-red-500">
            <Info className="mr-2 h-4 w-4" /> Rules
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Game Rules</DialogTitle>
          <DialogDescription>
            Follow these rules to ensure a fair and enjoyable game.
          </DialogDescription>
        </DialogHeader>
        <div className="prose dark:prose-invert max-w-none text-foreground">
            <ul className="space-y-3 text-sm list-disc list-inside">
                <li>
                    <strong>Room Code:</strong> After joining a battle, the creator will enter a Ludo King room code. You must join the room in the Ludo King app using this code.
                </li>
                <li>
                    <strong>Gameplay:</strong> The game must be played according to standard Ludo King classic rules.
                </li>
                <li>
                    <strong>Winning Proof:</strong> After winning the game, you MUST take a screenshot of the final win screen in Ludo King.
                </li>
                <li>
                    <strong>Uploading Result:</strong> Upload the winning screenshot in the "Game Result" section of the app. The winner gets the prize money after verification.
                </li>
                 <li>
                    <strong>Cheating:</strong> Any form of cheating, including using mods or teaming up, will result in an immediate ban and forfeiture of all wallet funds.
                </li>
                <li>
                    <strong>Disputes:</strong> If there is any issue, contact support immediately. Any attempt at fraud will result in a permanent ban.
                </li>
                 <li>
                    <strong>Cancellation:</strong> If you cancel a challenge after an opponent has joined, a penalty fee will be deducted from your wallet.
                </li>
            </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function CreateBattlePage({ params }: { params: { battleId: string } }) {
  const router = useRouter();
  const { battleId } = params;
  const { user, userProfile } = useAuth();
  
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [isMarkingReady, setIsMarkingReady] = useState(false);


  useEffect(() => {
    if (!battleId || !user) {
        return;
    };
    const unsubscribe = getBattle(battleId, (battleData) => {
        if (battleData) {
             // If the battle creator is NOT viewing, check if they are the opponent.
             if (battleData.creator.id !== user.uid) {
                // If an opponent has joined and it's this user, redirect them to the main game room.
                if (battleData.opponent?.id === user.uid) {
                    router.replace(`/game/${battleId}`);
                    return;
                }
                 // User is neither creator nor opponent.
                 setError("You are not part of this battle.");
                 setTimeout(() => router.push('/play'), 3000);

             } else { // The creator is viewing the page
                setBattle(battleData);
                // If battle has moved on, redirect creator to game room too
                if(battleData.status === 'inprogress' || battleData.status === 'result_pending' || battleData.status === 'completed' || battleData.status === 'waiting_for_players_ready') {
                    router.replace(`/game/${battleId}`);
                }
             }
        } else {
            setError("Battle not found or has been cancelled.");
            setTimeout(() => router.push('/play'), 3000);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [battleId, user, router]);

  const handleCodeSubmit = async () => {
      if(roomCode.trim() && battle) {
          setIsSubmittingCode(true);
          try {
            await setBattleRoomCode(battle.id, roomCode.trim());
          } catch(err) {
              alert("Failed to set room code.");
          } finally {
              setIsSubmittingCode(false);
          }
      }
  }
  
  const handleReady = async () => {
    if (!battle || !user) return;
    setIsMarkingReady(true);
    try {
        await markPlayerAsReady(battle.id, user.uid);
    } catch (err) {
        alert("Could not mark as ready.");
    } finally {
        setIsMarkingReady(false);
    }
  }

  const handleCopy = () => {
    if (battle?.roomCode) {
      navigator.clipboard.writeText(battle.roomCode);
      alert("Copied!");
    }
  }
  
  const handleCancel = async () => {
    if (!battle || !user) return;
    if (confirm("Are you sure you want to cancel this battle? A penalty may be applied if an opponent has joined.")) {
      try {
        await cancelBattle(battle.id, user.uid, battle.amount);
        alert("Battle cancelled.");
        router.push('/play');
      } catch (err) {
        alert(`Failed to cancel battle: ${(err as Error).message}`);
      }
    }
  }

  if (loading || !userProfile) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (error || !battle) {
    return <div className="text-center py-10 text-red-500">{error || "Could not load battle details."}</div>;
  }
  
  const isOpponentJoined = !!battle.opponent;
  const opponent = battle.opponent;
  const isPlayerReady = user && battle.readyPlayers && battle.readyPlayers[user.uid];
  const isOpponentReady = opponent && battle.readyPlayers && battle.readyPlayers[opponent.id];


   const renderGameControl = () => {
        if (!isOpponentJoined) {
            return (
                <div className='text-center py-4'>
                    <p className="text-lg font-semibold my-2">Waiting for an opponent...</p>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
            )
        }

        if (!battle.roomCode) {
            return (
                 <>
                    <p className="text-sm text-muted-foreground">Enter Ludo King Room Code</p>
                    <div className="flex items-center gap-2 my-2">
                        <Input 
                            type="text" 
                            placeholder="Enter room code" 
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value)}
                            className="text-center tracking-widest"
                            disabled={isSubmittingCode}
                        />
                        <Button onClick={handleCodeSubmit} disabled={isSubmittingCode || !roomCode}>
                            {isSubmittingCode ? <Loader2 className="animate-spin" /> : "Set"}
                        </Button>
                    </div>
                     <p className="text-xs text-muted-foreground my-4">After getting the code from Ludo King, enter it here.</p>
                </>
            )
        }

        if (battle.status === 'waiting_for_players_ready') {
             return (
                <div className="text-center py-4 space-y-4">
                     <p className="text-sm text-muted-foreground">Room Code</p>
                    <div className="flex justify-center items-center gap-4 my-2">
                        <p className="text-4xl font-bold tracking-widest text-primary">{battle.roomCode}</p>
                        <Button variant="ghost" size="icon" onClick={handleCopy}>
                            <Copy className="w-6 h-6" />
                        </Button>
                    </div>

                    {isPlayerReady ? (
                         <div className='text-center py-4'>
                            <p className="text-lg font-semibold my-2 text-green-600">You are ready!</p>
                            <p>Waiting for {opponent?.name} to confirm...</p>
                        </div>
                    ) : (
                         <Button className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={handleReady} disabled={isMarkingReady}>
                            {isMarkingReady ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            I'm Ready
                         </Button>
                    )}
                </div>
            )
        }
        
        return <p className="text-center text-muted-foreground">Redirecting to game...</p>;
    }


  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center">
        <RulesDialog />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center text-center mb-4">
              <div className="flex flex-col items-center gap-1">
                  <Image src={userProfile.avatarUrl} alt="You" width={40} height={40} className="rounded-full ring-2 ring-primary" />
                  <span className="font-semibold text-sm">You</span>
              </div>
              <div className="text-center">
                  <p className="text-orange-500 font-bold text-xl">VS</p>
                  <p className="font-bold text-green-600">₹ {battle.amount}</p>
              </div>
              <div className={`flex flex-col items-center gap-1 transition-opacity duration-500 ${isOpponentJoined ? 'opacity-100' : 'opacity-50'}`}>
                    {isOpponentJoined && opponent ? (
                        <Image src={opponent.avatarUrl} alt={opponent.name} width={40} height={40} className="rounded-full ring-2 ring-muted" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <CircleHelp className="w-6 h-6 text-muted-foreground" />
                        </div>
                    )}
                  <span className="font-semibold text-sm">{isOpponentJoined && opponent ? opponent.name : 'Waiting...'}</span>
              </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            {renderGameControl()}
            <Button variant="destructive" className="w-full mt-4" onClick={handleCancel}>
                <Trash2 className="mr-2 h-4 w-4" /> Cancel Battle
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-center text-sm text-muted-foreground">The game will start automatically once both players are ready.</p>

      <div className="border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg space-y-2">
        <h3 className="font-bold text-yellow-700 dark:text-yellow-300 flex items-center gap-2"><TriangleAlert className="h-5 w-5"/> Important Note</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
            <li>Do not press back or close the app after the opponent has joined.</li>
            <li>If you cancel after the opponent joins, a penalty of Rs. 5 will be deducted from your wallet.</li>
        </ul>
      </div>
    </div>
  );
}

    