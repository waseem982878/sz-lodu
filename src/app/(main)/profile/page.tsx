
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Gamepad2, Gift, Pencil, LogOut, Loader2, ShieldQuestion, UserCheck, TrendingUp, TrendingDown, Star, Wallet, ChevronRight, X, Save, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import type { UserProfile } from "@/models/user.model";
import Link from "next/link";
import imagePaths from '@/lib/image-paths.json';
import { useAuth } from "@/contexts/auth-context";
import { uploadImage } from "@/services/storage-service";
import { updateUserProfile } from "@/services/user-agent-service";


type MetricProps = {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
};

function MetricCard({ icon: Icon, label, value, color = "text-primary" }: MetricProps) {
  return (
    <div className="bg-muted/50 p-3 rounded-lg text-center flex-1">
      <Icon className={`h-6 w-6 mx-auto mb-1 ${color}`} />
      <p className="text-xl font-bold">{value}</p>
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
        'Pending': { text: 'KYC Pending', color: 'text-yellow-600 dark:text-yellow-400', icon: <Loader2 className="h-4 w-4 animate-spin" /> },
        'Not Verified': { text: 'Verify Your KYC', color: 'text-red-600 dark:text-red-400', icon: <ShieldQuestion className="h-4 w-4"/> },
        'Rejected': { text: 'KYC Rejected', color: 'text-red-600 dark:text-red-400', icon: <ShieldQuestion className="h-4 w-4"/> },
    }
    
    const currentStatus = statusMap[kycStatus];

    return (
        <div className={`border border-current p-3 rounded-lg flex justify-between items-center ${currentStatus.color}`}>
            <div>
                <p className="text-sm">KYC Status</p>
                <div className="flex items-center gap-1 font-bold">
                    {currentStatus.icon}
                    <span>{currentStatus.text}</span>
                </div>
            </div>
            <Button variant="outline" className="border-current hover:bg-current/10" onClick={handleKycClick}>
              <UserCheck className="mr-2 h-4 w-4" />
              {kycStatus === 'Verified' ? 'View Details' : kycStatus === 'Pending' ? 'Check Status' : 'Start KYC'}
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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (userProfile) {
        setDisplayName(userProfile.name);
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
       setDisplayName(userProfile.name);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    if (!user || !displayName.trim()) return;

    if (displayName.trim() === userProfile.name) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
        await updateUserProfile(user.uid, { name: displayName.trim() });
        setIsEditing(false);
    } catch (e) {
        alert("Could not save profile. Please try again.");
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file (JPEG, PNG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setAvatarUploading(true);
    
    try {
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `avatar_${timestamp}.${fileExtension}`;
      
      const avatarUrl = await uploadImage(file, `avatars/${user.uid}/${fileName}`);
      await updateUserProfile(user.uid, { avatarUrl });
      
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      alert(error.message || "Failed to upload avatar. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  };


  const winRate = userProfile.gamesPlayed > 0 ? Math.round((userProfile.gamesWon / userProfile.gamesPlayed) * 100) : 0;


  return (
    <div className="space-y-6 pb-10">
      <Card>
        <CardHeader className="text-center relative">
          <div className="absolute top-4 right-4">
             <Button variant="ghost" size="icon" onClick={handleEditToggle} disabled={avatarUploading}>
                {isEditing ? <X className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
             </Button>
          </div>
          
          <div className="relative w-24 h-24 mx-auto">
            <div className="relative w-full h-full">
              {avatarUploading ? (
                <div className="w-full h-full rounded-full border-4 border-primary flex items-center justify-center bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Image 
                  src={userProfile.avatarUrl || '/default-avatar.png'} 
                  alt="User Avatar" 
                  width={96} 
                  height={96} 
                  className="rounded-full border-4 border-primary object-cover" 
                  priority
                  onError={(e) => {
                    e.currentTarget.src = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(userProfile.name)}`;
                  }}
                />
              )}
            </div>
            
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarChange}
              className="hidden"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={avatarUploading}
            />
            
            <Button 
              size="icon" 
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
            >
              {avatarUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {isEditing ? (
            <div className="mt-4">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="text-center text-2xl font-semibold"
                disabled={isSaving}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {displayName.length}/50 characters
              </p>
            </div>
          ) : (
            <CardTitle className="mt-4">{displayName}</CardTitle>
          )}
          
          <CardDescription>{user.phoneNumber || user.email}</CardDescription>
        </CardHeader>
        
        <CardContent className="px-4 pb-4">
          <KycSection kycStatus={userProfile.kycStatus} />
        </CardContent>
      </Card>
      
        <div className="grid grid-cols-2 gap-4">
           <Link href="/wallet" className="no-underline group col-span-2">
                <Card className="bg-gradient-to-br from-red-500 to-primary text-primary-foreground p-4 flex justify-between items-center transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 h-[88px] relative overflow-hidden">
                    <div className="space-y-1">
                        <p className="font-bold text-lg">My Wallet</p>
                        <p className="text-2xl font-bold tracking-wider">₹{(userProfile.depositBalance + userProfile.winningsBalance).toFixed(2)}</p>
                    </div>
                     <div className="flex items-center gap-2">
                       <p className="text-sm opacity-80 group-hover:opacity-100">View History</p>
                       <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                   </div>
                   <Wallet className="absolute h-24 w-24 -right-4 -bottom-4 text-white/10" />
              </Card>
            </Link>
             <Link href="/refer" className="no-underline group col-span-2">
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-primary-foreground p-4 flex justify-between items-center transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 h-[88px] relative overflow-hidden">
                     <div className="space-y-1">
                        <p className="font-bold text-lg">Refer & Earn</p>
                        <p className="text-xs opacity-90">Invite friends & get bonus!</p>
                    </div>
                     <div className="flex items-center gap-2">
                       <p className="text-sm opacity-80 group-hover:opacity-100">Share Now</p>
                       <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                   </div>
                   <Gift className="absolute h-24 w-24 -right-4 -bottom-4 text-white/10" />
                </Card>
            </Link>
        </div>


        <Card>
            <CardHeader><CardTitle className="text-primary">Game Stats</CardTitle></CardHeader>
            <CardContent>
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
