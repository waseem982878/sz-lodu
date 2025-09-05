
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LifeBuoy, Mail, Send, ChevronRight } from "lucide-react";

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
    answer: "If there is any dispute with the game result, please contact our support team immediately through the contact form on this page or via our support email. Provide the game ID and any relevant proof (like screenshots or screen recordings). Our team will investigate and provide a resolution."
  },
  {
    question: "How do deposits and withdrawals work?",
    answer: "You can add money to your 'Deposit Wallet' using various payment methods. This balance can be used to join games. Winnings are credited to your 'Winnings Wallet', and you can withdraw this amount to your verified bank account. Please note that KYC is required for withdrawals."
  }
]

export default function SupportPage() {
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
            <Mail className="h-6 w-6" />
            <span>Contact Us</span>
          </CardTitle>
           <p className="text-sm text-muted-foreground pt-2">
            If you can't find the answer in the FAQ, feel free to send us a message.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-1">
                <label htmlFor="name" className="text-sm font-medium">Your Name</label>
                <Input id="name" placeholder="Enter your name" />
            </div>
             <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium">Your Email</label>
                <Input id="email" type="email" placeholder="Enter your email" />
            </div>
             <div className="space-y-1">
                <label htmlFor="message" className="text-sm font-medium">Message</label>
                <Textarea id="message" placeholder="Describe your issue or question" rows={5} />
            </div>
            <Button className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}
