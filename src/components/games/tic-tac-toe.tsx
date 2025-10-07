import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import type { Battle } from '@/models/battle.model';
import { Button } from '@/components/ui/button';

const TicTacToeGame = ({ gameId, battle }: { gameId: string; battle: Battle }) => {
    const { user } = useAuth();
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isMyTurn, setIsMyTurn] = useState(false);

    useEffect(() => {
        const gameRef = doc(db, 'battles', gameId);
        const unsubscribe = onSnapshot(gameRef, (doc) => {
            if (doc.exists()) {
                const gameData = doc.data() as Battle;
                setBoard(gameData.moves || Array(9).fill(null));
                // Determine whose turn it is
            }
        });
        return () => unsubscribe();
    }, [gameId]);

    const handleMove = async (index: number) => {
        if (board[index] || !isMyTurn) return;
        const newBoard = [...board];
        newBoard[index] = 'X'; // Assume user is always 'X'
        await updateDoc(doc(db, 'battles', gameId), { moves: newBoard });
    };

    return (
        <div className="flex flex-col items-center">
            <div className="grid grid-cols-3 gap-2">
                {board.map((cell, index) => (
                    <Button key={index} onClick={() => handleMove(index)} className="w-24 h-24 text-4xl font-bold">
                        {cell}
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default TicTacToeGame;
