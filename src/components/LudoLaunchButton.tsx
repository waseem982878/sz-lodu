
"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Gamepad2, Smartphone, Copy, Download, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";


/*
  Props:
  - roomCode (string) : required
*/
export default function LudoLaunchButton({
  roomCode,
  className = "",
}: {
  roomCode: string;
  className?: string;
}) {
  const [isOpening, setIsOpening] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.ludo.king";
  const APP_STORE_URL = "https://apps.apple.com/app/ludo-king/id993090504";

  const getOs = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      if (/android/i.test(userAgent)) return "android";
      if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) return "ios";
      return "unknown";
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    alert(`Room code ${roomCode} copied! You can now paste it in Ludo King.`);
  };

  const downloadLudoKing = () => {
    const os = getOs();
    window.open(os === 'ios' ? APP_STORE_URL : PLAY_STORE_URL, '_blank');
  };

  const openLudoWithFallback = () => {
    if (isOpening) return;
    setIsOpening(true);
    setShowFallback(false);

    // 1. Copy to clipboard as a primary fallback
    copyRoomCode();

    const os = getOs();
    // Android has better support for intent URLs
    const deepLink = os === 'android' 
      ? `intent://join?room=${roomCode}#Intent;package=com.ludo.king;end` 
      : `ludoking://?room_code=${roomCode}`;

    // 2. Try to open the deep link. Using a hidden iframe is a common trick.
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);

    // 3. Set a timer. If the app opens, the 'blur' event will fire and clear this timer.
    // If it doesn't fire, we assume the app didn't open and show our fallback UI.
    const fallbackTimer = setTimeout(() => {
      setShowFallback(true);
      setIsOpening(false);
      document.body.removeChild(iframe);
    }, 2500);

    // 4. Listen for the 'blur' event on the window.
    const handleBlur = () => {
      clearTimeout(fallbackTimer);
      setIsOpening(false);
      // Clean up listeners and iframe
      window.removeEventListener('blur', handleBlur);
      if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
      }
    };
    
    window.addEventListener('blur', handleBlur);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Button
        onClick={openLudoWithFallback}
        disabled={isOpening || !roomCode}
        size="lg"
        className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg"
      >
        {isOpening ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
            <Smartphone className="mr-2 h-5 w-5" />
        )}
        {isOpening ? "Opening Ludo King..." : "Play in Ludo King"}
      </Button>

      {showFallback && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>App did not open automatically</AlertTitle>
          <AlertDescription>
            The room code has been copied. Please paste it in Ludo King manually.
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={copyRoomCode} variant="outline">
                <Copy className="mr-1 h-3 w-3" />
                Copy Again
              </Button>
              <Button size="sm" onClick={downloadLudoKing} variant="secondary">
                <Download className="mr-1 h-3 w-3" />
                Get Ludo King
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

