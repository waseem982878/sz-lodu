
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TermsPage() {
  const content = `
    <h2 class="text-xl font-semibold text-gray-800">1. Introduction</h2>
    <p class="mt-2 text-gray-600">
      Welcome to SDF Battles. By using our services, you agree to be bound by these Terms & Conditions. Please read them carefully. You must be 18 years or older to use this service.
    </p>
    <h2 class="text-xl font-semibold text-gray-800 mt-6">2. User Account</h2>
    <p class="mt-2 text-gray-600">
      You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. Any fraudulent, abusive, or otherwise illegal activity may be grounds for termination of your account.
    </p>
    <h2 class="text-xl font-semibold text-gray-800 mt-6">3. Gameplay</h2>
    <p class="mt-2 text-gray-600">
      All games must be played fairly. Any use of bots, hacks, or any other unauthorized third-party software is strictly prohibited. Players found cheating will have their accounts permanently banned and any existing funds will be forfeited.
    </p>
    <h2 class="text-xl font-semibold text-gray-800 mt-6">4. Financial Risk</h2>
    <p class="mt-2 text-gray-600">
      This game involves an element of financial risk and may be addictive. Please play responsibly and at your own risk. SDF Battles is not responsible for any financial losses incurred while using the platform.
    </p>
  `;

  return (
    <div className="bg-background p-4 md:p-8 rounded-lg max-w-4xl mx-auto">
      <Card className="shadow-none border-none bg-transparent">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-primary">Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
           <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        </CardContent>
      </Card>
    </div>
  );
}
