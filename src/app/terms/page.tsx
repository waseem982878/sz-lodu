
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Loader2 } from "lucide-react";

export default function TermsPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const docRef = doc(db, 'config', 'appSettings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setContent(docSnap.data().termsAndConditions || "Terms and Conditions not available.");
      } else {
        setContent("Terms and Conditions not available.");
      }
      setLoading(false);
    };
    fetchContent();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

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
