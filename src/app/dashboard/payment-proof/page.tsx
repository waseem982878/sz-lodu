"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context"; // Corrected hook path
import { uploadImage } from "@/services/image-upload.service";
import { useRouter } from "next/navigation";

// We will create/update this service to handle payment proof logic
// import { PaymentService } from "@/services/payment.service"; 

export default function PaymentProofPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    transactionId: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate on client-side before showing preview
      if (file.size > 5 * 1024 * 1024) {
          setError("File is too large. Maximum size is 5MB.");
          setScreenshotFile(null);
          setPreview(null);
          return;
      }
      if (!file.type.startsWith('image/')) {
          setError("Invalid file type. Only images are allowed.");
          setScreenshotFile(null);
          setPreview(null);
          return;
      }
      
      setError(null);
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
          setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !screenshotFile) {
      setError("Please fill all fields and select a screenshot.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload screenshot using our existing service
      const imagePath = `payment-proofs/${user.uid}/${Date.now()}_${screenshotFile.name}`;
      const screenshotUrl = await uploadImage(screenshotFile, imagePath);

      // 2. Save payment proof data to Firestore (will be implemented in PaymentService)
      console.log('Payment Proof Data to save:', {
          userId: user.uid,
          transactionId: formData.transactionId,
          screenshotUrl: screenshotUrl,
          status: 'Pending',
          submittedAt: new Date(),
      });
      
      // Simulate saving to DB
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('Payment proof submitted successfully! It will be verified soon.');

      // Reset form
      setScreenshotFile(null);
      setPreview(null);
      setFormData({ transactionId: "" });
      router.push("/dashboard");


    } catch (err) {
      console.error('Payment proof submission error:', err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Submit Payment Proof</h1>
        <p className="text-muted-foreground">Upload your payment screenshot for manual verification</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Payment Screenshot</CardTitle>
          <CardDescription>
            If your automatic payment failed or is pending, you can upload a screenshot here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID / UTR Number</Label>
              <Input
                id="transactionId"
                value={formData.transactionId}
                onChange={(e) => setFormData({...formData, transactionId: e.target.value})}
                placeholder="e.g., 237482374823"
                required
              />
            </div>

            {/* Screenshot Upload */}
            <div className="space-y-4">
              <Label>Payment Screenshot</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                  id="screenshot-upload"
                  required
                />
                <Label htmlFor="screenshot-upload" className="cursor-pointer">
                  <UploadCloud className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload screenshot</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG (Max 5MB)</p>
                </Label>
                {screenshotFile && (
                  <p className="text-sm text-green-600 mt-2 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    {screenshotFile.name}
                  </p>
                )}
              </div>
            </div>

             {preview && (
                <div className="mt-4">
                    <h3 className="font-semibold mb-2 text-center">Image Preview:</h3>
                    <img src={preview} alt="Screenshot preview" className="rounded-lg border w-full h-auto object-contain" />
                </div>
            )}

            {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button type="submit" disabled={loading || !screenshotFile} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit for Verification'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
