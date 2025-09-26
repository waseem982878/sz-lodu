
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import { createUserProfile } from '@/services/user-agent-service';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

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


export default function CreateProfilePage() {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [dialogState, setDialogState] = useState({ open: false, title: '', message: '' });

    const showDialog = (title: string, message: string) => {
        setDialogState({ open: true, title, message });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) {
            showDialog("Error", "Please enter your name.");
            return;
        }

        setLoading(true);
        try {
            await createUserProfile(user, name);
            // The AuthProvider will detect the profile and redirect automatically.
        } catch (error) {
            console.error("Error creating profile:", error);
            showDialog("Error", "Failed to create profile. Please try again.");
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
            <div className="text-center mb-6">
                 <Link href="/landing" className="flex items-center justify-center">
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-primary via-card-foreground to-primary bg-clip-text text-transparent animate-animate-shine bg-[length:200%_auto] font-heading">SZ LUDO</span>
                </Link>
                <p className="text-muted-foreground text-sm mt-1">Welcome! Let's get you set up.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Create Your Profile</CardTitle>
                    <CardDescription className="text-center">This name will be visible to other players.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Your Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        placeholder="Enter your full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save & Continue
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </>
    );
}

    