
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Star, Users } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
    const router = useRouter();

    const handleInstallClick = () => {
        // Set a flag in localStorage to indicate the user has "installed" or passed the landing page
        try {
            localStorage.setItem('appInstalled', 'true');
        } catch (error) {
            console.error("Could not save to localStorage", error);
        }
        // Redirect to the main app (login page)
        router.push('/login');
    };
    
    // In case a user who has already "installed" navigates here directly
    useEffect(() => {
        try {
             if (localStorage.getItem('appInstalled') === 'true') {
                router.replace('/login');
            }
        } catch(error) {
            // Ignore localStorage errors on server or in restricted environments
        }
    }, [router]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
            <main className="flex-grow flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-2xl border-t-4 border-primary">
                    <CardContent className="p-6 text-center space-y-6">
                        <div className="flex justify-center items-center mb-2">
                           <span className="text-4xl font-bold text-primary font-heading">SZ LUDO</span>
                        </div>
                        
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                            Play Ludo, Win Real Cash!
                        </h1>

                        <p className="text-muted-foreground">
                            Join thousands of players in exciting Ludo battles and turn your skills into real money.
                        </p>

                        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden my-4">
                             <Image 
                                src="/ludo-classic.png" 
                                alt="Ludo game" 
                                layout="fill" 
                                objectFit="cover"
                                priority
                            />
                        </div>

                        <div className="flex justify-around items-center text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                <span>1M+ Players</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="h-5 w-5 text-yellow-500" />
                                <span>4.5 Rating</span>
                            </div>
                        </div>

                        <Button 
                            className="w-full text-lg py-6 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300"
                            onClick={handleInstallClick}
                        >
                            <Download className="mr-3 h-6 w-6" />
                            Download App & Get Started
                        </Button>
                    </CardContent>
                </Card>
            </main>
             <footer className="text-center py-4 text-xs text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} SZ LUDO. All rights reserved.</p>
                 <p className="mt-1">This game involves an element of financial risk and may be addictive. Please play responsibly.</p>
            </footer>
        </div>
    );
}
