"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/firebase/config";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone } from "lucide-react";
import { FaShieldAlt } from "react-icons/fa";
import Link from "next/link";

// Add a global property to the window object for reCAPTCHA
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export default function LoginPage() {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const router = useRouter();

    const setupRecaptcha = () => {
        // It's important to only create the verifier once.
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': () => {
                    // reCAPTCHA solved, allow signInWithPhoneNumber.
                    console.log("reCAPTCHA solved");
                },
                 'expired-callback': () => {
                    // Response expired. Ask user to solve reCAPTCHA again.
                    console.log("reCAPTCHA expired");
                }
            });
        }
    }

    const onSignInSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone || phone.length !== 10) {
            alert("Please enter a valid 10-digit phone number.");
            return;
        }
        setLoading(true);
        setupRecaptcha();
        const fullPhoneNumber = `+91${phone}`;
        const appVerifier = window.recaptchaVerifier;

        try {
            const confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
            window.confirmationResult = confirmationResult;
            setShowOtp(true);
            alert("OTP sent successfully!");
        } catch (error) {
            console.error("Error during OTP sending:", error);
            alert("Failed to send OTP. Please check your phone number and try again.");
             // Reset reCAPTCHA UI
            if ((window as any).grecaptcha) {
                (window as any).grecaptcha.reset();
            }
        } finally {
            setLoading(false);
        }
    };

    const onOtpVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            alert("Please enter a valid 6-digit OTP.");
            return;
        }
        if (!window.confirmationResult) {
            alert("Verification session expired. Please request a new OTP.");
            setShowOtp(false);
            return;
        }
        setLoading(true);
        try {
            await window.confirmationResult.confirm(otp);
            // On successful confirmation, the onAuthStateChanged listener in AuthProvider
            // will detect the user and handle redirection. No need to router.push here.
        } catch (error) {
            console.error("Error during OTP verification:", error);
            alert("Invalid OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
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
                        {showOtp ? "Enter OTP" : "Login or Sign Up"}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {showOtp ? `We've sent a 6-digit code to +91 ${phone}` : "Enter your phone number to continue"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!showOtp ? (
                        <form onSubmit={onSignInSubmit}>
                            <div className="space-y-4">
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
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Send OTP
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={onOtpVerify}>
                            <div className="space-y-4">
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
                            </div>
                        </form>
                    )}
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
