
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IndianRupee, FileText, CheckCircle2, ArrowLeft, Upload, Loader2, TriangleAlert, Gift, Copy, Share } from "lucide-react";
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import QRCode from "qrcode.react";
import type { PaymentUpi } from '@/models/payment-upi.model';
import { useAuth } from '@/contexts/auth-context';
import { getActiveUpi, createDepositRequest } from '@/services/transaction-service';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

const shortcutAmounts = [100, 200, 500, 1000, 2000, 5000];
const MINIMUM_DEPOSIT = 100;
const GST_RATE = 0.28; // 28% GST as per government norms


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


function PaymentSummary({ amount, gstAmount }: { amount: number, gstAmount: number }) {
    if (amount < MINIMUM_DEPOSIT) return null;
    const amountAfterGst = amount / (1 + GST_RATE);
    const actualGst = amount - amountAfterGst;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg text-primary">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-sm">
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Deposit Amount</span>
                    <span className="font-semibold">₹{amount.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between items-center text-red-500">
                    <span className="text-muted-foreground">GST @ 28%</span>
                    <span className="font-semibold">- ₹{actualGst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sub-Total</span>
                    <span className="font-semibold">₹{amountAfterGst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-green-600">
                    <span className="font-semibold flex items-center gap-1"><Gift size={14}/> GST Bonus (from us)</span>
                    <span className="font-semibold">+ ₹{actualGst.toFixed(2)}</span>
                </div>
                <div className="border-t border-dashed my-2"></div>
                <div className="flex justify-between items-center font-bold text-lg text-primary">
                    <span>Total You Get</span>
                    <span>₹{amount.toFixed(2)}</span>
                </div>
            </CardContent>
        </Card>
    );
}

function GstBonusCard() {
    return (
        <Card className="bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700">
            <CardContent className="p-3 text-center">
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                    As per government rules, 28% GST applies on deposits. But don't worry, we pay it for you! You get 100% of what you deposit.
                </p>
            </CardContent>
        </Card>
    );
}

export default function DepositPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [amount, setAmount] = useState(0);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeUpi, setActiveUpi] = useState<PaymentUpi | null>(null);
    const [loadingUpi, setLoadingUpi] = useState(true);
    const [step, setStep] = useState(1);
    const [dialogState, setDialogState] = useState({ open: false, title: '', message: '' });

    const showDialog = (title: string, message: string) => {
        setDialogState({ open: true, title, message });
    };

    useEffect(() => {
        const fetchUpi = async () => {
            setLoadingUpi(true);
            try {
                const upi = await getActiveUpi();
                setActiveUpi(upi);
            } catch (error) {
                console.error("Failed to fetch UPI details:", error);
                setActiveUpi(null);
            } finally {
                setLoadingUpi(false);
            }
        }
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
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        showDialog("Copied", "Copied to clipboard!");
    };
    
    const gstAmount = amount * GST_RATE;
    const totalPayable = amount; 
    const upiUri = activeUpi ? `upi://pay?pa=${activeUpi.upiId}&pn=${encodeURIComponent(activeUpi.payeeName)}&am=${totalPayable.toFixed(2)}&cu=INR` : '';

    const handleSubmit = async () => {
        if (!user || !imageFile || amount < MINIMUM_DEPOSIT || !activeUpi) {
            showDialog("Error", `Minimum deposit amount is ₹${MINIMUM_DEPOSIT}. Please also provide a screenshot and ensure a payment method is active.`);
            return;
        }
        setIsSubmitting(true);
        try {
            await createDepositRequest(user.uid, amount, gstAmount, imageFile, activeUpi.upiId);
            showDialog("Success", "Deposit request submitted successfully! It will be verified shortly.");
            router.push('/wallet');
        } catch (e) {
            showDialog("Error", `Failed to submit deposit request: ${(e as Error).message}`);
            setIsSubmitting(false); // Only set submitting to false on error
        }
    };

    if (authLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }
    
    const handleProceed = () => {
        if (amount >= MINIMUM_DEPOSIT && !loadingUpi) {
            setStep(2);
        }
    }

    if (step === 2) {
        return (
            <div className="space-y-4">
                 <InfoDialog 
                    open={dialogState.open} 
                    onClose={() => setDialogState({ ...dialogState, open: false })} 
                    title={dialogState.title}
                    message={dialogState.message} 
                />
                 <Button onClick={() => setStep(1)} variant="ghost" className="pl-0">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Change Amount
                </Button>
                <Card className="shadow-lg border-primary/20">
                    <CardHeader className="text-center">
                        <CardTitle className='text-2xl text-primary'>Step 1: Make Payment</CardTitle>
                        <CardDescription>Pay <span className="font-bold text-primary">₹{totalPayable.toFixed(2)}</span> to the UPI ID below.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4 text-center">
                        <div className="flex justify-center p-4 bg-white rounded-lg max-w-xs mx-auto">
                             {loadingUpi ? <Loader2 className="h-20 w-20 animate-spin text-primary" /> : (
                                activeUpi && amount >= MINIMUM_DEPOSIT ? <QRCode value={upiUri} size={256} /> : <p className="text-red-500 p-8 text-center">{amount >= MINIMUM_DEPOSIT ? "No active payment method available. Please contact support." : `Minimum deposit is ₹${MINIMUM_DEPOSIT}.`}</p>
                            )}
                        </div>
                        {activeUpi && (
                             <div className="text-center space-y-3">
                                <Button asChild className="w-full">
                                    <a href={upiUri}>
                                        <Share className="mr-2 h-4 w-4"/> Pay via UPI App
                                    </a>
                                </Button>
                                <p className="text-muted-foreground text-sm">Payable to: <span className="font-bold text-lg text-foreground">{activeUpi.payeeName}</span></p>
                                <div className="flex items-center justify-center gap-2 p-2 bg-muted rounded-md">
                                    <p className="font-mono text-primary flex-shrink-1 overflow-x-auto whitespace-nowrap">{activeUpi.upiId}</p>
                                    <Button size="icon" variant="ghost" onClick={() => handleCopy(activeUpi.upiId)}><Copy className="w-4 h-4"/></Button>
                                </div>
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
             <InfoDialog 
                open={dialogState.open} 
                onClose={() => setDialogState({ ...dialogState, open: false })} 
                title={dialogState.title}
                message={dialogState.message} 
            />
            <GstBonusCard />
            <Card>
                <CardHeader>
                    <CardTitle className='text-center text-primary'>Choose Deposit Amount</CardTitle>
                    <CardDescription className='text-center'>Minimum deposit is ₹{MINIMUM_DEPOSIT}.</CardDescription>
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
                        {shortcutAmounts.map((shortcut) => (
                            <Button 
                                key={shortcut}
                                variant={amount === shortcut ? "default" : "outline"}
                                className={cn("w-full h-auto py-3 flex flex-col", amount === shortcut && "ring-2 ring-primary")}
                                onClick={() => setAmount(shortcut)}
                            >
                                <span className="text-lg font-bold">₹{shortcut}</span>
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <PaymentSummary amount={amount} gstAmount={gstAmount} />

            <Button 
                className="w-full bg-primary text-primary-foreground text-lg py-6" 
                onClick={handleProceed}
                disabled={amount < MINIMUM_DEPOSIT || loadingUpi}
            >
                 {loadingUpi ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Proceed to Pay ₹{totalPayable.toFixed(2)}
            </Button>
        </div>
    );
}
