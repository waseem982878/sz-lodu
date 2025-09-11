
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function GstPolicyPage() {
  const content = `
    <h2 class="text-xl font-semibold text-gray-800">GST on Deposits</h2>
    <p class="mt-2 text-gray-600">
      As per the Government of India's regulations, a Goods and Services Tax (GST) is applicable on all deposits made by players on online gaming platforms. At SZ LUDO, we are committed to transparency and compliance with all applicable laws.
    </p>
    <p class="mt-4 text-gray-600">
      The current applicable GST rate on the amount you deposit is <strong>28%</strong>. This tax is levied by the government on the value of the deposit.
    </p>
    <h2 class="text-xl font-semibold text-gray-800 mt-6">How We Handle GST</h2>
    <p class="mt-2 text-gray-600">
      To ensure a seamless and rewarding experience for our players, SZ LUDO will cover the GST amount on your behalf for every deposit you make. This means:
    </p>
    <ul class="list-disc list-inside mt-4 text-gray-600 space-y-2">
      <li>If you deposit ₹100, the applicable GST is ₹28.</li>
      <li>You will pay only ₹100 for your deposit.</li>
      <li>SZ LUDO will pay the ₹28 GST to the government.</li>
      <li>Your playable wallet balance will reflect the full deposit amount of ₹100. We may also offer promotional bonuses equivalent to the GST amount as a benefit to you, which will be credited to your bonus wallet.</li>
    </ul>
    <h2 class="text-xl font-semibold text-gray-800 mt-6">No Hidden Charges</h2>
    <p class="mt-2 text-gray-600">
      The amount you choose to deposit is the amount you pay. We believe in providing a straightforward and honest gaming environment, and covering the GST cost is part of our commitment to you. You can play with the full value of your deposit.
    </p>
    <p class="mt-4 text-gray-600">
      For any questions regarding our GST policy, please feel free to contact our customer support team.
    </p>
  `;

  return (
    <div className="bg-background p-4 md:p-8 rounded-lg max-w-4xl mx-auto">
      <Card className="shadow-none border-none bg-transparent">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-primary">GST Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        </CardContent>
      </Card>
    </div>
  );
}

    