
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function RefundPolicyPage() {
  const content = `
    <h2 class="text-xl font-semibold text-gray-800">1. General Policy</h2>
    <p class="mt-2 text-gray-600">
      At SDF Battles, we strive to provide a fair and exciting gaming experience. All funds added to your deposit wallet are used for participating in games. Winnings are credited to your winnings wallet.
    </p>
    <h2 class="text-xl font-semibold text-gray-800 mt-6">2. No Refunds on Deposits</h2>
    <p class="mt-2 text-gray-600">
      Once you have deposited funds into your wallet, these funds are non-refundable and can only be used to play games on our platform. We do not provide refunds for deposits made.
    </p>
    <h2 class="text-xl font-semibold text-gray-800 mt-6">3. Game Cancellation and Disputes</h2>
    <p class="mt-2 text-gray-600">
      In the case of a game cancellation due to a technical issue from our end, the entry fee will be refunded to both players' wallets. If a player cancels a game after an opponent has joined, a cancellation fee may be applicable as per our terms. All disputes will be manually reviewed by our support team for a fair resolution.
    </p>
    <h2 class="text-xl font-semibold text-gray-800 mt-6">4. Withdrawals</h2>
    <p class="mt-2 text-gray-600">
      Only the balance in your 'Winnings Wallet' is eligible for withdrawal. The balance in your 'Deposit Wallet' can only be used for gameplay and cannot be withdrawn directly. Please ensure your KYC is completed to process withdrawals.
    </p>
  `;

  return (
    <div className="bg-background p-4 md:p-8 rounded-lg max-w-4xl mx-auto">
      <Card className="shadow-none border-none bg-transparent">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-primary">Cancellation & Refund Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        </CardContent>
      </Card>
    </div>
  );
}
