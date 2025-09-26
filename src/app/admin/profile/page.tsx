
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pencil, X, Save, Loader2, Mail, Phone, Calendar, CircleUserRound } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { uploadImage } from "@/services/storage-service";
import { updateUserProfile } from "@/services/user-agent-service";


export default function AdminProfilePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (userProfile) {
        setDisplayName(userProfile.name);
    }
  }, [userProfile]);

  const handleEditToggle = () => {
    if(isEditing && userProfile) {
       setDisplayName(userProfile.name); // Reset changes if cancelled
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    if (!user || !displayName.trim()) return;
    setIsSaving(true);
    try {
        await updateUserProfile(user.uid, { name: displayName.trim() });
        setIsEditing(false);
    } catch (e) {
        alert("Failed to save profile.");
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user) {
        const file = e.target.files[0];
        setIsSaving(true);
        try {
            const avatarUrl = await uploadImage(file, `avatars/${user.uid}`);
            await updateUserProfile(user.uid, { avatarUrl });
        } catch (e) {
            alert("Failed to update avatar.");
        } finally {
            setIsSaving(false);
        }
    }
  }

  if (authLoading || !userProfile || !user) {
    return (
        <div className="flex justify-center items-center h-full py-10">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="space-y-6 pb-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-primary">My Profile</h1>
      <Card>
        <CardHeader className="text-center relative">
          <div className="absolute top-4 right-4">
             <Button variant="ghost" size="icon" onClick={handleEditToggle}>
                {isEditing ? <X className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
             </Button>
          </div>
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center rounded-full border-4 border-primary bg-muted">
            <CircleUserRound className="w-16 h-16 text-muted-foreground" />
          </div>
           {isEditing ? (
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="text-center text-2xl font-semibold mt-4"
              disabled={isSaving}
            />
          ) : (
            <CardTitle className="mt-4">{displayName}</CardTitle>
          )}
          <CardDescription>{user.phoneNumber || user.email}</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
           <div className="space-y-2 mt-4 text-sm text-muted-foreground border-t pt-4">
                <p className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> <span>{userProfile.email}</span></p>
                <p className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /> <span>{userProfile.phoneNumber || "Not provided"}</span></p>
                <p className="flex items-center gap-3"><Calendar className="h-4 w-4 text-primary" /> <span>Joined on {new Date((userProfile.createdAt as any)?.seconds * 1000).toLocaleDateString()}</span></p>
            </div>
        </CardContent>
      </Card>
      
      {isEditing && (
           <Button onClick={handleSaveProfile} className="w-full" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
              Save Changes
          </Button>
      )}
    </div>
  );
}
