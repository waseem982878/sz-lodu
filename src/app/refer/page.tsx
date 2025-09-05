
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import Image from "next/image";

interface Referral {
    id: string;
    referrerId: string;
    referredId: string;
    referredName: string;
    status: 'pending' | 'completed';
    createdAt: any;
}

export default function ReferPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);

    const referralCode = userProfile?.referralCode || "LOADING...";
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
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
        }, (error) => {
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user, authLoading]);

    const handleCopy = () => {
        if (!user) return;
        const textToCopy = `${shareText} Download now: ${shareUrl}`;
        navigator.clipboard.writeText(textToCopy);
        alert("Referral message copied!");
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
    <div className="space-y-6 text-center">
        <Card className="bg-primary text-primary-foreground overflow-hidden relative p-4 h-[88px] flex items-center">
            <div className="flex items-center justify-between w-full">
                <div className="flex-1 z-10">
                    <CardTitle className="text-2xl sm:text-3xl">Refer & Earn</CardTitle>
                    <CardDescription className="text-primary-foreground/80 pt-1 text-xs sm:text-sm">
                        Invite friends & earn ₹25!
                    </CardDescription>
                </div>
                <div className="absolute right-0 bottom-0 h-full w-auto aspect-square">
                     <Image
                        src="/refer-gift.png"
                        alt="Gift Box"
                        layout="fill"
                        className="object-contain"
                    />
                </div>
            </div>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="text-primary">Your Unique Referral Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2">
                    <p className="text-2xl md:text-3xl font-bold tracking-widest flex-shrink-1 overflow-x-auto whitespace-nowrap">{referralCode}</p>
                    <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!user}>
                        <Copy className="w-6 h-6" />
                    </Button>
                </div>
                <Button className="w-full" onClick={handleShare} disabled={!user}>
                    <Share2 className="mr-2 h-4 w-4" /> Share with Friends
                </Button>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-primary">
                    <Users className="h-6 w-6"/>
                    Your Referrals
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : referrals.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Friend</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {referrals.map(ref => (
                                <TableRow key={ref.id}>
                                    <TableCell>{ref.referredName}</TableCell>
                                    <TableCell>
                                        <Badge variant={ref.status === 'completed' ? 'default' : 'secondary'}>
                                            {ref.status === 'completed' ? 'Bonus Awarded' : 'Pending Game'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
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
