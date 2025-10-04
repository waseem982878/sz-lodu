import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const AuthForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleGoogleAuth = async () => {
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-4">{isLogin ? 'Login' : 'Sign Up'}</h2>
            <form onSubmit={handleEmailAuth}>
                <div className="mb-4">
                    <Input 
                        type="email" 
                        placeholder="Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                </div>
                <div className="mb-4">
                    <Input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                </div>
                <Button type="submit" className="w-full mb-2">{isLogin ? 'Login' : 'Sign Up'}</Button>
            </form>
            
            <Button variant="outline" onClick={() => setIsLogin(!isLogin)} className="w-full mb-4">
                {isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'}
            </Button>

            <Button onClick={handleGoogleAuth} className="w-full">
                Sign in with Google
            </Button>

            {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
    );
};

export default AuthForm;
