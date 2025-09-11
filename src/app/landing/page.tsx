
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Crown, Users, Coins, Dice5, UserPlus, Swords, Trophy, Banknote, HelpCircle, ShieldCheck, Bank, ArrowDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="feature-card bg-black/20 rounded-2xl p-6 text-center transition-all duration-300 hover:transform hover:-translate-y-2 hover:border-primary hover:shadow-2xl hover:shadow-primary/30 border-2 border-transparent">
        <Icon className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
    </div>
);

const HowToPlayCard = ({ icon: Icon, title, description, delay }: { icon: React.ElementType, title: string, description: string, delay: number }) => (
     <div className="text-center p-4">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 border-2 border-primary text-primary mx-auto mb-4">
            <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
    </div>
)

const ScreenshotCard = ({ src, alt, "data-ai-hint": dataAiHint }: { src: string, alt: string, "data-ai-hint": string }) => (
     <div className="overflow-hidden rounded-xl border-2 border-primary/30 shadow-lg transition-all duration-300 hover:transform hover:-translate-y-2 hover:border-primary hover:shadow-2xl hover:shadow-primary/30">
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
        <div className="bg-gradient-to-br from-primary/80 via-black to-black text-white font-sans">
            <header className="relative text-center py-24 md:py-32 px-4 bg-[url('https://i.ibb.co/xJCfX2P/ludo-bg.png')] bg-center bg-cover">
                <div className="absolute inset-0 bg-black/60 z-0"></div>
                <div className="relative z-10">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight" style={{textShadow: '0 0 20px hsl(var(--primary))'}}>SZ LUDO</h1>
                    <p className="text-lg md:text-xl mt-4 max-w-2xl mx-auto text-gray-300">The Ultimate Real Money Ludo Experience</p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                             className="text-lg py-6 px-8 rounded-full font-semibold border-2 border-primary bg-primary/20 text-white backdrop-blur-sm transition-all duration-300 hover:bg-primary hover:scale-105 hover:shadow-lg hover:shadow-primary/50"
                             onClick={handleInstallClick}
                        >
                            <ArrowDown className="mr-2 h-5 w-5"/>
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
                     <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center" style={{textShadow: '0 0 15px hsl(var(--primary))'}}>
                        Why Choose SZ Ludo?
                     </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        <FeatureCard icon={Dice5} title="Classic Ludo" description="Enjoy the traditional Ludo experience with a modern design." />
                        <FeatureCard icon={Crown} title="Win Rewards" description="Play and win exciting cash prizes every day." />
                        <FeatureCard icon={Users} title="Multiplayer" description="Challenge your friends and players worldwide." />
                        <FeatureCard icon={Coins} title="Earn Coins" description="Collect coins and unlock premium features." />
                    </div>
                </section>
                
                 <section className="py-16 md:py-24 px-4 container mx-auto text-center">
                     <h2 className="text-3xl md:text-4xl font-bold mb-12" style={{textShadow: '0 0 15px hsl(var(--primary))'}}>
                        How to Get Started
                     </h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 items-start">
                        <HowToPlayCard icon={UserPlus} title="1. Create Account" description="Quickly sign up with your details to create a secure profile." delay={0}/>
                        <HowToPlayCard icon={Swords} title="2. Join a Battle" description="Choose an ongoing battle or create your own challenge to play." delay={100}/>
                        <HowToPlayCard icon={Trophy} title="3. Play & Win" description="Use your Ludo skills to defeat your opponent and win real prizes." delay={200}/>
                        <HowToPlayCard icon={Banknote} title="4. Withdraw Winnings" description="Instantly withdraw your winnings to your bank account or UPI." delay={300}/>
                     </div>
                </section>

                <section className="py-16 md:py-24 px-4 container mx-auto text-center">
                     <h2 className="text-3xl md:text-4xl font-bold mb-12" style={{textShadow: '0 0 15px hsl(var(--primary))'}}>
                        Glimpse of the Action
                     </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                       <ScreenshotCard src="https://picsum.photos/seed/szludo1/400/700" alt="App Screenshot 1" data-ai-hint="app screenshot" />
                       <ScreenshotCard src="https://picsum.photos/seed/szludo2/400/700" alt="App Screenshot 2" data-ai-hint="app gameplay" />
                       <ScreenshotCard src="https://picsum.photos/seed/szludo3/400/700" alt="App Screenshot 3" data-ai-hint="app wallet" />
                    </div>
                </section>

                <section className="py-16 md:py-24 px-4 container mx-auto max-w-3xl">
                     <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center" style={{textShadow: '0 0 15px hsl(var(--primary))'}}>
                        Frequently Asked Questions
                     </h2>
                     <Accordion type="single" collapsible className="w-full bg-black/20 rounded-xl p-4">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Is my money safe?</AccordionTrigger>
                            <AccordionContent className="text-gray-400">
                            Absolutely. We use industry-standard security and encryption for all transactions. Your funds are kept in a secure wallet, and withdrawals are processed through verified channels.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>How do I withdraw my winnings?</AccordionTrigger>
                            <AccordionContent className="text-gray-400">
                            Once your winnings are in your wallet, you can go to the 'Wallet' section, click on 'Withdraw', and enter your bank or UPI details. Withdrawals are typically processed within 24 hours.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>What happens if there's a dispute in a game?</AccordionTrigger>
                            <AccordionContent className="text-gray-400">
                            If there is any dispute, please submit the game result with a screenshot of the final screen. Our support team will review the evidence from both players and ensure a fair outcome. Dishonesty will lead to an account ban.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </section>
            </main>

            <footer className="bg-black/30 py-8 px-4 text-center">
                <div className="flex justify-center gap-6 mb-4">
                    <Link href="/terms" className="text-gray-400 hover:text-white">Terms & Conditions</Link>
                    <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link>
                    <Link href="/refund" className="text-gray-400 hover:text-white">Refund Policy</Link>
                </div>
                <p>&copy; {new Date().getFullYear()} SZ LUDO. All rights reserved.</p>
                <div className="mt-4 text-xs text-gray-400 max-w-3xl mx-auto">
                    <p>This game involves an element of financial risk and may be addictive. Please play responsibly and at your own risk. This game is intended for users 18 years or older.</p>
                </div>
            </footer>
        </div>
    );
}

    