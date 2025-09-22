
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowDown, Banknote, MessageSquare, ShieldCheck, Star, Swords, Trophy, UserPlus, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import imagePaths from '@/lib/image-paths.json';

type LandingPageContent = {
    heroTitle: string;
    heroSubtitle: string;
    feature1Title: string;
    feature1Description: string;
    feature2Title: string;
    feature2Description: string;
    feature3Title: string;
    feature3Description: string;
    feature4Title: string;
    feature4Description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <Card className="feature-card text-center p-6 shadow-lg border">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
            <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </Card>
);

const HowToPlayCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
     <div className="text-center p-4">
        <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 border-2 border-primary text-primary mx-auto mb-4">
            <Icon className="h-10 w-10" />
        </div>
        <h3 className="text-2xl font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground text-lg">{description}</p>
    </div>
)

const ScreenshotCard = ({ src, alt, "data-ai-hint": dataAiHint }: { src: string, alt: string, "data-ai-hint": string }) => (
     <div className="overflow-hidden rounded-xl border-4 border-gray-700 shadow-2xl mx-auto">
        <Image src={src} alt={alt} width={280} height={580} className="w-full h-auto object-cover" data-ai-hint={dataAiHint} />
    </div>
)

const TestimonialCard = ({ name, text, avatarSeed }: { name: string, text: string, avatarSeed: string }) => (
    <Card className="p-8 text-center shadow-lg min-w-[300px]">
        <div className="flex justify-center mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />)}
        </div>
        <p className="text-muted-foreground mb-6 italic text-lg">"{text}"</p>
        <div className="flex items-center justify-center gap-3">
            <Image src={`https://api.dicebear.com/8.x/initials/svg?seed=${avatarSeed}`} alt={name} width={40} height={40} className="rounded-full bg-muted" />
            <p className="font-semibold text-lg">{name}</p>
        </div>
    </Card>
)

