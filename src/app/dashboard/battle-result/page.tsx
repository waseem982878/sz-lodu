'use client';

import { useState, useRef } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { uploadBattleResult } from '@/services/battle.service';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import Image from 'next/image';

function InfoDialog({
  open,
  onClose,
  title,
  message,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle
            className={title === 'Success' ? 'text-green-600' : 'text-red-600'}
          >
            {title}
          </DialogTitle>
          <DialogDescription className="pt-4">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button onClick={onClose}>OK</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BattleResultPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [battleId, setBattleId] = useState('');
  const [dialogState, setDialogState] = useState({ open: false, title: '', message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        showDialog('Error', 'File size should not exceed 5MB.');
        return;
      }
      setScreenshotFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const showDialog = (title: string, message: string) => {
    setDialogState({ open: true, title, message });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showDialog('Error', 'You must be logged in to submit a result.');
      return;
    }
    if (!screenshotFile || !battleId) {
      showDialog('Error', 'Please provide the Battle ID and a screenshot.');
      return;
    }

    setLoading(true);

    try {
      await uploadBattleResult(battleId, user.uid, screenshotFile);

      showDialog(
        'Success',
        'Battle result submitted successfully! It will be verified soon.'
      );
      // Clear the form after submission
      setBattleId('');
      setScreenshotFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Battle result submission error:', err);
      if (err.message === 'ERROR_NOT_AUTHORIZED') {
        showDialog(
          'Error',
          'You are not authorized to perform this action. Please contact support.'
        );
      } else {
        showDialog('Error', err.message || 'Failed to submit battle result.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <InfoDialog
        open={dialogState.open}
        onClose={() => setDialogState({ ...dialogState, open: false })}
        title={dialogState.title}
        message={dialogState.message}
      />

      <div>
        <h1 className="text-3xl font-bold text-primary">Battle Result</h1>
        <p className="text-muted-foreground">
          Submit your battle screenshot for verification
        </p>
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
                value={battleId}
                onChange={(e) => setBattleId(e.target.value)}
                placeholder="Enter the ID of the battle you won"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-4">
              <Label>Winning Screenshot</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                  id="battle-upload"
                  ref={fileInputRef}
                  required
                  disabled={loading}
                />
                {!previewUrl ? (
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload result</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG (Max 5MB)</p>
                  </div>
                ) : (
                  <div className="relative">
                    <Image
                      src={previewUrl}
                      alt="Screenshot preview"
                      width={200}
                      height={150}
                      className="mx-auto rounded-md object-contain max-h-40"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewUrl(null);
                        setScreenshotFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      Change Screenshot
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !screenshotFile || !battleId}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Battle Result
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
