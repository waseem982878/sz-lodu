
"use client";

import { useAuth } from "@/contexts/auth-context";
import { FcGoogle } from "react-icons/fc";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/firebase/config";
import { Button } from "@/components/ui/button";

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
    return null; // Don't render anything while the auth state is loading
  }

  // If the user is logged in, and we have their profile, we don't need to show the login button.
  if (user && userProfile) {
    return null;
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <Button onClick={handleGoogleSignIn} className="flex items-center gap-2">
        <FcGoogle className="w-6 h-6" />
        Sign in with Google
      </Button>
    </div>
  );
}
