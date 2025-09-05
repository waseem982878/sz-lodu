
"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

// Define a type for our settings for type safety
type AppSettings = {
  commissionRate: number;
  minWithdrawal: number;
  referralBonus: number;
  headerBannerText: string;
  homeNoticeText: string;
  termsAndConditions: string;
  privacyPolicy: string;
  refundPolicy: string;
  gstPolicy: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<AppSettings>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const settingsRef = doc(db, 'config', 'appSettings');
      const docSnap = await getDoc(settingsRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data() as AppSettings);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsRef = doc(db, 'config', 'appSettings');
      await setDoc(settingsRef, settings, { merge: true });
      alert("Settings saved successfully!");
    } catch (error) {
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: Number(value) }));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-3xl font-bold text-primary">App Settings</h1>
      
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
          <CardTitle className="text-primary">Content Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="headerBannerText">Header Banner Text</Label>
            <Input id="headerBannerText" value={settings.headerBannerText || ''} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="homeNoticeText">Home Page Notice Text</Label>
            <Textarea id="homeNoticeText" value={settings.homeNoticeText || ''} onChange={handleInputChange} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Policy Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
            <Textarea id="termsAndConditions" rows={10} value={settings.termsAndConditions || ''} onChange={handleInputChange} placeholder="Enter your full terms and conditions text here..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="privacyPolicy">Privacy Policy</Label>
            <Textarea id="privacyPolicy" rows={10} value={settings.privacyPolicy || ''} onChange={handleInputChange} placeholder="Enter your full privacy policy text here..." />
          </div>
           <div className="space-y-2">
            <Label htmlFor="refundPolicy">Refund Policy</Label>
            <Textarea id="refundPolicy" rows={10} value={settings.refundPolicy || ''} onChange={handleInputChange} placeholder="Enter your full refund policy text here..." />
          </div>
           <div className="space-y-2">
            <Label htmlFor="gstPolicy">GST Policy</Label>
            <Textarea id="gstPolicy" rows={10} value={settings.gstPolicy || ''} onChange={handleInputChange} placeholder="Enter your full GST policy text here..." />
          </div>
        </CardContent>
      </Card>
      
      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save All Settings
      </Button>
    </div>
  );
}
