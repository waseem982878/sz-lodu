
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Crown, Users, Coins, Dice5, UserPlus, Swords, Trophy, Banknote, ArrowDown, ShieldCheck, Zap, MessageSquare, Star, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";


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

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: React.ElementType, title: string, description: string, delay?: number }) => (
    <Card className="feature-card text-center p-6 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-primary/20 shadow-lg border" data-aos="fade-up" data-aos-delay={delay}>
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
            <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </Card>
);

const HowToPlayCard = ({ icon: Icon, title, description, delay }: { icon: React.ElementType, title: string, description: string, delay?: number }) => (
     <div className="text-center p-4 transition-transform duration-300 hover:scale-105" data-aos="fade-up" data-aos-delay={delay}>
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border-2 border-primary text-primary mx-auto mb-4">
            <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
)

const ScreenshotCard = ({ src, alt, "data-ai-hint": dataAiHint, delay }: { src: string, alt: string, "data-ai-hint": string, delay?: number }) => (
     <div className="overflow-hidden rounded-xl border shadow-lg transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-primary/20" data-aos="fade-up" data-aos-delay={delay}>
        <Image src={src} alt={alt} width={400} height={700} className="w-full h-auto object-cover" data-ai-hint={dataAiHint} />
    </div>
)

const TestimonialCard = ({ name, text, avatarSeed, delay }: { name: string, text: string, avatarSeed: string, delay?: number }) => (
    <Card className="p-6 text-center transition-transform duration-300 hover:scale-105 hover:shadow-lg" data-aos="fade-up" data-aos-delay={delay}>
        <div className="flex justify-center mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />)}
        </div>
        <p className="text-muted-foreground mb-4 italic">"{text}"</p>
        <div className="flex items-center justify-center gap-3">
            <Image src={`https://api.dicebear.com/8.x/initials/svg?seed=${avatarSeed}`} alt={name} width={40} height={40} className="rounded-full bg-muted" />
            <p className="font-semibold">{name}</p>
        </div>
    </Card>
)