export default function LandingPage() {
    const router = useRouter();
    const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
    const content: Partial<LandingPageContent> = {
        heroTitle: "SZ LUDO",
        heroSubtitle: "The Ultimate Real Money Ludo Experience",
        feature1Title: "Secure Platform",
        feature1Description: "Your data and transactions are protected with top-tier security.",
        feature2Title: "Instant Withdrawals",
        feature2Description: "Get your winnings transferred to your account in minutes.",
        feature3Title: "24/7 Customer Support",
        feature3Description: "Our team is always here to help you with any issues.",
    };
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // This script dynamically sets the viewport just for this page
        // to achieve the "desktop view on mobile" effect.
        const viewport = document.querySelector("meta[name=viewport]");
        let originalContent: string | null = null;
        if (viewport) {
            originalContent = viewport.getAttribute('content');
            if (window.innerWidth < 1024) {
                viewport.setAttribute('content', 'width=1280');
            }
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            // Restore original viewport on component unmount
            if (viewport && originalContent) {
                viewport.setAttribute('content', originalContent);
            }
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            (deferredPrompt as any).prompt();
            await (deferredPrompt as any).userChoice;
            setDeferredPrompt(null);
        } else {
            // As there is no login, we just go to the home page for the prototype
            router.push('/home');
        }
    };
    
    return (
        <div className="bg-background text-foreground font-sans">
            {/* Hero Section */}
            <header className="py-28 px-4 bg-red-50/50">
                 <div className="container mx-auto grid grid-cols-2 items-center gap-8">
                    <div className="text-left">
                        <h1 className="text-6xl lg:text-8xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-card-foreground to-primary bg-clip-text text-transparent animate-animate-shine bg-[length:200%_auto]">{content.heroTitle || "SZ LUDO"}</h1>
                        <p className="text-2xl mt-4 max-w-2xl text-muted-foreground">{content.heroSubtitle || "The Ultimate Real Money Ludo Experience"}</p>
                        <div className="mt-8 flex flex-row gap-4 justify-start">
                            <Button
                                 className="text-lg py-6 px-8 rounded-full font-semibold"
                                 onClick={handleInstallClick}
                            >
                                <ArrowDown className="mr-2 h-5 w-5"/>
                                Download App & Play
                            </Button>
                             <Button
                                 asChild
                                 variant="outline"
                                 className="text-lg py-6 px-8 rounded-full font-semibold"
                            >
                               <Link href="/home">Play as Guest</Link>
                            </Button>
                        </div>
                    </div>
                     <div className="flex justify-center">
                         <Image src={imagePaths.landingHero.path} alt={imagePaths.landingHero.alt} width={500} height={500} className="rounded-lg shadow-2xl" />
                     </div>
                </div>
            </header>

            <main className="container mx-auto">
                 {/* Why Choose Us Section */}
                <section className="py-24 px-4">
                     <h2 className="text-5xl font-bold mb-16 text-center text-primary">
                        Why Choose SZ Ludo?
                     </h2>
                    <div className="grid grid-cols-3 gap-8">
                        <FeatureCard icon={ShieldCheck} title={content.feature1Title || "Secure Platform"} description={content.feature1Description || "Your data and transactions are protected with top-tier security."} />
                        <FeatureCard icon={Zap} title={content.feature2Title || "Instant Withdrawals"} description={content.feature2Description || "Get your winnings transferred to your account in minutes."} />
                        <FeatureCard icon={MessageSquare} title={content.feature3Title || "24/7 Customer Support"} description={content.feature3Description || "Our team is always here to help you with any issues."} />
                    </div>
                </section>
                
                 <section className="py-24 px-4 text-center bg-muted/40 rounded-xl">
                     <h2 className="text-5xl font-bold mb-16 text-primary">
                        How to Get Started
                     </h2>
                     <div className="grid grid-cols-4 items-start gap-12">
                        <HowToPlayCard icon={UserPlus} title="1. Create Account" description="Quickly sign up with your details to create a secure profile."/>
                        <HowToPlayCard icon={Swords} title="2. Join a Battle" description="Choose an ongoing battle or create your own challenge to play."/>
                        <HowToPlayCard icon={Trophy} title="3. Play & Win" description="Use your Ludo skills to defeat your opponent and win real prizes."/>
                        <HowToPlayCard icon={Banknote} title="4. Withdraw Winnings" description="Instantly withdraw your winnings to your bank account or UPI."/>
                     </div>
                </section>

                <section className="py-24 px-4 text-center">
                     <h2 className="text-5xl font-bold mb-16 text-primary">
                        Glimpse of the Action
                     </h2>
                    <div className="grid grid-cols-3 gap-12">
                       <ScreenshotCard src={imagePaths.landingScreenshot1.path} alt={imagePaths.landingScreenshot1.alt} data-ai-hint={imagePaths.landingScreenshot1['data-ai-hint']} />
                       <ScreenshotCard src={imagePaths.landingScreenshot2.path} alt={imagePaths.landingScreenshot2.alt} data-ai-hint={imagePaths.landingScreenshot2['data-ai-hint']} />
                       <ScreenshotCard src={imagePaths.landingScreenshot3.path} alt={imagePaths.landingScreenshot3.alt} data-ai-hint={imagePaths.landingScreenshot3['data-ai-hint']} />
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-24 px-4">
                     <h2 className="text-5xl font-bold mb-16 text-center text-primary">
                        What Our Players Say
                     </h2>
                    <div className="grid grid-cols-3 gap-8">
                        <TestimonialCard name="Rohan S." text="Amazing app! The withdrawals are super fast. I won ₹500 and got it in my account in 10 minutes." avatarSeed="Rohan" />
                        <TestimonialCard name="Priya K." text="Fair gameplay and a great community. I play here every day after work." avatarSeed="Priya" />
                        <TestimonialCard name="Amit G." text="The best real money Ludo app out there. The support team is also very helpful." avatarSeed="Amit" />
                    </div>
                </section>

                <section className="py-24 px-4 max-w-4xl mx-auto">
                     <h2 className="text-5xl font-bold mb-16 text-center text-primary">
                        Frequently Asked Questions
                     </h2>
                     <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="font-semibold text-xl">Is my money safe?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground text-lg">
                            Absolutely. We use industry-standard security and encryption for all transactions. Your funds are kept in a secure wallet, and withdrawals are processed through verified channels.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="font-semibold text-xl">How do I withdraw my winnings?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground text-lg">
                            Once your winnings are in your wallet, you can go to the 'Wallet' section, click on 'Withdraw', and enter your bank or UPI details. Withdrawals are typically processed within 24 hours.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger className="font-semibold text-xl">What happens if there's a dispute in a game?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground text-lg">
                            If there is any dispute, please submit the game result with a screenshot of the final screen. Our support team will review the evidence from both players and ensure a fair outcome. Dishonesty will lead to an account ban.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </section>
                
                {/* Final CTA Section */}
                <section className="py-20 px-4 text-center bg-primary text-primary-foreground rounded-xl my-24">
                    <h2 className="text-5xl font-bold mb-4">Ready to Play?</h2>
                    <p className="max-w-3xl mx-auto mb-8 text-xl">Join thousands of players and start winning real cash prizes today. The next Ludo king could be you!</p>
                     <Button
                        variant="secondary"
                        size="lg"
                        className="text-xl py-8 px-12 rounded-full font-semibold"
                        onClick={handleInstallClick}
                    >
                        Download Now & Get Started
                    </Button>
                </section>

            </main>

            <footer className="bg-muted/40 py-8 px-4 text-center mt-16">
                 <div className="container mx-auto">
                    <div className="flex flex-row gap-6 justify-center mb-4">
                        <Link href="/terms" className="text-muted-foreground hover:text-primary">Terms & Conditions</Link>
                        <Link href="/privacy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link>
                        <Link href="/refund" className="text-muted-foreground hover:text-primary">Refund Policy</Link>
                        <Link href="/gst" className="text-muted-foreground hover:text-primary">GST Policy</Link>
                    </div>
                    <p className="text-muted-foreground">&copy; {new Date().getFullYear()} SZ LUDO. All rights reserved.</p>
                    <div className="mt-4 text-xs text-muted-foreground max-w-4xl mx-auto">
                        <p>This game involves an element of financial risk and may be addictive. Please play responsibly and at your own risk. This game is intended for users 18 years or older.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
