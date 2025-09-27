
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IndianRupee, Loader2, CreditCard, AlertTriangle, CheckCircle } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, onSnapshot, addDoc, doc } from 'firebase/firestore';
import { loadStripe } from '@stripe/stripe-js';

// Define types for product and price for type safety
interface Price {
    id: string;
    active: boolean;
    currency: string;
    unit_amount: number;
    description: string;
}

interface Product {
    id: string;
    active: boolean;
    name: string;
    description: string;
    prices: Price[];
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function DepositPage() {
    const router = useRouter();
    const { user, userProfile, loading: authLoading } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchProducts = async () => {
            setLoadingProducts(true);
            const productsQuery = query(collection(db, 'products'), where('active', '==', true));
            const querySnapshot = await getDocs(productsQuery);
            const productsData: Product[] = [];

            for (const productDoc of querySnapshot.docs) {
                const product: Partial<Product> = { id: productDoc.id, ...productDoc.data() };
                const pricesQuery = query(collection(db, 'products', productDoc.id, 'prices'), where('active', '==', true));
                const pricesSnap = await getDocs(pricesQuery);
                product.prices = pricesSnap.docs.map(priceDoc => ({ id: priceDoc.id, ...priceDoc.data() } as Price));
                if (product.prices.length > 0) {
                    productsData.push(product as Product);
                }
            }
            setProducts(productsData);
            setLoadingProducts(false);
        };

        fetchProducts();
    }, [user]);

    const handleCheckout = async (priceId: string) => {
        if (!user || isRedirecting) return;
        
        setSelectedPriceId(priceId);
        setIsRedirecting(true);

        try {
            const checkoutSessionRef = await addDoc(
                collection(db, 'users', user.uid, 'checkout_sessions'),
                {
                    price: priceId,
                    success_url: `${window.location.origin}/wallet?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: window.location.origin + '/wallet/deposit',
                }
            );

            onSnapshot(checkoutSessionRef, (snap) => {
                const { error, url } = snap.data() || {};
                if (error) {
                    alert(`An error occurred: ${error.message}`);
                    setIsRedirecting(false);
                    setSelectedPriceId(null);
                }
                if (url) {
                    window.location.assign(url);
                }
            });
        } catch (error) {
            console.error("Error creating checkout session:", error);
            alert("Could not initiate payment. Please try again.");
            setIsRedirecting(false);
            setSelectedPriceId(null);
        }
    };

    if (authLoading || !userProfile) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className='text-center text-primary'>Add Funds to Your Wallet</CardTitle>
                    <CardDescription className='text-center'>Select an amount to deposit. Payments are processed securely by Stripe.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    {loadingProducts ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    ) : products.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {products.flatMap(p => p.prices).sort((a,b) => a.unit_amount - b.unit_amount).map((price) => (
                                <Button
                                    key={price.id}
                                    variant={selectedPriceId === price.id ? "default" : "outline"}
                                    className="h-auto py-4 flex flex-col items-center justify-center text-center"
                                    onClick={() => handleCheckout(price.id)}
                                    disabled={isRedirecting}
                                >
                                    {isRedirecting && selectedPriceId === price.id ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <>
                                            <span className="text-2xl font-bold">₹{price.unit_amount / 100}</span>
                                            <span className="text-xs text-muted-foreground">{price.description || 'One-time deposit'}</span>
                                        </>
                                    )}
                                </Button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <AlertTriangle className="mx-auto h-12 w-12" />
                            <p className="mt-4">No deposit options are available at the moment.</p>
                            <p>Please check back later or contact support.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

             <Card className="border-green-500 bg-green-50">
                <CardHeader>
                    <CardTitle className="text-green-700 flex items-center gap-2"><CheckCircle className="h-5 w-5"/> Secure & Automated</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-green-600 space-y-2">
                    <p>Your payments are processed by Stripe, a global leader in online payments.</p>
                    <p>Your balance will be updated automatically as soon as the payment is successful. No need to upload screenshots!</p>
                </CardContent>
            </Card>
        </div>
    );
}
