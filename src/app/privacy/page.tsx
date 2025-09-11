
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  const content = `
    <h2 class="text-xl font-semibold text-gray-800">1. Information We Collect</h2>
    <p class="mt-2 text-gray-600">
      We collect information you provide directly to us, such as when you create an account, update your profile, use the interactive features of our services, and communicate with us. This information may include your name, email address, phone number, and any other information you choose to provide.
    </p>
    <h2 class="text-xl font-semibold text-gray-800 mt-6">2. How We Use Information</h2>
    <p class="mt-2 text-gray-600">
      We use the information we collect to operate, maintain, and provide you with the features and functionality of the service, as well as to communicate directly with you, such as to send you email messages and push notifications. We may also send you service-related emails or messages (e.g., account verification, changes or updates to features of the service, technical and security notices).
    </p>
    <h2 class="text-xl font-semibold text-gray-800 mt-6">3. Sharing of Your Information</h2>
    <p class="mt-2 text-gray-600">
      We will not rent or sell your information to third parties outside SZ LUDO without your consent, except as noted in this Policy.
    </p>
    <h2 class="text-xl font-semibold text-gray-800 mt-6">4. Security</h2>
    <p class="mt-2 text-gray-600">
      We care about the security of your information and use commercially reasonable safeguards to preserve the integrity and security of all information collected through the service. However, no security system is impenetrable and we cannot guarantee the security of our systems 100%.
    </p>
  `;

  return (
    <div className="bg-background p-4 md:p-8 rounded-lg max-w-4xl mx-auto">
      <Card className="shadow-none border-none bg-transparent">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-primary">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
           <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        </CardContent>
      </Card>
    </div>
  );
}

    