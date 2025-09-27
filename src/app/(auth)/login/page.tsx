
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase/config";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, Mail, Lock } from "lucide-react";
import { FaShieldAlt } from "react-icons/fa";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

// Add a global property to the window object for reCAPTCHA
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

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


export default function LoginPage() {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [activeTab, setActiveTab] = useState("phone");
    const [dialogState, setDialogState] = useState({ open: false, title: '', message: '' });
    const router = useRouter();
    
    const showDialog = (title: string, message: string) => {
        setDialogState({ open: true, title, message });
    };

    const onPhoneSignInSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone || phone.length !== 10) {
            showDialog("Error", "Please enter a valid 10-digit phone number.");
            return;
        }
        setLoading(true);

        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
        }

        try {
            const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
            });
            window.recaptchaVerifier = appVerifier;

            const fullPhoneNumber = `+91${phone}`;
            const confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
            window.confirmationResult = confirmationResult;
            setShowOtp(true);
            showDialog("Success", "OTP sent successfully!");

        } catch (error) {
            console.error("Error during OTP sending:", error);
            showDialog("Error", "Failed to send OTP. Please check your phone number, refresh the page, and try again.");
            // @ts-ignore
            if (window.grecaptcha && window.recaptchaVerifier && window.recaptchaVerifier.widgetId) {
                 // @ts-ignore
                window.grecaptcha.reset(window.recaptchaVerifier.widgetId);
            }
        } finally {
            setLoading(false);
        }
    };

    const onOtpVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            showDialog("Error", "Please enter a valid 6-digit OTP.");
            return;
        }
        if (!window.confirmationResult) {
            showDialog("Error", "Verification session expired. Please request a new OTP.");
            setShowOtp(false);
            return;
        }
        setLoading(true);
        try {
            await window.confirmationResult.confirm(otp);
        } catch (error) {
            console.error("Error during OTP verification:", error);
            showDialog("Error", "Invalid OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleEmailAuth = async (isSignUp: boolean) => {
        if (!email || !password) {
            showDialog("Error", "Please enter both email and password.");
            return;
        }
        setLoading(true);
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
                // AuthProvider will redirect to profile creation
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                // AuthProvider will redirect to home
            }
        } catch (error: any) {
            const errorCode = error.code;
            let friendlyMessage = "An error occurred. Please try again.";
            if (errorCode === 'auth/email-already-in-use') {
                friendlyMessage = "This email is already in use. Please log in or use a different email.";
            } else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
                friendlyMessage = "Invalid email or password. Please try again.";
            } else if (errorCode === 'auth/weak-password') {
                friendlyMessage = "The password is too weak. It should be at least 6 characters long.";
            }
            console.error("Email auth error:", error);
            showDialog("Error", friendlyMessage);
        } finally {
            setLoading(false);
        }
    }
    
    const handlePasswordReset = async () => {
        if (!email) {
            showDialog("Error", "Please enter your email address to reset your password.");
            return;
        }
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            showDialog("Success", "Password reset email sent! Please check your inbox.");
        } catch (error: any) {
            const errorCode = error.code;
            if (errorCode === 'auth/user-not-found') {
                showDialog("Error", "No user found with this email address.");
            } else {
                console.error("Password reset error:", error);
                showDialog("Error", "Failed to send password reset email. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
             <InfoDialog 
                open={dialogState.open} 
                onClose={() => setDialogState({ ...dialogState, open: false })} 
                title={dialogState.title}
                message={dialogState.message} 
            />
            <div id="recaptcha-container"></div>
            <div className="text-center mb-6">
                 <Link href="/landing" className="flex items-center justify-center">
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-primary via-card-foreground to-primary bg-clip-text text-transparent animate-animate-shine bg-[length:200%_auto] font-heading">SZ LUDO</span>
                </Link>
                <p className="text-muted-foreground text-sm mt-1">Play Ludo, Win Real Cash</p>
            </div>
            <Card className="shadow-2xl">
                 <CardHeader>
                    <CardTitle className="text-2xl text-center">
                        {activeTab === 'phone' && showOtp ? "Enter OTP" : "Login or Sign Up"}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {activeTab === 'phone' ? (showOtp ? `We've sent a 6-digit code to +91 ${phone}` : "Enter your phone number to continue") : "Use your email and password"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="phone" onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="phone">Phone</TabsTrigger>
                            <TabsTrigger value="email">Email</TabsTrigger>
                        </TabsList>
                        <TabsContent value="phone">
                             {!showOtp ? (
                                <form onSubmit={onPhoneSignInSubmit} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <div className="relative">
                                             <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm">+91 |</span>
                                            <Input 
                                                id="phone" 
                                                type="tel" 
                                                placeholder="9876543210" 
                                                value={phone} 
                                                onChange={(e) => setPhone(e.target.value)} 
                                                required
                                                className="pl-24"
                                                maxLength={10}
                                            />
                                        </div>
                                    </div>
                                    <Button id="sign-in-button" type="submit" className="w-full" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Send OTP
                                    </Button>
                                </form>
                            ) : (
                                <form onSubmit={onOtpVerify} className="space-y-4 pt-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="otp">6-Digit OTP</Label>
                                        <Input id="otp" type="tel" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6}/>
                                    </div>
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Verify OTP
                                    </Button>
                                    <Button variant="link" size="sm" className="w-full" onClick={() => {setShowOtp(false); setOtp(""); window.confirmationResult = undefined;}}>
                                        Change Number
                                    </Button>
                                </form>
                            )}
                        </TabsContent>
                        <TabsContent value="email">
                           <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10"/>
                                    </div>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                     <div className="relative">
                                         <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-10"/>
                                     </div>
                                      <div className="text-right">
                                        <Button type="button" variant="link" size="sm" className="px-0" onClick={handlePasswordReset}>
                                            Forgot Password?
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => handleEmailAuth(false)} className="w-full" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Login
                                    </Button>
                                     <Button onClick={() => handleEmailAuth(true)} variant="secondary" className="w-full" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Sign Up
                                    </Button>
                                </div>
                           </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                 <CardFooter className="flex-col text-xs text-center text-muted-foreground space-y-2">
                    <div className="flex items-center justify-center gap-1">
                        <FaShieldAlt className="text-green-600"/>
                        <span>Your information is safe and secure with us.</span>
                    </div>
                     <p>By continuing, you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
                </CardFooter>
            </Card>
        </>
    );
}

    