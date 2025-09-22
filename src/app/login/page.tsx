
"use client";

import { useAuth } from "@/contexts/auth-context";
import { FcGoogle } from "react-icons/fc";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/firebase/config";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { user, loading, userProfile } = useAuth();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    }
  };

  if (loading) {
     return (
        <div className="flex flex-col justify-center items-center h-screen bg-background text-center p-4">
            <span className="text-4xl font-bold mb-4 text-primary font-heading">SZ LUDO</span>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }

  // If the user is logged in, and we have their profile, we don't need to show the login button.
  // The AuthProvider will handle redirection.
  if (user && userProfile) {
    return null;
  }

  return (
    <div className="flex items-center justify-center h-screen bg-background">
       <div className="text-center">
            <h1 className="text-4xl font-bold mb-8 text-primary font-heading">Welcome to SZ LUDO</h1>
            <Button onClick={handleGoogleSignIn} size="lg" className="flex items-center gap-4 py-6 text-lg">
                <FcGoogle className="w-7 h-7" />
                Sign in with Google
            </Button>
       </div>
    </div>
  );
}
