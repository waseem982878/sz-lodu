
"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Crown } from "lucide-react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { Battle } from "@/models/battle.model";
import { updateBattleStatus } from "@/services/battle-service";

export default function BattlesPage() {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingBattleId, setUpdatingBattleId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "battles"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const battlesData: Battle[] = [];
      querySnapshot.forEach((doc) => {
        battlesData.push({ id: doc.id, ...doc.data() } as Battle);
      });
      setBattles(battlesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching battles:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSetWinner = async (battle: Battle, winnerId: string) => {
    if (!battle.opponent) {
        alert("Cannot set winner for a battle without an opponent.");
        return;
    }
    
    if (battle.status === 'completed') {
        alert("This battle has already been completed.");
        return;
    }

    if (confirm("Are you sure you want to set this user as the winner? This action is irreversible and will transfer funds.")) {
        setUpdatingBattleId(battle.id);
        try {
            await updateBattleStatus(battle.id, winnerId);
            alert("Winner has been set and funds have been transferred successfully.");
        } catch(e) {
            alert("Failed to set winner. " + (e as Error).message);
        } finally {
            setUpdatingBattleId(null);
        }
    }
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Battle Management</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">All Battles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Battle ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Opponent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Winner</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {battles.map((battle) => (
                    <TableRow key={battle.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground break-all max-w-xs">{battle.id}</TableCell>
                      <TableCell>₹{battle.amount}</TableCell>
                      <TableCell>{battle.creator.name}</TableCell>
                      <TableCell>{battle.opponent?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            battle.status === 'completed' ? 'default' : 
                            battle.status === 'inprogress' || battle.status === 'result_pending' ? 'secondary' : 
                            battle.status === 'cancelled' ? 'destructive' : 'outline'
                          }
                        >
                          {battle.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{battle.winnerId ? (battle.winnerId === battle.creator.id ? battle.creator.name : battle.opponent?.name) : 'N/A'}</TableCell>
                      <TableCell>
                          {(battle.status === 'result_pending' || battle.status === 'inprogress') && battle.opponent && (
                              <div className="flex flex-col gap-2">
                                  <Button 
                                      size="sm" 
                                      className="bg-green-600 hover:bg-green-700 text-white" 
                                      onClick={() => handleSetWinner(battle, battle.creator.id)}
                                      disabled={updatingBattleId === battle.id}
                                  >
                                      {updatingBattleId === battle.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crown className="mr-2 h-4 w-4" />}
                                      Set {battle.creator.name} as Winner
                                  </Button>
                                  <Button 
                                      size="sm" 
                                      className="bg-blue-600 hover:bg-blue-700 text-white" 
                                      onClick={() => handleSetWinner(battle, battle.opponent!.id)}
                                      disabled={updatingBattleId === battle.id}
                                  >
                                      {updatingBattleId === battle.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crown className="mr-2 h-4 w-4" />}
                                      Set {battle.opponent.name} as Winner
                                  </Button>
                              </div>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
