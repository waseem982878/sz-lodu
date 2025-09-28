
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
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
            // Success and cancel URLs are now defined in the Firebase Extension settings
            // for security and to avoid build errors.
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
        <div className="space-y-4">
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {products.flatMap(p => p.prices).sort((a,b) => a.unit_amount - b.unit_amount).map((price) => (
                                <Button
                                    key={price.id}
                                    variant={selectedPriceId === price.id ? "default" : "outline"}
                                    className="h-auto p-3 flex flex-col items-center justify-center text-center text-base"
                                    onClick={() => handleCheckout(price.id)}
                                    disabled={isRedirecting}
                                >
                                    {isRedirecting && selectedPriceId === price.id ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <>
                                            <span className="text-xl font-bold">₹{price.unit_amount / 100}</span>
                                            {price.description && <span className="text-xs text-muted-foreground mt-1">{price.description}</span>}
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

             <Card className="border-green-500 bg-green-50 dark:bg-green-900/20 p-2">
                <CardContent className="text-sm text-green-600 dark:text-green-300 space-y-1 p-2">
                    <p>✓ Your payments are processed by Stripe, a global leader in online payments.</p>
                    <p>✓ Your balance will be updated automatically as soon as the payment is successful.</p>
                </CardContent>
            </Card>
        </div>
    );
}
