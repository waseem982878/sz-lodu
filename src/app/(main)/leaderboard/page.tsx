
"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { UserProfile } from "@/models/user.model";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trophy, Award, Medal } from "lucide-react";
import Image from "next/image";
import imagePaths from '@/lib/image-paths.json';

const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Award className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-yellow-700" />;
    return <span className="font-bold text-sm w-6 text-center">{rank}</span>;
}

export default function LeaderboardPage() {
    const [topPlayers, setTopPlayers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopPlayers = async () => {
            setLoading(true);
            try {
                const usersRef = collection(db, "users");
                const q = query(usersRef, orderBy("gamesWon", "desc"), limit(20));
                const querySnapshot = await getDocs(q);
                
                const players: UserProfile[] = [];
                querySnapshot.forEach(doc => {
                    players.push({ uid: doc.id, ...doc.data() } as UserProfile);
                });
                setTopPlayers(players);
            } catch (error) {
                // Do not show alert to user for leaderboard fetching
            } finally {
                setLoading(false);
            }
        };

        fetchTopPlayers();
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
