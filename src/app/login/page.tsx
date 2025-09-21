
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from '@/firebase/config';
import { createUserProfile } from '@/services/user-agent-service';
import { useAuth } from '@/contexts/auth-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, LogIn, UserPlus, Mail, KeyRound, User, Phone, Gift, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Custom Error Dialog Component
function InfoDialog({ open, onClose, title, message }: { open: boolean, onClose: () => void, title: string, message: string }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <ShieldAlert className="text-destructive" />
            {title}
          </DialogTitle>
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [dialogState, setDialogState] = useState({ open: false, title: '', message: '' });
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  
  const { user, loading: authLoading } = useAuth();

  const showDialog = (title: string, message: string) => {
    if (dialogState.open) return;
    setDialogState({ open: true, title, message });
  };

  const handleAuthAction = async () => {
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name || !email || !password || !phoneNumber) {
          throw new Error('Please fill all required fields.');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        await updateProfile(firebaseUser, { displayName: name });
        // Profile creation now happens here. AuthProvider will pick it up.
        await createUserProfile(firebaseUser, name, phoneNumber, referralCode.trim());
        
        // No need to show success dialog, AuthProvider will redirect.
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        // Successful login is handled by the AuthProvider's redirection logic.
      }
    } catch (err: any) {
      let friendlyMessage = "An unexpected error occurred. Please try again.";
      switch (err.code) {
        case 'auth/email-already-in-use':
          friendlyMessage = "This email address is already in use. Please log in or use a different email.";
          break;
        case 'auth/invalid-email':
          friendlyMessage = "The email address you entered is not valid. Please check and try again.";
          break;
        case 'auth/weak-password':
          friendlyMessage = "The password is too weak. It must be at least 6 characters long.";
          break;
        case 'auth/invalid-credential':
          friendlyMessage = "Invalid credentials. Please check your email and password.";
          break;
        default:
          friendlyMessage = err.message || friendlyMessage;
          break;
      }
      showDialog("Authentication Failed", friendlyMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordReset = async () => {
      setResetLoading(true);
      setResetMessage('');
      try {
          await sendPasswordResetEmail(auth, forgotPasswordEmail);
          setResetMessage('Password reset link sent! Check your email (including spam folder).');
      } catch (err: any) {
           let friendlyMessage = "Could not send reset email. Please try again later.";
            if (err.code === 'auth/invalid-email') {
                friendlyMessage = "No user found with this email address.";
            }
           setResetMessage(friendlyMessage);
      } finally {
          setResetLoading(false);
      }
  }

  // AuthProvider shows a global loader, so we can return null here to avoid flicker.
  if (authLoading || user) {
     return null; 
  }

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-2xl border-t-4 border-primary">
          <CardHeader className="text-center">
              <div className="flex justify-center items-center mb-2">
                  <span className="text-4xl font-bold text-primary font-heading">SZ LUDO</span>
              </div>
            <CardTitle className="text-2xl text-primary">{isSignUp ? 'Create Your Account' : 'Welcome Back!'}</CardTitle>
            <CardDescription>{isSignUp ? 'Join the community and start winning!' : 'Login to your account to continue'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleAuthAction(); }} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      className="pl-10"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Mobile Number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={loading}
                      className="pl-10"
                      required
                    />
                  </div>
                   <div className="relative">
                    <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Referral Code (Optional)"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      disabled={loading}
                      className="pl-10"
                    />
                  </div>
                </>
              )}
              <div className="relative">
                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                  required
                />
              </div>
               <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pl-10"
                    required
                  />
              </div>

               {!isSignUp && (
                <div className="flex justify-end -mt-2">
                    <Button type="button" variant="link" size="sm" onClick={() => { setResetMessage(''); setForgotPasswordEmail(''); setShowForgotPasswordDialog(true); }}>
                        Forgot Password?
                    </Button>
                </div>
              )}

              <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isSignUp ? <UserPlus className="mr-2 h-5 w-5" /> : <LogIn className="mr-2 h-5 w-5" />)}
                {isSignUp ? 'Create Account' : 'Login'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <Button variant="link" onClick={() => { setIsSignUp(!isSignUp); }} className="font-semibold">
                {isSignUp ? 'Login Here' : 'Create an Account'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <InfoDialog 
            open={dialogState.open} 
            onClose={() => setDialogState({ ...dialogState, open: false })} 
            title={dialogState.title}
            message={dialogState.message} 
        />
      </div>

      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="text-primary">Reset Password</DialogTitle>
                <DialogDescription>
                    Enter your email address and we'll send you a link to reset your password.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input 
                        id="reset-email" 
                        type="email" 
                        placeholder="you@example.com" 
                        value={forgotPasswordEmail}
                        onChange={e => setForgotPasswordEmail(e.target.value)}
                    />
                </div>
                {resetMessage && <p className="text-sm text-center text-muted-foreground">{resetMessage}</p>}
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handlePasswordReset} disabled={resetLoading || !forgotPasswordEmail}>
                    {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
