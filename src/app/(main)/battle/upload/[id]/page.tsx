'use client';

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, UploadCloud } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { BattleService } from "@/services/battle.service";
import { uploadImage } from "@/services/image-upload.service";

export default function BattleUploadPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const battleId = params ? params.id as string : null;

    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB size limit
                setError("File size must be less than 5MB.");
                setFile(null);
                setPreview(null);
                return;
            }
            setFile(selectedFile);
            setError(null);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a screenshot file to upload.");
            return;
        }
        if (!user) {
            setError("You must be logged in to upload.");
            return;
        }
        if (!battleId) {
            setError("Battle ID is missing. Cannot upload result.");
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const imagePath = `results/${battleId}/${user.uid}_${Date.now()}`;
            const imageUrl = await uploadImage(file, imagePath);
            
            await BattleService.uploadResult(battleId, user.uid, 'won', imageUrl);

            alert("Screenshot uploaded successfully! An admin will verify the result shortly.");
            router.push(`/game/${battleId}`);

        } catch (err) {
            console.error("Upload failed:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during upload.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Upload Battle Result</CardTitle>
                    <CardDescription>
                        Upload the winning screenshot for your battle. Please make sure the result is clearly visible.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="screenshot-upload" className="font-medium">
                            Screenshot File
                        </label>
                        <Input id="screenshot-upload" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} />
                    </div>

                    {preview && (
                        <div className="mt-4">
                            <h3 className="font-semibold mb-2">Image Preview:</h3>
                            <img src={preview} alt="Screenshot preview" className="rounded-lg border w-full object-contain" />
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-500 text-center">{error}</p>
                    )}

                    <Button onClick={handleUpload} className="w-full" disabled={isUploading || !file}>
                        {isUploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <UploadCloud className="mr-2 h-4 w-4" />
                        )}
                        {isUploading ? "Uploading..." : "Upload & Submit Result"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
