
"use client";

import { useEffect, useState } from "react";
import type { UserProfile } from "@/models/user.model";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trophy, Award, Medal } from "lucide-react";
import Image from "next/image";
import imagePaths from '@/lib/image-paths.json';
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";

const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Award className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-yellow-700" />;
    return <span className="font-bold text-sm w-6 text-center">{rank}</span>;
}

const mockTopPlayers: UserProfile[] = [
    { uid: '1', name: 'Rohan Sharma', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Rohan', gamesPlayed: 150, gamesWon: 120, depositBalance: 0, winningsBalance: 0, kycStatus: 'Verified', email: null, phoneNumber: null, referralCode: '', penaltyTotal: 0, createdAt: new Date(), winStreak: 10, losingStreak: 0, biggestWin: 5000 },
    { uid: '2', name: 'Priya Singh', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Priya', gamesPlayed: 140, gamesWon: 110, depositBalance: 0, winningsBalance: 0, kycStatus: 'Verified', email: null, phoneNumber: null, referralCode: '', penaltyTotal: 0, createdAt: new Date(), winStreak: 5, losingStreak: 0, biggestWin: 2500 },
    { uid: '3', name: 'Amit Kumar', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Amit', gamesPlayed: 130, gamesWon: 95, depositBalance: 0, winningsBalance: 0, kycStatus: 'Verified', email: null, phoneNumber: null, referralCode: '', penaltyTotal: 0, createdAt: new Date(), winStreak: 2, losingStreak: 0, biggestWin: 1000 },
    { uid: '4', name: 'Sneha Patel', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Sneha', gamesPlayed: 125, gamesWon: 90, depositBalance: 0, winningsBalance: 0, kycStatus: 'Verified', email: null, phoneNumber: null, referralCode: '', penaltyTotal: 0, createdAt: new Date(), winStreak: 0, losingStreak: 1, biggestWin: 1000 },
    { uid: '5', name: 'Vikas Gupta', avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Vikas', gamesPlayed: 110, gamesWon: 85, depositBalance: 0, winningsBalance: 0, kycStatus: 'Verified', email: null, phoneNumber: null, referralCode: '', penaltyTotal: 0, createdAt: new Date(), winStreak: 4, losingStreak: 0, biggestWin: 500 },
];


export default function LeaderboardPage() {
    const [topPlayers, setTopPlayers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const playersQuery = query(collection(db, "users"), orderBy("gamesWon", "desc"), limit(20));
        const unsubscribe = onSnapshot(playersQuery, (snapshot) => {
            const players: UserProfile[] = [];
            snapshot.forEach(doc => players.push(doc.data() as UserProfile));
            if (players.length === 0) {
                setTopPlayers(mockTopPlayers);
            } else {
                setTopPlayers(players);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching leaderboard:", error);
            setTopPlayers(mockTopPlayers); // Show mock data on error as well
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, []);

    return (
        <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground overflow-hidden relative p-4 h-[88px] flex items-center">
                 <div className="flex items-center justify-between w-full">
                    <div className="flex-1">
                         <CardTitle className="text-2xl sm:text-3xl">Top Players</CardTitle>
                        <CardDescription className="text-primary-foreground/80 pt-1 text-xs sm:text-sm">
                            See who is leading the charts!
                        </CardDescription>
                    </div>
                     <div className="relative w-24 h-24 flex-shrink-0 -mr-4">
                         <Image
                            src={imagePaths.trophyIcon.path}
                            alt={imagePaths.trophyIcon.alt}
                            width={104}
                            height={104}
                            className="object-contain"
                        />
                    </div>
                </div>
            </Card>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/6 text-center">Rank</TableHead>
                                    <TableHead className="w-3/6">Player</TableHead>
                                    <TableHead className="w-1/6 text-center">Wins</TableHead>
                                    <TableHead className="w-1/6 text-center">Win Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topPlayers.map((player, index) => {
                                    const winRate = player.gamesPlayed > 0 ? ((player.gamesWon / player.gamesPlayed) * 100).toFixed(0) : 0;
                                    return (
                                        <TableRow key={player.uid} className={index < 3 ? 'bg-muted/50' : ''}>
                                            <TableCell className="font-bold text-center flex justify-center items-center h-full">
                                               {getRankIcon(index + 1)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Image
                                                        src={player.avatarUrl}
                                                        alt={player.name}
                                                        width={40}
                                                        height={40}
                                                        className="rounded-full border"
                                                    />
                                                    <span className="font-medium">{player.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-center">{player.gamesWon}</TableCell>
                                            <TableCell className="text-center">{winRate}%</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
