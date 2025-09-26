
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Send, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

const faqs = [
  {
    question: "How do I join a game?",
    answer: "Navigate to the 'Play' section from the main menu. You can either join an existing open battle by clicking 'Play' or create your own challenge by setting an amount and clicking 'Set'."
  },
  {
    question: "How do I upload game results?",
    answer: "After your game is finished, go to the game room page. You will see options to declare if you 'Won' or 'Lost'. Click the appropriate button, and you will be prompted to upload a screenshot of the final game screen from the Ludo King app as proof."
  },
  {
    question: "How long does it take for winnings to be credited?",
    answer: "After you upload the winning proof, our team will verify the result. Verification is usually completed within 15-30 minutes. Once verified, the winning amount will be credited to your 'Winnings Wallet'."
  },
  {
    question: "What happens if there is a dispute?",
    answer: "If there is any dispute with the game result, please contact our support team immediately through WhatsApp or Telegram. Provide the game ID and any relevant proof (like screenshots or screen recordings). Our team will investigate and provide a resolution."
  },
  {
    question: "How do deposits and withdrawals work?",
    answer: "You can add money to your 'Deposit Wallet' using various payment methods. This balance can be used to join games. Winnings are credited to your 'Winnings Wallet', and you can withdraw this amount to your verified bank account. Please note that KYC is required for withdrawals."
  }
];

type SocialMediaLinks = {
    whatsapp: string;
    telegram: string;
};

export default function SupportPage() {
  const [socialLinks, setSocialLinks] = useState<Partial<SocialMediaLinks>>({});

  useEffect(() => {
    const fetchSocials = async () => {
        const socialRef = doc(db, 'config', 'socialMedia');
        const socialSnap = await getDoc(socialRef);
        if (socialSnap.exists()) {
            setSocialLinks(socialSnap.data() as SocialMediaLinks);
        }
    };
    fetchSocials();
  }, []);

  const openLink = (url?: string) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      alert("Contact link is not configured yet. Please check back later.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Support Center</h1>
        <p className="text-muted-foreground">How can we help you today?</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <LifeBuoy className="h-6 w-6" />
            <span>Frequently Asked Questions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <MessageSquare className="h-6 w-6" />
            <span>Contact Us</span>
          </CardTitle>
           <p className="text-sm text-muted-foreground pt-2">
            If you can't find the answer in the FAQ, please reach out to us on WhatsApp or Telegram.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
            <Button className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={() => openLink(socialLinks.whatsapp)}>
              <MessageSquare className="mr-2 h-5 w-5" />
              Contact on WhatsApp
            </Button>
             <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={() => openLink(socialLinks.telegram)}>
              <Send className="mr-2 h-5 w-5" />
              Contact on Telegram
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
