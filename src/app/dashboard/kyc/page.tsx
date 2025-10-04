"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context"; // Corrected hook path
import { uploadImage } from "@/services/image-upload.service";
import { submitKycDetails } from "@/services/user-agent-service"; // Assuming this service exists
import { useRouter } from "next/navigation";

export default function KycUploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    aadhaarNumber: "",
    panNumber: "",
    dob: "",
    name: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'aadhaar' | 'pan') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'aadhaar') setAadhaarFile(file);
      else setPanFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !aadhaarFile || !panFile) {
        setError("Please fill all fields and upload both documents.");
        return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Upload Aadhaar Card
      const aadhaarPath = `kyc/${user.uid}/aadhaar_card`;
      const aadhaarUrl = await uploadImage(aadhaarFile, aadhaarPath);

      // Upload PAN Card
      const panPath = `kyc/${user.uid}/pan_card`;
      const panUrl = await uploadImage(panFile, panPath);

      // Save KYC data to Firestore via a service
      const kycData = {
        ...formData,
        aadhaarCardUrl: aadhaarUrl,
        panCardUrl: panUrl,
      };

      // This function should handle saving the data to the user's document
      await submitKycDetails(user.uid, kycData);
      
      alert('KYC submitted successfully! It will be verified within 24 hours.');
      router.push("/dashboard");

    } catch (err) {
      console.error('KYC submission error:', err);
      setError(err instanceof Error ? err.message : "Failed to submit KYC. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">KYC Verification</h1>
        <p className="text-muted-foreground">Complete your KYC to start receiving payments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit KYC Documents</CardTitle>
          <CardDescription>
            Upload your documents for verification. All information is kept secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name (as per PAN)</Label>
                <Input id="name" onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" onChange={(e) => setFormData({...formData, dob: e.target.value})} required />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                <Input id="aadhaarNumber" onChange={(e) => setFormData({...formData, aadhaarNumber: e.target.value})} placeholder="1234 5678 9012" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN Number</Label>
                <Input id="panNumber" onChange={(e) => setFormData({...formData, panNumber: e.target.value})} placeholder="ABCDE1234F" required />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Aadhaar Card Upload</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'aadhaar')} className="hidden" id="aadhaar-upload" />
                  <Label htmlFor="aadhaar-upload" className="cursor-pointer">
                    <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload</p>
                  </Label>
                  {aadhaarFile && <p className="text-xs text-green-600 mt-1"><CheckCircle className="h-3 w-3 inline mr-1" />{aadhaarFile.name}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>PAN Card Upload</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'pan')} className="hidden" id="pan-upload" />
                  <Label htmlFor="pan-upload" className="cursor-pointer">
                    <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload</p>
                  </Label>
                  {panFile && <p className="text-xs text-green-600 mt-1"><CheckCircle className="h-3 w-3 inline mr-1" />{panFile.name}</p>}
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit KYC
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
