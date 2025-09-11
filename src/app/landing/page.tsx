
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Crown, Users, Coins, Dice5, UserPlus, Swords, Trophy, Banknote, ArrowDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";


const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <Card className="feature-card text-center p-6 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-primary/20 shadow-lg border">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
            <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </Card>
);

const HowToPlayCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
     <div className="text-center p-4">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border-2 border-primary text-primary mx-auto mb-4">
            <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
)

const ScreenshotCard = ({ src, alt, "data-ai-hint": dataAiHint }: { src: string, alt: string, "data-ai-hint": string }) => (
     <div className="overflow-hidden rounded-xl border shadow-lg transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-primary/20">
        <Image src={src} alt={alt} width={400} height={700} className="w-full h-auto object-cover" data-ai-hint={dataAiHint} />
    </div>
)

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
        <div className="bg-background text-foreground font-sans">
            <header className="relative text-center py-24 md:py-32 px-4 bg-red-50">
                <div className="relative z-10">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-primary">SZ LUDO</h1>
                    <p className="text-lg md:text-xl mt-4 max-w-2xl mx-auto text-muted-foreground">The Ultimate Real Money Ludo Experience</p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                             className="text-lg py-6 px-8 rounded-full font-semibold transition-all duration-300 hover:scale-105"
                             onClick={handleInstallClick}
                        >
                            <ArrowDown className="mr-2 h-5 w-5"/>
                            Download App
                        </Button>
                        <Button
                             asChild
                             variant="outline"
                             className="text-lg py-6 px-8 rounded-full font-semibold transition-all duration-300 hover:bg-accent hover:scale-105"
                        >
                           <Link href="/login">Play on Web</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto">
                <section className="py-16 md:py-24 px-4">
                     <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-primary">
                        Why Choose SZ Ludo?
                     </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        <FeatureCard icon={Dice5} title="Classic Ludo" description="Enjoy the traditional Ludo experience with a modern design." />
                        <FeatureCard icon={Crown} title="Win Rewards" description="Play and win exciting cash prizes every day." />
                        <FeatureCard icon={Users} title="Multiplayer" description="Challenge your friends and players worldwide." />
                        <FeatureCard icon={Coins} title="Earn Coins" description="Collect coins and unlock premium features." />
                    </div>
                </section>
                
                 <section className="py-16 md:py-24 px-4 text-center bg-muted/40 rounded-xl">
                     <h2 className="text-3xl md:text-4xl font-bold mb-12 text-primary">
                        How to Get Started
                     </h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 items-start">
                        <HowToPlayCard icon={UserPlus} title="1. Create Account" description="Quickly sign up with your details to create a secure profile."/>
                        <HowToPlayCard icon={Swords} title="2. Join a Battle" description="Choose an ongoing battle or create your own challenge to play."/>
                        <HowToPlayCard icon={Trophy} title="3. Play & Win" description="Use your Ludo skills to defeat your opponent and win real prizes."/>
                        <HowToPlayCard icon={Banknote} title="4. Withdraw Winnings" description="Instantly withdraw your winnings to your bank account or UPI."/>
                     </div>
                </section>

                <section className="py-16 md:py-24 px-4 text-center">
                     <h2 className="text-3xl md:text-4xl font-bold mb-12 text-primary">
                        Glimpse of the Action
                     </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                       <ScreenshotCard src="https://picsum.photos/seed/szludo1/400/700" alt="App Screenshot 1" data-ai-hint="app screenshot" />
                       <ScreenshotCard src="https://picsum.photos/seed/szludo2/400/700" alt="App Screenshot 2" data-ai-hint="app gameplay" />
                       <ScreenshotCard src="https://picsum.photos/seed/szludo3/400/700" alt="App Screenshot 3" data-ai-hint="app wallet" />
                    </div>
                </section>

                <section className="py-16 md:py-24 px-4 max-w-3xl mx-auto">
                     <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-primary">
                        Frequently Asked Questions
                     </h2>
                     <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="font-semibold">Is my money safe?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                            Absolutely. We use industry-standard security and encryption for all transactions. Your funds are kept in a secure wallet, and withdrawals are processed through verified channels.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="font-semibold">How do I withdraw my winnings?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                            Once your winnings are in your wallet, you can go to the 'Wallet' section, click on 'Withdraw', and enter your bank or UPI details. Withdrawals are typically processed within 24 hours.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger className="font-semibold">What happens if there's a dispute in a game?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                            If there is any dispute, please submit the game result with a screenshot of the final screen. Our support team will review the evidence from both players and ensure a fair outcome. Dishonesty will lead to an account ban.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </section>
            </main>

            <footer className="bg-muted/40 py-8 px-4 text-center mt-16">
                 <div className="container mx-auto">
                    <div className="flex justify-center gap-6 mb-4">
                        <Link href="/terms" className="text-muted-foreground hover:text-primary">Terms & Conditions</Link>
                        <Link href="/privacy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link>
                        <Link href="/refund" className="text-muted-foreground hover:text-primary">Refund Policy</Link>
                    </div>
                    <p className="text-muted-foreground">&copy; {new Date().getFullYear()} SZ LUDO. All rights reserved.</p>
                    <div className="mt-4 text-xs text-muted-foreground max-w-3xl mx-auto">
                        <p>This game involves an element of financial risk and may be addictive. Please play responsibly and at your own risk. This game is intended for users 18 years or older.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

    