
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { uploadImage } from "@/services/storage-service";
import { submitKycDetails } from "@/services/user-agent-service";

export default function KycPage() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  
  // Form state
  const [name, setName] = useState(userProfile?.name || "");
  const [dob, setDob] = useState(userProfile?.dob || "");
  const [panNumber, setPanNumber] = useState(userProfile?.panNumber || "");
  const [aadhaarNumber, setAadhaarNumber] = useState(userProfile?.aadhaarNumber || "");
  const [upiId, setUpiId] = useState(userProfile?.upiId || "");
  
  // File state
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [panPreview, setPanPreview] = useState(userProfile?.panCardUrl || null);
  const [aadhaarPreview, setAadhaarPreview] = useState(userProfile?.aadhaarCardUrl || null);

  const panInputRef = useRef<HTMLInputElement>(null);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);


  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }
  
  if (!user || !userProfile) {
    router.push('/landing');
    return null;
  }

  const handlePanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPanFile(file);
      setPanPreview(URL.createObjectURL(file));
    }
  };

  const handleAadhaarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAadhaarFile(file);
      setAadhaarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!panFile && !userProfile.panCardUrl) {
      alert("Please upload your PAN card photo.");
      return;
    }
    if (!aadhaarFile && !userProfile.aadhaarCardUrl) {
      alert("Please upload your Aadhaar card photo.");
      return;
    }
    
    setIsSubmitting(true);
    
    let panCardUrl = userProfile.panCardUrl;
    let aadhaarCardUrl = userProfile.aadhaarCardUrl;
    
    try {
        if (panFile) {
            const fileName = `pan_${Date.now()}`;
            panCardUrl = await uploadImage(panFile, `kyc/${user.uid}/${fileName}`);
        }
        if (aadhaarFile) {
            const fileName = `aadhaar_${Date.now()}`;
            aadhaarCardUrl = await uploadImage(aadhaarFile, `kyc/${user.uid}/${fileName}`);
        }

        await submitKycDetails(user.uid, {
            name,
            dob,
            panNumber,
            aadhaarNumber,
            upiId,
            panCardUrl,
            aadhaarCardUrl,
        });
        
        alert("KYC details submitted successfully! Our team will review them shortly.");
        router.push('/profile');

    } catch (error: any) {
        alert(`Failed to submit KYC details: ${error.message}`);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const isPendingOrVerified = userProfile.kycStatus === 'Pending' || userProfile.kycStatus === 'Verified';

  return (
    <div className="space-y-6 pb-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">KYC Verification</CardTitle>
          <CardDescription>
            {isPendingOrVerified 
                ? `Your KYC status is currently: ${userProfile.kycStatus}.`
                : "Please provide your details for verification. This is required for withdrawals."
            }
          </CardDescription>
          {userProfile.kycStatus === 'Rejected' && (
              <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
                <p className="font-bold flex items-center gap-2"><AlertTriangle size={16} /> Rejection Reason:</p>
                <p className="text-sm">{userProfile.kycNotes || "No reason provided."}</p>
              </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name (as per documents)</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required disabled={isPendingOrVerified} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={dob} onChange={e => setDob(e.target.value)} required disabled={isPendingOrVerified} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aadhaarNumber">Aadhaar Number (12 digits)</Label>
              <Input id="aadhaarNumber" value={aadhaarNumber} onChange={e => setAadhaarNumber(e.target.value)} required pattern="\d{12}" title="Must be 12 digits" disabled={isPendingOrVerified} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="panNumber">PAN Number</Label>
              <Input id="panNumber" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} required disabled={isPendingOrVerified} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID (for receiving payments)</Label>
              <Input id="upiId" value={upiId} onChange={e => setUpiId(e.target.value)} required placeholder="yourname@upi" disabled={isPendingOrVerified} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Aadhaar Card Photo</Label>
                    <input type="file" ref={aadhaarInputRef} className="hidden" accept="image/*" onChange={handleAadhaarFileChange} disabled={isPendingOrVerified} />
                    <Card 
                        className="border-dashed h-40 flex items-center justify-center cursor-pointer hover:border-primary"
                        onClick={() => !isPendingOrVerified && aadhaarInputRef.current?.click()}
                    >
                        {aadhaarPreview ? 
                            <Image src={aadhaarPreview} alt="Aadhaar preview" width={150} height={100} className="object-contain max-h-36"/> : 
                            <div className="text-center text-muted-foreground"><Upload className="mx-auto mb-2"/>Click to upload</div>
                        }
                    </Card>
                </div>
                 <div className="space-y-2">
                    <Label>PAN Card Photo</Label>
                     <input type="file" ref={panInputRef} className="hidden" accept="image/*" onChange={handlePanFileChange} disabled={isPendingOrVerified} />
                    <Card 
                        className="border-dashed h-40 flex items-center justify-center cursor-pointer hover:border-primary"
                        onClick={() => !isPendingOrVerified && panInputRef.current?.click()}
                    >
                        {panPreview ? 
                            <Image src={panPreview} alt="PAN preview" width={150} height={100} className="object-contain max-h-36"/> : 
                            <div className="text-center text-muted-foreground"><Upload className="mx-auto mb-2"/>Click to upload</div>
                        }
                    </Card>
                </div>
            </div>
            
            {!isPendingOrVerified && (
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit for Verification
              </Button>
            )}
             {userProfile.kycStatus === 'Verified' && (
              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-300 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5"/>
                <p className="font-semibold">Your KYC is verified. You can now make withdrawals.</p>
              </div>
            )}
             {userProfile.kycStatus === 'Pending' && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-yellow-700 dark:text-yellow-300 flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin"/>
                <p className="font-semibold">Your KYC is under review. This usually takes 24 hours.</p>
              </div>
            )}

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
