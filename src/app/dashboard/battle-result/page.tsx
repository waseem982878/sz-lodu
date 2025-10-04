"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context"; // Corrected hook path
import { BattleService } from "@/services/battle.service"; // Using the service we created
import { useRouter } from "next/navigation";

export default function BattleResultPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    battleId: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !screenshotFile || !formData.battleId) {
      setError("Please provide the Battle ID and a screenshot.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // This service method already handles image upload and DB update
      await BattleService.uploadBattleResult(
        formData.battleId,
        user.uid,
        screenshotFile
      );
      
      alert('Battle result submitted successfully! It will be verified soon.');
      router.push(`/battle/${formData.battleId}`); // Navigate to the battle page

    } catch (err) {
      console.error('Battle result submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit battle result.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Battle Result</h1>
        <p className="text-muted-foreground">Submit your battle screenshot for verification</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Battle Result</CardTitle>
          <CardDescription>
            Upload a clear screenshot of your victory for verification and rewards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="battleId">Battle ID</Label>
              <Input
                id="battleId"
                value={formData.battleId}
                onChange={(e) => setFormData({ ...formData, battleId: e.target.value })}
                placeholder="Enter the ID of the battle you won"
                required
              />
            </div>

            <div className="space-y-4">
              <Label>Winning Screenshot</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="battle-upload"
                  required
                />
                <Label htmlFor="battle-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload result</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG (Max 5MB)</p>
                </Label>
                {screenshotFile && (
                  <p className="text-sm text-green-600 mt-2">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    {screenshotFile.name}
                  </p>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <Button type="submit" disabled={loading || !screenshotFile} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Battle Result
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
