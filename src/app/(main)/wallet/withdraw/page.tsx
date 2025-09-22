
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banknote, Landmark, TriangleAlert, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import { createWithdrawalRequest } from '@/services/transaction-service';


const shortcutAmounts = [300, 500, 1000, 2000];
const MINIMUM_WITHDRAWAL = 300;

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


export default function WithdrawPage() {
    const router = useRouter();
    const { user, userProfile, loading } = useAuth();
    
    const [amount, setAmount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('upi');
    const [upiId, setUpiId] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [accountHolderName, setAccountHolderName] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [dialogState, setDialogState] = useState({ open: false, title: '', message: '' });


    const winningsBalance = userProfile?.winningsBalance ?? 0;
    const isKycVerified = userProfile?.kycStatus === 'Verified';

    useEffect(() => {
        if (amount > 0 && amount < MINIMUM_WITHDRAWAL) {
            setFormError(`Minimum withdrawal is ₹${MINIMUM_WITHDRAWAL}.`);
        } else if (amount > winningsBalance) {
            setFormError('Amount cannot exceed your winnings balance.');
        } else {
            setFormError(null);
        }
    }, [amount, winningsBalance]);

    useEffect(() => {
      if(userProfile?.upiId) {
        setUpiId(userProfile.upiId);
      }
    }, [userProfile]);

    if (loading || !user || !userProfile) {
         return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        setAmount(isNaN(value) ? 0 : value);
    };
    
    const showDialog = (title: string, message: string) => {
        setDialogState({ open: true, title, message });
    };


    const handleSubmit = async () => {
        if (isSubmitting || formError) return;
        if (!user) return;
        
        if (!isKycVerified) {
            showDialog("KYC Required", "Please complete your KYC verification before withdrawing.");
            router.push('/profile/kyc');
            return;
        }

        if (amount < MINIMUM_WITHDRAWAL) {
             showDialog("Invalid Amount", `Minimum withdrawal amount is ₹${MINIMUM_WITHDRAWAL}.`);
            return;
        }

        if (amount > winningsBalance) {
            showDialog("Insufficient Balance", "You cannot withdraw more than your winnings balance.");
            return;
        }
        
        const withdrawalDetails = activeTab === 'upi' 
            ? { method: 'upi' as const, address: upiId }
            : { method: 'bank' as const, address: `${accountHolderName}, ${accountNumber}, ${ifscCode}` };

        if (!withdrawalDetails.address.trim() || (activeTab === 'bank' && (!accountHolderName || !accountNumber || !ifscCode))) {
            showDialog("Missing Details",`Please enter your ${activeTab === 'upi' ? 'UPI ID' : 'complete bank details'}.`);
            return;
        }

        setIsSubmitting(true);
        try {
            await createWithdrawalRequest(user.uid, amount, withdrawalDetails);
            showDialog("Success", "Withdrawal request submitted successfully! It will be processed soon.");
            router.push('/wallet');
        } catch (e) {
             showDialog("Error", `Failed to submit withdrawal request: ${(e as Error).message}`);
        } finally {
             setIsSubmitting(false);
        }
    };

    const processingFee = amount * 0.02; // Assuming 2% processing fee
    const netAmount = amount - processingFee;
    const canSubmit = !formError && amount > 0 && (activeTab === 'upi' ? !!upiId : !!accountNumber && !!ifscCode && !!accountHolderName);

    if (!isKycVerified) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                 <TriangleAlert className="h-16 w-16 text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-primary">KYC Verification Required</h2>
                <p className="text-muted-foreground mb-6">You must complete your KYC verification before you can withdraw funds.</p>
                <Link href="/profile/kyc" passHref>
                    <Button>Go to KYC Page</Button>
                </Link>
                 <InfoDialog 
                    open={dialogState.open} 
                    onClose={() => setDialogState({ ...dialogState, open: false })} 
                    title={dialogState.title}
                    message={dialogState.message} 
                />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className='text-center text-primary'>Withdraw Funds</CardTitle>
                    <CardDescription className="text-center">Your winnings balance: <span className="font-bold text-primary">₹{winningsBalance.toFixed(2)}</span>. Minimum withdrawal is ₹{MINIMUM_WITHDRAWAL}.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                    <Input 
                        type="number"
                        placeholder={`Enter amount (min ₹${MINIMUM_WITHDRAWAL})`}
                        value={amount || ''}
                        onChange={handleAmountChange}
                        className="text-center text-lg font-bold"
                    />
                    {formError && <p className="text-sm text-red-500 text-center pt-1">{formError}</p>}
                    <div className="grid grid-cols-4 gap-2 pt-2">
                        {shortcutAmounts.map((shortcut) => (
                            <Button 
                                key={shortcut}
                                variant="outline"
                                className="w-full h-full py-2"
                                onClick={() => setAmount(shortcut)}
                            >
                                ₹{shortcut}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="upi" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upi"><Banknote className="mr-2 h-4 w-4"/>UPI</TabsTrigger>
                    <TabsTrigger value="bank"><Landmark className="mr-2 h-4 w-4"/>Bank Transfer</TabsTrigger>
                </TabsList>
                <TabsContent value="upi">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg text-primary">Enter UPI Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <Input placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                           <div className="text-xs text-muted-foreground p-2 bg-muted rounded-md">
                                Your withdrawal will be processed to this UPI ID. Please double-check the details.
                           </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="bank">
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg text-primary">Enter Bank Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <Input placeholder="Account Holder Name" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)}/>
                           <Input placeholder="Account Number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                           <Input placeholder="IFSC Code" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {amount > 0 && !formError && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Withdrawal Amount</span>
                            <span className="font-semibold">₹{amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Processing Fee (2%)</span>
                            <span className="text-red-500 font-semibold">-₹{processingFee.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-dashed my-2"></div>
                        <div className="flex justify-between items-center font-bold text-lg">
                            <span>You will receive</span>
                            <span className="text-green-500">₹{netAmount.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

             <div className="border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg flex items-start gap-3">
                <TriangleAlert className="h-5 w-5 text-yellow-700 dark:text-yellow-300 flex-shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Withdrawals are only processed to KYC verified accounts. Withdrawals may take up to 24 hours to reflect in your account.
                </p>
            </div>

            <Button className="w-full bg-green-600 hover:bg-green-700 text-lg py-6" disabled={!canSubmit || isSubmitting} onClick={handleSubmit}>
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                Submit Withdrawal Request
            </Button>
            
             <InfoDialog 
                open={dialogState.open} 
                onClose={() => setDialogState({ ...dialogState, open: false })} 
                title={dialogState.title}
                message={dialogState.message} 
            />
        </div>
    );
}
