
"use client";

import { useEffect, useState } from "react";
import type { UserProfile } from "@/models/user.model";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trophy, Award, Medal, CircleUserRound } from "lucide-react";
import Image from "next/image";
import imagePaths from '@/lib/image-paths.json';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Award className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-yellow-700" />;
    return <span className="font-bold text-sm w-6 text-center">{rank}</span>;
}

const mockTopPlayers: UserProfile[] = [
    { uid: '1', displayName: 'Rohan Sharma', gamesPlayed: 150, gamesWon: 120, depositBalance: 0, winningsBalance: 0, kycStatus: 'approved', email: undefined, phoneNumber: undefined, referralCode: '', createdAt: Timestamp.now(), winStreak: 10, losingStreak: 0, biggestWin: 5000 },
    { uid: '2', displayName: 'Priya Singh', gamesPlayed: 140, gamesWon: 110, depositBalance: 0, winningsBalance: 0, kycStatus: 'approved', email: undefined, phoneNumber: undefined, referralCode: '', createdAt: Timestamp.now(), winStreak: 5, losingStreak: 0, biggestWin: 2500 },
    { uid: '3', displayName: 'Amit Kumar', gamesPlayed: 130, gamesWon: 95, depositBalance: 0, winningsBalance: 0, kycStatus: 'approved', email: undefined, phoneNumber: undefined, referralCode: '', createdAt: Timestamp.now(), winStreak: 2, losingStreak: 0, biggestWin: 1000 },
    { uid: '4', displayName: 'Sneha Patel', gamesPlayed: 125, gamesWon: 90, depositBalance: 0, winningsBalance: 0, kycStatus: 'approved', email: undefined, phoneNumber: undefined, referralCode: '', createdAt: Timestamp.now(), winStreak: 0, losingStreak: 1, biggestWin: 1000 },
    { uid: '5', displayName: 'Vikas Gupta', gamesPlayed: 110, gamesWon: 85, depositBalance: 0, winningsBalance: 0, kycStatus: 'approved', email: undefined, phoneNumber: undefined, referralCode: '', createdAt: Timestamp.now(), winStreak: 4, losingStreak: 0, biggestWin: 500 },
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
        <div className="space-y-4">
            <Card className="bg-primary text-primary-foreground overflow-hidden relative p-3 h-[72px] flex items-center">
                 <div className="flex items-center justify-between w-full">
                    <div className="flex-1">
                         <CardTitle className="text-xl sm:text-2xl">Top Players</CardTitle>
                        <CardDescription className="text-primary-foreground/80 pt-1 text-xs">
                            See who is leading the charts!
                        </CardDescription>
                    </div>
                     <div className="relative w-20 h-20 flex-shrink-0 -mr-3">
                         <Image
                            src={imagePaths.trophyIcon.path}
                            alt={imagePaths.trophyIcon.alt}
                            width={80}
                            height={80}
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
                                    <TableHead className="w-1/6 text-center px-2">Rank</TableHead>
                                    <TableHead className="w-3/6 px-2">Player</TableHead>
                                    <TableHead className="w-1/6 text-center px-2">Wins</TableHead>
                                    <TableHead className="w-1/6 text-center px-2">Win Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topPlayers.map((player, index) => {
                                    const gamesPlayed = player.gamesPlayed ?? 0;
                                    const gamesWon = player.gamesWon ?? 0;
                                    const winRate = gamesPlayed > 0 ? ((gamesWon / gamesPlayed) * 100).toFixed(0) : 0;
                                    return (
                                        <TableRow key={player.uid} className={index < 3 ? 'bg-muted/50' : ''}>
                                            <TableCell className="font-bold text-center flex justify-center items-center h-full p-2">
                                               {getRankIcon(index + 1)}
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border">
                                                        <CircleUserRound className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                    <span className="font-medium text-sm">{player.displayName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-center p-2">{gamesWon}</TableCell>
                                            <TableCell className="text-center p-2">{winRate}%</TableCell>
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
