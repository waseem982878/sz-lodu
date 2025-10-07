
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, IndianRupee } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import OrderService from '@/services/order.service';

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

export default function DepositPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow only numbers and a single decimal point
        if (/^\d*\.?\d*$/.test(value)) {
            setAmount(value);
            setError('');
        }
    };

    const handlePresetAmount = (preset: number) => {
        setAmount(preset.toString());
        setError('');
    };

    const handleDeposit = async () => {
        const depositAmount = parseFloat(amount);
        if (!user || !depositAmount || depositAmount <= 0) {
            setError("Please enter a valid amount to deposit.");
            return;
        }
        
        // Minimum amount check
        if (depositAmount < 1) {
            setError("Minimum deposit amount is ₹1.");
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Create an order using the OrderService
            const orderId = await OrderService.createOrder({ 
                userId: user.uid, 
                amount: depositAmount,
                status: 'pending',
            });

            // Redirect to the new UPI payment page
            router.push(`/payment/${orderId}`);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            console.error("Deposit error:", errorMessage);
            setError(`Failed to initiate deposit: ${errorMessage}`);
            setLoading(false);
        }
    };

    const depositAmountValid = parseFloat(amount) > 0;

    return (
        <div className="space-y-4 max-w-md mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className='text-center text-primary'>Add Funds to Wallet</CardTitle>
                    <CardDescription className='text-center'>Enter an amount and proceed to payment.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Enter amount"
                                value={amount}
                                onChange={handleAmountChange}
                                className="pl-10 h-12 text-xl text-center font-bold"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-2">
                            {PRESET_AMOUNTS.map(preset => (
                                <Button
                                    key={preset}
                                    variant='outline'
                                    onClick={() => handlePresetAmount(preset)}
                                >
                                    ₹{preset}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 text-center">{error}</p>
                    )}

                    <Button onClick={handleDeposit} className="w-full text-lg h-12" disabled={loading || !depositAmountValid}>
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        Deposit ₹{depositAmountValid ? amount : '...'}
                    </Button>
                </CardContent>
            </Card>
            
            <Card className="border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-2">
                <CardContent className="text-sm text-blue-600 dark:text-blue-300 space-y-1 p-2">
                    <p>✓ Payments are processed via UPI.</p>
                    <p>✓ Your balance will be updated after manual verification.</p>
                    <p>✓ This may take up to 30 minutes after your payment.</p>
                </CardContent>
            </Card>
        </div>
    );
}
