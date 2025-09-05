
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Info, CircleHelp, Trash2, TriangleAlert, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { getBattle, cancelBattle } from "@/services/battle-service";
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
          <DialogTitle className="text-primary">Game Rules</DialogTitle>
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
                    <strong>Uploading Result:</strong> Upload the winning screenshot in the "Game Result" section of the app. The winner gets the prize money after admin verification.
                </li>
                 <li>
                    <strong>Cheating:</strong> Any form of cheating, including using mods or teaming up, will result in an immediate ban and forfeiture of all wallet funds.
                </li>
                <li>
                    <strong>Disputes:</strong> If there is any issue, contact support immediately. Any attempt at fraud will result in a permanent ban.
                </li>
                 <li>
                    <strong>Cancellation:</strong> If you cancel a challenge after an opponent has joined, a penalty fee will be deducted and given to the opponent.
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
  const { user, userProfile, loading: authLoading } = useAuth();
  
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish before doing anything

    if (!battleId || !user) {
        router.replace('/play');
        return;
    };

    const unsubscribe = getBattle(battleId, (battleData) => {
        if (battleData) {
            // As soon as an opponent joins, the creator should be moved to the game page too.
            if (battleData.opponent && battleData.creator.id === user.uid) {
                router.replace(`/game/${battleId}`);
                return;
            }

            if (battleData.creator.id !== user.uid) {
                 setError("You are not the creator of this battle.");
                 setTimeout(() => router.push('/play'), 3000);
            } else if (battleData.status !== 'open') {
                 setError("This battle is no longer waiting for an opponent.");
                 setTimeout(() => router.replace('/play'), 3000);
            }
            else {
                setBattle(battleData);
            }
        } else {
            setError("Battle not found or has been cancelled.");
            setTimeout(() => router.push('/play'), 3000);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [battleId, user, router, authLoading]);

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

  if (loading || authLoading || !userProfile || !user) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (error || !battle) {
    return <div className="text-center py-10 text-red-500">{error || "Could not load battle details."}</div>;
  }
  
  const isPractice = battle.amount === 0;

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
                   {isPractice ? (
                      <p className="font-bold text-blue-600">Practice Match</p>
                   ) : (
                      <p className="font-bold text-green-600">₹ {battle.amount}</p>
                   )}
              </div>
              <div className="flex flex-col items-center gap-1 opacity-50">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <CircleHelp className="w-6 h-6 text-muted-foreground" />
                    </div>
                  <span className="font-semibold text-sm">Waiting...</span>
              </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-lg font-semibold my-4">Waiting for an opponent to join...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <Button variant="destructive" className="w-full mt-4" onClick={handleCancel}>
                <Trash2 className="mr-2 h-4 w-4" /> Cancel Battle
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg space-y-2">
        <h3 className="font-bold text-yellow-700 dark:text-yellow-300 flex items-center gap-2"><TriangleAlert className="h-5 w-5"/> Important Note</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
            <li>Do not press back or close the app while waiting.</li>
            <li>If you cancel, your bet amount will be refunded to your winnings wallet.</li>
        </ul>
      </div>
    </div>
  );
}
