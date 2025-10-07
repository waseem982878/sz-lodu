"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Swords, Gamepad2, Loader2, IndianRupee, Users, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import type { Battle } from "@/models/battle.model";

const GameCard = ({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) => (
    <Card className="hover:border-primary transition-colors">
        <CardHeader className="flex-row items-center gap-4">
            {icon}
            <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </div>
        </CardHeader>
    </Card>
);

export default function PlayPage() {
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const [amount, setAmount] = useState(100);
    const [isCreating, setIsCreating] = useState(false);
    const [isFinding, setIsFinding] = useState(false);
    const [openBattles, setOpenBattles] = useState<Battle[]>([]);
    const [loadingBattles, setLoadingBattles] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "battles"), where("status", "==", "waiting"));
        
        const unsubscribe: Unsubscribe = onSnapshot(q, (snapshot) => {
            const battles = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Battle));
            setOpenBattles(battles);
            setLoadingBattles(false);
        }, (error) => {
            console.error("Error fetching open battles: ", error);
            setLoadingBattles(false);
        });

        return () => unsubscribe();
    }, []);

    const handleCreateBattle = async () => {
        if (!user || !userProfile) {
            toast.error("You must be logged in to create a battle.");
            return;
        }

        if (amount <= 0) {
            toast.error("Amount must be greater than 0.");
            return;
        }
        
        if(userProfile.depositBalance === undefined || userProfile.winningsBalance === undefined) {
             toast.error("Could not fetch your balance. Please try again.");
            return;
        }

        if ((userProfile.depositBalance + userProfile.winningsBalance) < amount) {
            toast.error("Insufficient balance to create this battle.", {
                action: { label: "Add Funds", onClick: () => router.push('/wallet/deposit') }
            });
            return;
        }

        setIsCreating(true);
        try {
            const newBattle = {
                amount,
                creator: { 
                    id: user.uid, 
                    name: userProfile.displayName || 'Anonymous', 
                    avatarUrl: userProfile.photoURL || ''
                },
                status: 'waiting',
                gameType: 'ludo_classic',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            const docRef = await addDoc(collection(db, "battles"), newBattle);
            toast.success("Battle created! Waiting for an opponent.");
            router.push(`/create/${docRef.id}`);
        } catch (error) {
            console.error("Error creating battle:", error);
            toast.error("Failed to create battle. Please try again.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinBattle = (battleId: string) => {
        router.push(`/create/${battleId}`);
    };
    
    const handleFindMatch = async () => {
        setIsFinding(true);
        // Basic matchmaking: find the first available game
        const availableBattle = openBattles.find(b => b.creator.id !== user?.uid);
        if(availableBattle) {
             toast.success('Match found! Joining now...');
            router.push(`/create/${availableBattle.id}`);
        } else {
            // If no match, create a new one
            await handleCreateBattle();
        }
        setIsFinding(false);
    };

    return (
        <div className="space-y-6">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Create a New Battle</CardTitle>
                    <CardDescription>Set the amount and challenge players.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                        <Input 
                            id="amount" 
                            type="number" 
                            value={amount} 
                            onChange={(e) => setAmount(Number(e.target.value))} 
                            className="pl-10 text-xl text-center font-bold h-14"
                            min="1"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                         <Button onClick={handleCreateBattle} disabled={isCreating || isFinding} className="w-full h-12">
                            {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Swords className="mr-2 h-4 w-4"/>}
                            Create
                        </Button>
                        <Button onClick={handleFindMatch} disabled={isFinding || isCreating} className="w-full h-12">
                            {isFinding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gamepad2 className="mr-2 h-4 w-4"/>}
                            Find Match
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users /> Open Battles
                    </CardTitle>
                    <CardDescription>Join an existing battle from the list below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {loadingBattles ? (
                        <div className="flex justify-center items-center py-10">
                             <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : openBattles.length > 0 ? (
                        openBattles.map((battle) => (
                            <Card 
                                key={battle.id} 
                                className="p-3 flex justify-between items-center hover:bg-muted/50 transition-colors"
                            >
                                <div>
                                    <p className="font-semibold">{battle.creator.name}</p>
                                    <p className="text-sm text-primary font-bold">₹{battle.amount}</p>
                                </div>
                                <Button 
                                    onClick={() => handleJoinBattle(battle.id)} 
                                    size="sm" 
                                    disabled={user?.uid === battle.creator.id}
                                >
                                    Join <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Card>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-10">No open battles right now. Why not create one?</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
