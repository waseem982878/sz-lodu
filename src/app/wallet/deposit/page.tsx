
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IndianRupee, FileText, CheckCircle2, ArrowLeft, Upload, Loader2, TriangleAlert, Gift, PartyPopper } from "lucide-react";
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { createDepositRequest, getActiveUpi } from '@/services/transaction-service';
import QRCode from "qrcode.react";
import type { PaymentUpi } from '@/models/payment-upi.model';

const shortcutAmounts = [100, 200, 500, 1000, 2000, 5000];
const MINIMUM_DEPOSIT = 100;
const GST_RATE = 0.18; // 18%

export default function DepositPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [amount, setAmount] = useState(0);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeUpi, setActiveUpi] = useState<PaymentUpi | null>(null);
    const [loadingUpi, setLoadingUpi] = useState(true);
    const [step, setStep] = useState(1); // Step 1: Enter amount, Step 2: Make payment

    useEffect(() => {
        const fetchUpi = async () => {
            setLoadingUpi(true);
            const upi = await getActiveUpi();
            setActiveUpi(upi);
            setLoadingUpi(false);
        };
        fetchUpi();
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        setAmount(isNaN(value) ? 0 : value);
    }
    
    // The bonus is for display purposes only.
    const gstAmount = amount * GST_RATE;
    const totalPayable = amount; // User only pays the base amount
    const totalReceivedInWallet = amount; // User receives what they pay, bonus is not added.
    const upiUri = activeUpi ? `upi://pay?pa=${activeUpi.upiId}&pn=${encodeURIComponent(activeUpi.payeeName)}&am=${totalPayable.toFixed(2)}&cu=INR` : '';

    const handleSubmit = async () => {
        if (!user || !imageFile || amount < MINIMUM_DEPOSIT || !activeUpi) {
            alert(`Minimum deposit amount is ₹${MINIMUM_DEPOSIT}. Please also provide a screenshot and ensure a payment method is active.`);
            return;
        }
        setIsSubmitting(true);
        try {
            // IMPORTANT: Pass 0 as the bonus amount, regardless of what's displayed.
            await createDepositRequest(user.uid, amount, 0, imageFile, activeUpi.upiId);
            alert("Deposit request submitted successfully! It will be verified shortly.");
            router.push('/wallet');
        } catch (error) {
            alert("Failed to submit deposit request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 2) {
        return (
            <div className="space-y-4">
                 <Button onClick={() => setStep(1)} variant="ghost" className="pl-0">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Change Amount
                </Button>
                <Card className="shadow-lg border-primary/20">
                    <CardHeader className="text-center">
                        <CardTitle className='text-2xl text-primary'>Scan &amp; Pay</CardTitle>
                        <CardDescription>Scan the QR code to pay <span className="font-bold text-primary">₹{totalPayable.toFixed(2)}</span>.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4 text-center">
                        <div className="flex justify-center p-4 bg-white rounded-lg max-w-xs mx-auto">
                             {loadingUpi ? <Loader2 className="h-20 w-20 animate-spin text-primary" /> : (
                                activeUpi && amount >= MINIMUM_DEPOSIT ? <QRCode value={upiUri} size={256} fgColor="#B91C1C" /> : <p className="text-red-500 p-8 text-center">{amount >= MINIMUM_DEPOSIT ? "No active payment method available. Please contact support." : `Minimum deposit is ₹${MINIMUM_DEPOSIT}.`}</p>
                            )}
                        </div>
                        {activeUpi && (
                             <div className="text-center">
                                <p className="text-muted-foreground text-sm">Payable to:</p>
                                <p className="font-bold text-lg">{activeUpi.payeeName}</p>
                            </div>
                        )}
                         <div className="border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg flex items-start gap-3 text-left">
                            <TriangleAlert className="h-5 w-5 text-yellow-700 dark:text-yellow-300 flex-shrink-0 mt-1" />
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                Only deposit from the same name that is on your KYC documents, otherwise the payment will be put on hold.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="text-primary">Step 2: Upload Screenshot</CardTitle>
                        <CardDescription>After payment, upload the confirmation screenshot to verify your deposit.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <input id="payment-screenshot" ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        <Card 
                            className="mt-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-primary"
                             onClick={() => fileInputRef.current?.click()}
                        >
                            {imagePreview ? (
                                <div className="relative w-32 mx-auto">
                                    <Image src={imagePreview} alt="Payment Screenshot" width={128} height={256} className="rounded-md object-contain h-64 w-32" />
                                    <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full h-6 w-6 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-8">
                                    <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                                    <p className="mt-2 text-muted-foreground">Click to upload</p>
                                </div>
                            )}
                        </Card>
                    </CardContent>
                </Card>

                <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-lg py-6" 
                    disabled={amount < MINIMUM_DEPOSIT || !imageFile || isSubmitting}
                    onClick={handleSubmit}
                >
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    Submit Deposit Request
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className='text-center text-primary'>Choose Deposit Amount</CardTitle>
                    <CardDescription className='text-center'>Minimum deposit is ₹{MINIMUM_DEPOSIT}. We'll pay your GST for you!</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    <Input 
                        type="number"
                        placeholder={`Enter amount (min ₹${MINIMUM_DEPOSIT})`}
                        value={amount || ''}
                        onChange={handleAmountChange}
                        className="text-center text-lg font-bold mb-4"
                    />
                    <div className="grid grid-cols-3 gap-3">
                        {shortcutAmounts.map((shortcut) => {
                            const bonus = shortcut * GST_RATE;
                            return (
                                <Button 
                                    key={shortcut}
                                    variant={amount === shortcut ? "default" : "outline"}
                                    className="w-full h-auto py-2 flex flex-col"
                                    onClick={() => setAmount(shortcut)}
                                >
                                    <span className="text-lg font-bold">₹{shortcut}</span>
                                    <span className="text-xs text-green-600 font-semibold">+ ₹{bonus.toFixed(0)} GST Bonus</span>
                                </Button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

             {amount >= MINIMUM_DEPOSIT && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">Payment Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Your Deposit</span>
                            <span className="font-semibold">₹{amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-red-500">
                            <span className="text-muted-foreground">GST (18%)</span>
                            <span className="font-semibold">- ₹{gstAmount.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between items-center text-green-600">
                            <span className="font-semibold flex items-center gap-1"><Gift size={14}/> GST Bonus (from us)</span>
                            <span className="font-semibold">+ ₹{gstAmount.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-dashed my-2"></div>
                        <div className="flex justify-between items-center font-bold text-base">
                            <span>You Pay</span>
                            <span>₹{totalPayable.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-lg text-primary">
                            <span>You Receive in Wallet</span>
                            <span>₹{totalReceivedInWallet.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
             )}

            <Button 
                className="w-full bg-primary text-primary-foreground text-lg py-6" 
                onClick={() => setStep(2)}
                disabled={amount < MINIMUM_DEPOSIT || loadingUpi}
            >
                 {loadingUpi ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Proceed to Pay ₹{totalPayable.toFixed(2)}
            </Button>
        </div>
    );
}
