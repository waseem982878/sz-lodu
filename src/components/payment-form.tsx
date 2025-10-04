import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PaymentForm = () => {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('upi'); // Default payment method
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (!user || !amount) {
            setError('Please enter an amount.');
            return;
        }

        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': idToken,
                },
                body: JSON.stringify({ amount: parseFloat(amount), method }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Payment failed');
            }

            setMessage(`Payment of ${data.amount} successfully processed.`);
            setAmount(''); // Reset amount after successful payment

        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-4">Make a Payment</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <Input 
                        type="number" 
                        placeholder="Amount" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        required 
                    />
                </div>
                {/* Add a payment method selector if needed */}
                <Button type="submit" className="w-full">Pay</Button>
            </form>
            {error && <p className="text-red-500 mt-4">{error}</p>}
            {message && <p className="text-green-500 mt-4">{message}</p>}
        </div>
    );
};

export default PaymentForm;
