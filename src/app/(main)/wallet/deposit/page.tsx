
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, IndianRupee } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

const popularAmounts = [100, 200, 500, 1000];
const MIN_DEPOSIT = 50;
const MAX_DEPOSIT = 10000;

export default function DepositPage() {
    const { user } = useAuth(); // Correctly get user from context
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAmountChange = (value: string) => {
        setError('');
        const sanitizedValue = value.replace(/[^0-9.]/g, '');
        const parts = sanitizedValue.split('.');
        if (parts.length > 2) {
            return;
        }
        if (parts[1] && parts[1].length > 2) {
            parts[1] = parts[1].substring(0, 2);
        }
        setAmount(parts.join('.'));
    };
    
    const selectPopularAmount = (popAmount: number) => {
        setAmount(popAmount.toString());
        setError('');
    }

    const validateAmount = () => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount < MIN_DEPOSIT || numericAmount > MAX_DEPOSIT) {
            setError(`Please enter an amount between ₹${MIN_DEPOSIT} and ₹${MAX_DEPOSIT}.`);
            return false;
        }
        return true;
    };

    const handleDeposit = async () => {
        if (!user || !validateAmount()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = await user.getIdToken(); // Correctly call getIdToken on the user object
            if (!token) {
                throw new Error("Authentication failed. Please log in again.");
            }

            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount: parseFloat(amount) })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create payment session.");
            }

            if (data.url) {
                router.push(data.url);
            } else {
                throw new Error("Could not get payment URL.");
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            console.error("Deposit error:", errorMessage);
            setError(errorMessage);
            setLoading(false);
        }
    };
    
    return (
        <div className="space-y-4 max-w-md mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className='text-center text-primary'>Add Funds</CardTitle>
                    <CardDescription className='text-center'>Enter an amount and proceed to secure payment.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (INR)</Label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                id="amount"
                                type="text"
                                placeholder={`e.g., ${MIN_DEPOSIT}`}
                                value={amount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                className="pl-10 text-lg font-semibold"
                                inputMode="decimal"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        {popularAmounts.map(pa => (
                            <Button key={pa} variant="outline" onClick={() => selectPopularAmount(pa)}>
                                ₹{pa}
                            </Button>
                        ))}
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 text-center">{error}</p>
                    )}

                    <Button onClick={handleDeposit} className="w-full text-lg" disabled={loading || !amount}>
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        Deposit ₹{amount || '...'}
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-green-500 bg-green-50 dark:bg-green-900/20 p-2">
                <CardContent className="text-sm text-green-600 dark:text-green-300 space-y-1 p-2">
                    <p>✓ Payments are processed securely by Stripe.</p>
                    <p>✓ Your balance is updated instantly upon successful payment.</p>
                    <p>✓ Minimum deposit is ₹{MIN_DEPOSIT}. Maximum is ₹{MAX_DEPOSIT}.</p>
                </CardContent>
            </Card>
        </div>
    );
}
