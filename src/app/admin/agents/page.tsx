
"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, IndianRupee, Edit } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { collection, onSnapshot, addDoc, updateDoc, doc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { Agent } from "@/models/agent.model";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";

function EditFloatModal({ agent, onSave }: { agent: Agent, onSave: (id: string, newFloat: number) => Promise<void> }) {
    const [float, setFloat] = useState(agent.floatBalance);
    const [isSaving, setIsSaving] = useState(false);
    const [open, setOpen] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(agent.id, float);
            setOpen(false); // Close dialog on success
        } catch (error) {
             alert("Failed to update float balance.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-primary">Edit Float for {agent.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Label htmlFor="float-balance">Float Balance (₹)</Label>
                    <Input id="float-balance" type="number" value={float} onChange={(e) => setFloat(Number(e.target.value))} />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                         <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  
  useEffect(() => {
    const q = collection(db, "agents");
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const agentData: Agent[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const remainingBalance = (data.floatBalance || 0) - (data.usedAmount || 0);
            agentData.push({ id: doc.id, ...data, remainingBalance } as Agent);
        });
        setAgents(agentData);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddAgent = async () => {
    if (!newName || !newEmail) {
        alert("Please provide a name and email for the agent.");
        return;
    }
    setIsSaving(true);
    try {
        await addDoc(collection(db, "agents"), {
            name: newName,
            email: newEmail,
            floatBalance: 0,
            usedAmount: 0,
            isActive: true,
        });
        setNewName("");
        setNewEmail("");
        alert("Agent added and user role updated successfully.");
    } catch (error) {
        alert(`Failed to add agent: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleUpdateFloat = async (id: string, newFloat: number) => {
        const agentRef = doc(db, 'agents', id);
        try {
            await updateDoc(agentRef, {
                floatBalance: Number(newFloat)
            });
        } catch (error) {
            throw error; // Re-throw to be caught in the modal
        }
    }

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold text-primary">Agent Management</h1>
      
        <Card>
            <CardHeader>
                <CardTitle className="text-primary">Add New Agent</CardTitle>
                <CardDescription>Create a new agent profile. You can add their float balance later.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="new-agent-name">Agent Name</Label>
                    <Input id="new-agent-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Rajesh Kumar"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-agent-email">Agent Email</Label>
                    <Input id="new-agent-email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="e.g., agent@example.com"/>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleAddAgent} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    Add Agent
                </Button>
            </CardFooter>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">All Agents</CardTitle>
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
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Float Balance</TableHead>
                        <TableHead>Used Amount</TableHead>
                        <TableHead>Remaining</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {agents.map((agent) => (
                        <TableRow key={agent.id}>
                            <TableCell className="font-medium">{agent.name}</TableCell>
                            <TableCell>{agent.email}</TableCell>
                            <TableCell className="flex items-center gap-2 whitespace-nowrap">
                               <IndianRupee className="h-4 w-4 text-muted-foreground"/> {agent.floatBalance.toLocaleString()}
                               <EditFloatModal agent={agent} onSave={handleUpdateFloat} />
                            </TableCell>
                            <TableCell className="text-red-500 whitespace-nowrap"><IndianRupee className="h-4 w-4 inline-block mr-1"/>{agent.usedAmount.toLocaleString()}</TableCell>
                            <TableCell className="font-bold text-green-600 whitespace-nowrap"><IndianRupee className="h-4 w-4 inline-block mr-1"/>{agent.remainingBalance.toLocaleString()}</TableCell>
                            <TableCell>
                                <Badge variant={agent.isActive ? "default" : "destructive"}>{agent.isActive ? "Active" : "Inactive"}</Badge>
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