export default function LandingPageV2() {
    const router = useRouter();
    const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
    const [content, setContent] = useState<Partial<LandingPageContent>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPageData = async () => {
            // Load AOS library
            const AOS = (await import('aos')).default;
            const link = document.createElement('link');
            link.href = 'https://unpkg.com/aos@2.3.1/dist/aos.css';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            
            AOS.init({
                duration: 800,
                once: true,
            });

            // Fetch content from Firestore
            const landingRef = doc(db, 'config', 'landingPage');
            const landingSnap = await getDoc(landingRef);
            if (landingSnap.exists()) {
                setContent(landingSnap.data() as LandingPageContent);
            }
            setLoading(false);
        };
        
        loadPageData();

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        try {
             if (localStorage.getItem('appInstalled') === 'true') {
                router.replace('/login');
            }
        } catch(error) {
            // Ignore localStorage errors on server or in restricted environments
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [router]);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            (deferredPrompt as any).prompt();
            const { outcome } = await (deferredPrompt as any).userChoice;
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            setDeferredPrompt(null);
        }
        
        try {
            localStorage.setItem('appInstalled', 'true');
        } catch (error) {
            console.error("Could not save to localStorage", error);
        }

        router.push('/login');
    };
    
    if(loading) {
        return (
             <div className="flex flex-col justify-center items-center h-screen bg-background text-center p-4">
                <span className="text-4xl font-bold mb-4 text-primary font-heading">SZ LUDO</span>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="bg-background text-foreground font-sans overflow-x-hidden">
            {/* Hero Section */}
            <header className="relative py-20 md:py-28 px-4 bg-red-50/50 overflow-hidden">
                 <div className="container mx-auto grid md:grid-cols-2 gap-8 items-center">
                    <div className="text-center md:text-left" data-aos="fade-right">
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-card-foreground to-primary bg-clip-text text-transparent animate-animate-shine bg-[length:200%_auto]">{content.heroTitle || "SZ LUDO"}</h1>
                        <p className="text-lg md:text-xl mt-4 max-w-2xl mx-auto md:mx-0 text-muted-foreground">{content.heroSubtitle || "The Ultimate Real Money Ludo Experience"}</p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                            <Button
                                 className="text-base sm:text-lg py-4 px-6 sm:py-6 sm:px-8 rounded-full font-semibold transition-all duration-300 hover:scale-105"
                                 onClick={handleInstallClick}
                            >
                                <ArrowDown className="mr-2 h-5 w-5"/>
                                Download App
                            </Button>
                            <Button
                                 asChild
                                 variant="outline"
                                 className="text-base sm:text-lg py-4 px-6 sm:py-6 sm:px-8 rounded-full font-semibold transition-all duration-300 hover:bg-accent hover:scale-105"
                            >
                               <Link href="/login">Play on Web</Link>
                            </Button>
                        </div>
                    </div>
                     <div className="hidden md:flex justify-center" data-aos="fade-left">
                         <Image src="/ludo-classic.png" alt="Ludo Game" width={400} height={400} className="rounded-lg shadow-2xl transition-transform duration-500 hover:scale-110" />
                     </div>
                </div>
            </header>

            <main className="container mx-auto">
                 {/* Why Choose Us Section */}
                <section className="py-16 md:py-24 px-4">
                     <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-primary" data-aos="zoom-in">
                        Why Choose SZ Ludo?
                     </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <FeatureCard icon={ShieldCheck} title={content.feature1Title || "Secure Platform"} description={content.feature1Description || "Your data and transactions are protected with top-tier security."} delay={0} />
                        <FeatureCard icon={Zap} title={content.feature2Title || "Instant Withdrawals"} description={content.feature2Description || "Get your winnings transferred to your account in minutes."} delay={100} />
                        <FeatureCard icon={MessageSquare} title={content.feature3Title || "24/7 Customer Support"} description={content.feature3Description || "Our team is always here to help you with any issues."} delay={200} />
                    </div>
                </section>
                
                 <section className="py-16 md:py-24 px-4 text-center bg-muted/40 rounded-xl">
                     <h2 className="text-3xl md:text-4xl font-bold mb-12 text-primary" data-aos="zoom-in">
                        How to Get Started
                     </h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 items-start">
                        <HowToPlayCard icon={UserPlus} title="1. Create Account" description="Quickly sign up with your details to create a secure profile." delay={0}/>
                        <HowToPlayCard icon={Swords} title="2. Join a Battle" description="Choose an ongoing battle or create your own challenge to play." delay={100}/>
                        <HowToPlayCard icon={Trophy} title="3. Play & Win" description="Use your Ludo skills to defeat your opponent and win real prizes." delay={200}/>
                        <HowToPlayCard icon={Banknote} title="4. Withdraw Winnings" description="Instantly withdraw your winnings to your bank account or UPI." delay={300}/>
                     </div>
                </section>

                <section className="py-16 md:py-24 px-4 text-center">
                     <h2 className="text-3xl md:text-4xl font-bold mb-12 text-primary" data-aos="zoom-in">
                        Glimpse of the Action
                     </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                       <ScreenshotCard src="https://picsum.photos/seed/szludo1/400/700" alt="App Screenshot 1" data-ai-hint="app screenshot" delay={0} />
                       <ScreenshotCard src="https://picsum.photos/seed/szludo2/400/700" alt="App Screenshot 2" data-ai-hint="app gameplay" delay={100} />
                       <ScreenshotCard src="https://picsum.photos/seed/szludo3/400/700" alt="App Screenshot 3" data-ai-hint="app wallet" delay={200} />
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-16 md:py-24 px-4">
                     <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-primary" data-aos="zoom-in">
                        What Our Players Say
                     </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <TestimonialCard name="Rohan S." text="Amazing app! The withdrawals are super fast. I won ₹500 and got it in my account in 10 minutes." avatarSeed="Rohan" delay={0} />
                        <TestimonialCard name="Priya K." text="Fair gameplay and a great community. I play here every day after work." avatarSeed="Priya" delay={100} />
                        <TestimonialCard name="Amit G." text="The best real money Ludo app out there. The support team is also very helpful." avatarSeed="Amit" delay={200} />
                    </div>
                </section>

                <section className="py-16 md:py-24 px-4 max-w-3xl mx-auto" data-aos="fade-up">
                     <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-primary">
                        Frequently Asked Questions
                     </h2>
                     <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="font-semibold text-lg">Is my money safe?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground text-base">
                            Absolutely. We use industry-standard security and encryption for all transactions. Your funds are kept in a secure wallet, and withdrawals are processed through verified channels.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="font-semibold text-lg">How do I withdraw my winnings?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground text-base">
                            Once your winnings are in your wallet, you can go to the 'Wallet' section, click on 'Withdraw', and enter your bank or UPI details. Withdrawals are typically processed within 24 hours.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger className="font-semibold text-lg">What happens if there's a dispute in a game?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground text-base">
                            If there is any dispute, please submit the game result with a screenshot of the final screen. Our support team will review the evidence from both players and ensure a fair outcome. Dishonesty will lead to an account ban.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </section>
                
                {/* Final CTA Section */}
                <section className="py-16 sm:py-20 px-4 text-center bg-primary text-primary-foreground rounded-xl my-16 sm:my-24" data-aos="zoom-in">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Play?</h2>
                    <p className="max-w-2xl mx-auto mb-8">Join thousands of players and start winning real cash prizes today. The next Ludo king could be you!</p>
                     <Button
                        variant="secondary"
                        size="lg"
                        className="text-base sm:text-lg py-5 px-8 sm:py-7 sm:px-10 rounded-full font-semibold transition-all duration-300 hover:scale-105"
                        onClick={handleInstallClick}
                    >
                        Download Now & Get Started <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </section>

            </main>

            <footer className="bg-muted/40 py-8 px-4 text-center mt-16">
                 <div className="container mx-auto">
                    <div className="flex justify-center gap-6 mb-4">
                        <Link href="/terms" className="text-muted-foreground hover:text-primary">Terms & Conditions</Link>
                        <Link href="/privacy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link>
                        <Link href="/refund" className="text-muted-foreground hover:text-primary">Refund Policy</Link>
                        <Link href="/gst" className="text-muted-foreground hover:text-primary">GST Policy</Link>
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

    