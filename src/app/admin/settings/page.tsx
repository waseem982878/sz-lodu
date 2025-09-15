
"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

// Define types for our settings for type safety
type AppSettings = {
  commissionRate: number;
  minWithdrawal: number;
  referralBonus: number;
  headerBannerText: string;
  homeNoticeText: string;
};

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

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<AppSettings>>({});
  const [landingContent, setLandingContent] = useState<Partial<LandingPageContent>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const settingsRef = doc(db, 'config', 'appSettings');
      const landingRef = doc(db, 'config', 'landingPage');

      const [settingsSnap, landingSnap] = await Promise.all([
          getDoc(settingsRef),
          getDoc(landingRef)
      ]);
      
      if (settingsSnap.exists()) {
        setSettings(settingsSnap.data() as AppSettings);
      }
      if (landingSnap.exists()) {
        setLandingContent(landingSnap.data() as LandingPageContent);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsRef = doc(db, 'config', 'appSettings');
      const landingRef = doc(db, 'config', 'landingPage');
      
      await Promise.all([
        setDoc(settingsRef, settings, { merge: true }),
        setDoc(landingRef, landingContent, { merge: true })
      ]);

      alert("Settings saved successfully!");
    } catch (error) {
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAppSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };
  
   const handleLandingContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setLandingContent(prev => ({ ...prev, [id]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: Number(value) }));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">App Settings</h1>
        <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save All Settings
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Game & Financial Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="commissionRate">Commission Rate (%)</Label>
            <Input id="commissionRate" type="number" value={settings.commissionRate || 5} onChange={handleNumberChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minWithdrawal">Minimum Withdrawal (₹)</Label>
            <Input id="minWithdrawal" type="number" value={settings.minWithdrawal || 300} onChange={handleNumberChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referralBonus">Referral Bonus (₹)</Label>
            <Input id="referralBonus" type="number" value={settings.referralBonus || 25} onChange={handleNumberChange} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">In-App Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="headerBannerText">Header Banner Text</Label>
            <Input id="headerBannerText" value={settings.headerBannerText || ''} onChange={handleAppSettingChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="homeNoticeText">Home Page Notice Text</Label>
            <Textarea id="homeNoticeText" value={settings.homeNoticeText || ''} onChange={handleAppSettingChange} />
          </div>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle className="text-primary">Landing Page Management</CardTitle>
          <CardDescription>Control the content displayed on the main landing page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="heroTitle">Main Title (Hero Section)</Label>
                <Input id="heroTitle" value={landingContent.heroTitle || 'SZ LUDO'} onChange={handleLandingContentChange} placeholder="e.g., SZ LUDO"/>
            </div>
             <div className="space-y-2">
                <Label htmlFor="heroSubtitle">Subtitle (Hero Section)</Label>
                <Input id="heroSubtitle" value={landingContent.heroSubtitle || 'The Ultimate Real Money Ludo Experience'} onChange={handleLandingContentChange} placeholder="e.g., The Ultimate Real Money Ludo Experience"/>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                 <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-semibold text-muted-foreground">Feature 1</h4>
                     <div className="space-y-2">
                        <Label htmlFor="feature1Title">Feature 1 Title</Label>
                        <Input id="feature1Title" value={landingContent.feature1Title || ''} onChange={handleLandingContentChange} placeholder="e.g., Secure Platform"/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="feature1Description">Feature 1 Description</Label>
                        <Textarea id="feature1Description" value={landingContent.feature1Description || ''} onChange={handleLandingContentChange} rows={3}/>
                    </div>
                 </div>
                 <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-semibold text-muted-foreground">Feature 2</h4>
                     <div className="space-y-2">
                        <Label htmlFor="feature2Title">Feature 2 Title</Label>
                        <Input id="feature2Title" value={landingContent.feature2Title || ''} onChange={handleLandingContentChange} placeholder="e.g., Instant Withdrawals"/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="feature2Description">Feature 2 Description</Label>
                        <Textarea id="feature2Description" value={landingContent.feature2Description || ''} onChange={handleLandingContentChange} rows={3}/>
                    </div>
                 </div>
                 <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-semibold text-muted-foreground">Feature 3</h4>
                     <div className="space-y-2">
                        <Label htmlFor="feature3Title">Feature 3 Title</Label>
                        <Input id="feature3Title" value={landingContent.feature3Title || ''} onChange={handleLandingContentChange} placeholder="e.g., 24/7 Customer Support"/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="feature3Description">Feature 3 Description</Label>
                        <Textarea id="feature3Description" value={landingContent.feature3Description || ''} onChange={handleLandingContentChange} rows={3}/>
                    </div>
                 </div>
                 <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-semibold text-muted-foreground">Feature 4</h4>
                     <div className="space-y-2">
                        <Label htmlFor="feature4Title">Feature 4 Title</Label>
                        <Input id="feature4Title" value={landingContent.feature4Title || ''} onChange={handleLandingContentChange} placeholder="e.g., Win Rewards"/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="feature4Description">Feature 4 Description</Label>
                        <Textarea id="feature4Description" value={landingContent.feature4Description || ''} onChange={handleLandingContentChange} rows={3}/>
                    </div>
                 </div>
            </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
