
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info, TriangleAlert, Loader2, ShieldAlert, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import imagePaths from '@/lib/image-paths.json';
import { useAuth } from "@/contexts/auth-context";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import { motion } from "framer-motion";

type GameCardProps = {
  title: string;
  description: string;
  imageUrl: string;
  href: string;
  priority?: boolean;
  titleClassName?: string;
};

function GameCard({ title, description, imageUrl, href, priority = false, titleClassName }: GameCardProps) {
  return (
    <Link href={href} className="no-underline group">
      <Card className="overflow-hidden bg-card border-primary/20 border-2 rounded-xl shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
        <Image
          src={imageUrl}
          alt={title}
          width={300}
          height={200}
          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
          priority={priority}
        />
        <div className="p-2 text-center">
          <h2 className={cn("text-lg font-bold text-primary tracking-wider", titleClassName)}>{title}</h2>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </Card>
    </Link>
  )
}

function RulesDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary">
          <Info className="mr-2 h-4 w-4" /> Rules
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-primary">Game Rules</DialogTitle>
          <DialogDescription>
            Follow these rules to ensure a fair and enjoyable game.
          </DialogDescription>
        </DialogHeader>
        <div className="prose dark:prose-invert max-w-none text-foreground">
            <ul className="space-y-3 text-sm list-disc list-inside">
                <li>
                    <strong>Room Code:</strong> After joining a battle, the creator will enter a Ludo King room code. You must join the room in the Ludo King app using this code.
                </li>
                <li>
                    <strong>Gameplay:</strong> The game must be played according to standard Ludo King classic rules.
                </li>
                <li>
                    <strong>Winning Proof:</strong> After winning the game, you MUST take a screenshot of the final win screen in Ludo King.
                </li>
                <li>
                    <strong>Uploading Result:</strong> Upload the winning screenshot in the "Game Result" section of the app. The winner gets the prize money after verification.
                </li>
                 <li>
                    <strong>Cheating:</strong> Any form of cheating, including using mods or teaming up, will result in an immediate ban and forfeiture of all wallet funds.
                </li>
                <li>
                    <strong>Disputes:</strong> If there is any issue, contact support immediately. Any attempt at fraud will result in a permanent ban.
                </li>
                 <li>
                    <strong>Cancellation:</strong> You can cancel a battle after an opponent has joined, but a small penalty fee will be deducted from your wallet for doing so.
                </li>
            </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function KycNoticeBanner() {
    return (
        <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 mb-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-1 flex-shrink-0" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <span className="font-bold">Your KYC is not verified.</span> Complete it now for fast and easy withdrawals.
                    </p>
                </div>
                <Button asChild size="sm" className="flex-shrink-0">
                    <Link href="/profile/kyc">
                        Complete KYC <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </Card>
    );
}

export default function HomePage() {
  const { userProfile, loading: authLoading } = useAuth();
  const [notice, setNotice] = useState<string | null>(null);
  const [disclaimerText, setDisclaimerText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const sentence = {
      hidden: { opacity: 1 },
      visible: {
          opacity: 1,
          transition: {
              delay: 0.5,
              staggerChildren: 0.02,
          },
      },
  };
  const letter = {
      hidden: { opacity: 0, y: 50 },
      visible: {
          opacity: 1,
          y: 0,
      },
  };

  useEffect(() => {
    const settingsRef = doc(db, 'config', 'appSettings');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNotice(data.homeNoticeText || null);
        setDisclaimerText(data.disclaimerText || null);
      }
      setLoading(false);
    }, () => setLoading(false));

    return () => unsubscribe();
  }, []);

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const showKycBanner = userProfile && userProfile.kycStatus !== 'Verified';

  return (
    <>
      {showKycBanner && <KycNoticeBanner />}

      {notice && (
        <Card className="bg-yellow-100 border-yellow-300 p-3 mb-6 dark:bg-yellow-900/30 dark:border-yellow-700">
          <div className="flex items-start">
            <TriangleAlert className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-1 flex-shrink-0" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <span className="font-bold">Notice:</span> {notice}
            </p>
          </div>
        </Card>
      )}

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-primary">Available Games</h1>
        <RulesDialog />
      </div>

      <div className="grid grid-cols-2 gap-4">
          <GameCard 
            title="LUDO CLASSIC"
            description="Bets: ₹50 - ₹50,000"
            imageUrl={imagePaths.ludoClassicIcon.path}
            href="/play"
            priority={true}
          />
          <GameCard 
            title="LUDO POPULAR"
            description="Bets: ₹50,001 - ₹100,000"
            imageUrl={imagePaths.ludoClassicIcon.path}
            href="/play"
            titleClassName="text-base"
          />
      </div>

      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-muted-foreground/20"></div>
      </div>
      
      {disclaimerText && (
        <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-4 overflow-hidden">
          <h3 className="font-bold text-yellow-700 dark:text-yellow-300 flex items-center gap-2 mb-2">
              <TriangleAlert className="h-5 w-5 animate-pulse"/> Disclaimer
          </h3>
          <motion.p
              className="text-xs text-yellow-800 dark:text-yellow-200"
              variants={sentence}
              initial="hidden"
              animate="visible"
          >
              {disclaimerText.split("").map((char, index) => (
                  <motion.span key={char + "-" + index} variants={letter}>
                      {char}
                  </motion.span>
              ))}
          </motion.p>
        </Card>
      )}
    </>
  );
}

    