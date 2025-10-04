"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderService } from "@/services/order.service";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { OrderItem } from "@/models/order.model";

export default function TestOrderPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCreateOrder = async () => {
        setLoading(true);
        try {
            // Sample order data
            const userId = "user_test_123"; // Replace with a real user ID in a real app
            const items: OrderItem[] = [
                { id: "prod_1", name: "Sample Product", price: 150, quantity: 1 },
                { id: "prod_2", name: "Another Item", price: 45, quantity: 2 },
            ];

            const newOrder = await OrderService.createOrder(userId, items);
            
            // Redirect to the payment page for the new order
            router.push(`/payment/${newOrder.id}`);

        } catch (error) {
            console.error("Failed to create order:", error);
            alert("Failed to create a test order. Check the console for details.");
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="max-w-md text-center">
                <h1 className="text-3xl font-bold mb-4">Test Payment System</h1>
                <p className="text-muted-foreground mb-8">
                    Click the button below to create a sample order. You will be automatically redirected to the payment page to complete the transaction.
                </p>
                <Button onClick={handleCreateOrder} disabled={loading} size="lg">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Order...
                        </>
                    ) : (
                        "Create Test Order & Proceed to Payment"
                    )}
                </Button>
            </div>
        </div>
    );
}