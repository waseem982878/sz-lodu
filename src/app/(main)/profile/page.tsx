
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Gamepad2, Gift, Pencil, LogOut, Loader2, ShieldQuestion, UserCheck, TrendingUp, TrendingDown, Star, Wallet, ChevronRight, X, Save, CircleUserRound } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { UserProfile } from "@/models/user.model";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { updateUserProfile } from "@/services/user-service";

type MetricProps = {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
};

function MetricCard({ icon: Icon, label, value, color = "text-primary" }: MetricProps) {
  return (
    <div className="bg-muted/50 p-3 rounded-lg text-center flex-1">
      <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function KycSection({ kycStatus }: { kycStatus: UserProfile['kycStatus'] }) {
    const router = useRouter();
    const handleKycClick = () => {
        router.push('/profile/kyc');
    }

    const statusMap = {
        'Verified': { text: 'KYC Verified', color: 'text-green-600 dark:text-green-400', icon: <CheckCircle2 className="h-4 w-4" /> },
        'approved': { text: 'KYC Verified', color: 'text-green-600 dark:text-green-400', icon: <CheckCircle2 className="h-4 w-4" /> },
        'Pending': { text: 'KYC Pending', color: 'text-yellow-600 dark:text-yellow-400', icon: <Loader2 className="h-4 w-4 animate-spin" /> },
        'pending': { text: 'KYC Pending', color: 'text-yellow-600 dark:text-yellow-400', icon: <Loader2 className="h-4 w-4 animate-spin" /> },
        'Rejected': { text: 'KYC Rejected', color: 'text-red-600 dark:text-red-400', icon: <ShieldQuestion className="h-4 w-4"/> },
        'rejected': { text: 'KYC Rejected', color: 'text-red-600 dark:text-red-400', icon: <ShieldQuestion className="h-4 w-4"/> },
        'Not Verified': { text: 'Verify Your KYC', color: 'text-red-600 dark:text-red-400', icon: <ShieldQuestion className="h-4 w-4"/> },
        'none': { text: 'Verify Your KYC', color: 'text-red-600 dark:text-red-400', icon: <ShieldQuestion className="h-4 w-4"/> },
    };
    
    // Fallback for any unexpected or nullish status
    const currentStatus = statusMap[kycStatus as keyof typeof statusMap] || statusMap['none'];

    return (
        <div className={`border border-current p-3 rounded-lg flex justify-between items-center ${currentStatus.color}`}>
            <div>
                <p className="text-sm">KYC Status</p>
                <div className="flex items-center gap-1 font-bold">
                    {currentStatus.icon}
                    <span>{currentStatus.text}</span>
                </div>
            </div>
            <Button variant="outline" className="border-current hover:bg-current/10 h-8" onClick={handleKycClick}>
              <UserCheck className="mr-2 h-4 w-4" />
              {(kycStatus === 'Verified' || kycStatus === 'approved') ? 'View' : kycStatus === 'Pending' ? 'Status' : 'Start'}
            </Button>
        </div>
    )
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading, logout } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (userProfile) {
        setDisplayName(userProfile.displayName || "");
    }
  }, [userProfile]);

  if (authLoading || !userProfile || !user) {
    return (
        <div className="flex justify-center items-center h-full py-10">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    )
  }

  const handleEditToggle = () => {
    if(isEditing) {
       setDisplayName(userProfile.displayName || "");
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    if (!user || !displayName.trim()) {
        alert("Display name cannot be empty.");
        return;
    }

    if (displayName.trim() === userProfile.displayName) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
        await updateUserProfile(user.uid, { displayName: displayName.trim() });
        setIsEditing(false);
    } catch (e) {
        console.error("Error saving profile:", e);
        alert("Could not save profile. Please try again.");
    } finally {
        setIsSaving(false);
    }
  };

  const winRate = userProfile.gamesPlayed > 0 ? Math.round((userProfile.gamesWon / userProfile.gamesPlayed) * 100) : 0;

  return (
    <div className="space-y-4 pb-10">
      <Card>
        <CardHeader className="text-center relative pt-4 pb-2">
          <div className="absolute top-2 right-2">
             <Button variant="ghost" size="icon" onClick={handleEditToggle} className="h-8 w-8">
                {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
             </Button>
          </div>
          
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center rounded-full border-4 border-primary bg-primary/10">
             <CircleUserRound className="w-12 h-12 text-primary" />
          </div>
          
          {isEditing ? (
            <div className="mt-2">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="text-center text-xl font-semibold h-9"
                disabled={isSaving}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {displayName.length}/50
              </p>
            </div>
          ) : (
            <CardTitle className="mt-2 text-xl">{displayName || "User"}</CardTitle>
          )}
          
          <CardDescription className="text-xs">{user.phoneNumber || user.email}</CardDescription>
        </CardHeader>
        
        <CardContent className="px-4 pb-4">
          <KycSection kycStatus={userProfile.kycStatus} />
        </CardContent>
      </Card>
      
        <div className="grid grid-cols-2 gap-2">
           <Link href="/wallet" className="no-underline group col-span-2">
                <Card className="bg-gradient-to-br from-red-500 to-primary text-primary-foreground p-3 flex justify-between items-center transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-0.5 h-[72px] relative overflow-hidden">
                    <div className="space-y-0">
                        <p className="font-bold text-md">My Wallet</p>
                        <p className="text-xl font-bold tracking-wider">₹{(userProfile.depositBalance + userProfile.winningsBalance).toFixed(2)}</p>
                    </div>
                     <div className="flex items-center gap-1">
                       <p className="text-xs opacity-80 group-hover:opacity-100">History</p>
                       <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                   </div>
                   <Wallet className="absolute h-20 w-20 -right-4 -bottom-4 text-white/10" />
              </Card>
            </Link>
             <Link href="/refer" className="no-underline group col-span-2">
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-primary-foreground p-3 flex justify-between items-center transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-0.5 h-[72px] relative overflow-hidden">
                     <div className="space-y-0">
                        <p className="font-bold text-md">Refer & Earn</p>
                        <p className="text-xs opacity-90">Invite friends & get bonus!</p>
                    </div>
                     <div className="flex items-center gap-1">
                       <p className="text-xs opacity-80 group-hover:opacity-100">Share</p>
                       <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                   </div>
                   <Gift className="absolute h-20 w-20 -right-4 -bottom-4 text-white/10" />
                </Card>
            </Link>
        </div>


        <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-primary text-lg">Game Stats</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
               <div className="flex justify-around gap-2 mb-2">
                 <MetricCard icon={Gamepad2} label="Played" value={userProfile.gamesPlayed} />
                 <MetricCard icon={CheckCircle2} label="Won" value={userProfile.gamesWon} color="text-green-500" />
                 <MetricCard icon={TrendingUp} label="Win Rate" value={`${winRate}%`} color="text-yellow-500" />
               </div>
                <div className="flex justify-around gap-2">
                 <MetricCard icon={TrendingUp} label="Win Streak" value={userProfile.winStreak || 0} color="text-green-500" />
                 <MetricCard icon={TrendingDown} label="Lose Streak" value={userProfile.losingStreak || 0} color="text-red-500" />
                 <MetricCard icon={Star} label="Biggest Win" value={`₹${userProfile.biggestWin || 0}`} color="text-yellow-500" />
               </div>
            </CardContent>
        </Card>
        
        {isEditing && (
             <Button onClick={handleSaveProfile} className="w-full" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                Save Changes
            </Button>
        )}

         <Button variant="outline" className="w-full" onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            LOG OUT
         </Button>

    </div>
  );
}
