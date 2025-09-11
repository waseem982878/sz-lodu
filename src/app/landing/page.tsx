
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Crown, Users, Coins, Dice5 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="feature-card bg-black/20 rounded-2xl p-6 text-center transition-all duration-300 hover:transform hover:-translate-y-2 hover:border-primary hover:shadow-2xl hover:shadow-primary/30 border-2 border-transparent">
        <Icon className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
    </div>
);

export default function LandingPageV2() {
    const router = useRouter();

    const handleInstallClick = () => {
        try {
            localStorage.setItem('appInstalled', 'true');
        } catch (error) {
            console.error("Could not save to localStorage", error);
        }
        router.push('/login');
    };

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
        <div className="bg-gradient-to-br from-primary/80 via-black to-black text-white font-sans">
            <header className="relative text-center py-24 md:py-32 px-4 bg-[url('https://i.ibb.co/xJCfX2P/ludo-bg.png')] bg-center bg-cover">
                <div className="absolute inset-0 bg-black/60 z-0"></div>
                <div className="relative z-10">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-shadow" style={{textShadow: '0 0 20px hsl(var(--primary))'}}>SZ LUDO</h1>
                    <p className="text-lg md:text-xl mt-4 max-w-2xl mx-auto text-gray-300">The Ultimate Real Money Ludo Experience</p>
                    <div className="mt-8 flex gap-4 justify-center">
                        <Button
                             className="text-lg py-6 px-8 rounded-full font-semibold border-2 border-primary bg-primary/20 text-white backdrop-blur-sm transition-all duration-300 hover:bg-primary hover:scale-105 hover:shadow-lg hover:shadow-primary/50"
                             onClick={handleInstallClick}
                        >
                            Download App
                        </Button>
                        <Button
                             asChild
                             variant="outline"
                             className="text-lg py-6 px-8 rounded-full font-semibold border-2 border-primary bg-black/20 text-white backdrop-blur-sm transition-all duration-300 hover:bg-primary hover:text-white hover:scale-105 hover:shadow-lg hover:shadow-primary/50"
                        >
                           <Link href="/login">Play on Web</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main>
                <section className="py-16 md:py-24 px-4 container mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        <FeatureCard icon={Dice5} title="Classic Ludo" description="Enjoy the traditional Ludo experience with a modern design." />
                        <FeatureCard icon={Crown} title="Win Rewards" description="Play and win exciting cash prizes every day." />
                        <FeatureCard icon={Users} title="Multiplayer" description="Challenge your friends and players worldwide." />
                        <FeatureCard icon={Coins} title="Earn Coins" description="Collect coins and unlock premium features." />
                    </div>
                </section>
            </main>

            <footer className="bg-black/30 py-8 px-4 text-center">
                <p>&copy; {new Date().getFullYear()} SZ LUDO. All rights reserved.</p>
                <div className="mt-4 text-xs text-gray-400">
                    <p>This game involves an element of financial risk and may be addictive. Please play responsibly and at your own risk.</p>
                </div>
            </footer>
        </div>
    );
}
