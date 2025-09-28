
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, Users, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import imagePaths from '@/lib/image-paths.json';
import { useAuth } from "@/contexts/auth-context";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface Referral {
    id: string;
    referrerId: string;
    referredId: string;
    referredName: string;
    status: 'pending' | 'completed';
    createdAt: any;
}


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


export default function ReferPage() {
    const { user, userProfile, loading: authLoading } = useAuth();

    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogState, setDialogState] = useState({ open: false, title: '', message: '' });

    const showDialog = (title: string, message: string) => {
        setDialogState({ open: true, title, message });
    };

    const referralCode = userProfile?.referralCode || "LOADING...";
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/landing?ref=${referralCode}` : '';
    const shareText = `I'm winning real cash on SZ LUDO. Join using my referral code: ${referralCode} and get a bonus!`;

    useEffect(() => {
        if (!user) {
             if(!authLoading) setLoading(false);
            return;
        }
        setLoading(true);
        const q = query(collection(db, "referrals"), where("referrerId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const referralData: Referral[] = [];
            snapshot.forEach(doc => {
                referralData.push({ id: doc.id, ...doc.data() } as Referral);
            });
            setReferrals(referralData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user, authLoading]);

    const handleCopy = () => {
        if (!user) return;
        const textToCopy = `${shareText} Download now: ${shareUrl}`;
        navigator.clipboard.writeText(textToCopy);
        showDialog("Copied", "Referral message copied!");
    }

    const handleShare = () => {
         if (!user) return;
        if (navigator.share) {
            navigator.share({
                title: 'Join me on SZ LUDO!',
                text: shareText,
                url: shareUrl,
            }).catch((error) => console.log('Error sharing', error));
        } else {
            handleCopy();
        }
    }

  return (
    <div className="space-y-4 text-center">
         <InfoDialog 
            open={dialogState.open} 
            onClose={() => setDialogState({ ...dialogState, open: false })} 
            title={dialogState.title}
            message={dialogState.message} 
        />
        <Card className="bg-primary text-primary-foreground overflow-hidden relative p-3 h-[72px] flex items-center">
            <div className="flex items-center justify-between w-full">
                <div className="flex-1 z-10">
                    <CardTitle className="text-xl sm:text-2xl">Refer & Earn</CardTitle>
                    <CardDescription className="text-primary-foreground/80 pt-1 text-xs">
                        Invite friends & earn ₹25!
                    </CardDescription>
                </div>
                <div className="absolute right-0 bottom-0 h-full w-auto aspect-square">
                     <Image
                        src={imagePaths.referGiftIcon.path}
                        alt={imagePaths.referGiftIcon.alt}
                        layout="fill"
                        className="object-contain"
                    />
                </div>
            </div>
        </Card>

        <Card>
            <CardHeader className="p-4">
                <CardTitle className="text-primary text-lg">Your Unique Referral Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
                <div className="p-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2">
                    <p className="text-xl md:text-2xl font-bold tracking-widest flex-shrink-1 overflow-x-auto whitespace-nowrap">{referralCode}</p>
                    <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!user}>
                        <Copy className="w-5 h-5" />
                    </Button>
                </div>
                <Button className="w-full" onClick={handleShare} disabled={!user}>
                    <Share2 className="mr-2 h-4 w-4" /> Share with Friends
                </Button>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader className="p-4">
                <CardTitle className="flex items-center justify-center gap-2 text-primary text-lg">
                    <Users className="h-5 w-5"/>
                    Your Referrals
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : referrals.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-2">Friend</TableHead>
                                <TableHead className="px-2">Status</TableHead>
                                <TableHead className="px-2">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {referrals.map(ref => (
                                <TableRow key={ref.id}>
                                    <TableCell className="p-2">{ref.referredName}</TableCell>
                                    <TableCell className="p-2">
                                        <Badge variant={ref.status === 'completed' ? 'default' : 'secondary'}>
                                            {ref.status === 'completed' ? 'Bonus Awarded' : 'Pending Game'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="p-2 text-xs">
                                        {ref.createdAt?.toDate ? ref.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-muted-foreground text-center py-8">You haven't referred anyone yet.</p>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
