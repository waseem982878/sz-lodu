
"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Gamepad2 } from "lucide-react";

/*
 Props:
  - roomCode (string) : required
  - label (string) : optional (default "Play in Ludo King")
  - className (string) : optional extra classes for wrapper
*/
export default function LudoLaunchButton({
  roomCode,
  label = "Play on Ludo King",
  openTimeout = 1400,
  className = "",
}: {
  roomCode: string;
  label?: string;
  openTimeout?: number;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"copied" | "opened" | null>(null);

  const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.ludo.king";
  const APP_STORE_URL = "https://apps.apple.com/app/ludo-king/id993090504";

  // A simpler, more universal deep link format.
  const CUSTOM_SCHEME = `ludoking://?room_code=${encodeURIComponent(roomCode)}`;

  const handleClick = async () => {
    if (!roomCode || busy) return;
    setBusy(true);
    setStatus(null);

    // 1. Always copy to clipboard first as a reliable fallback.
    try {
      await navigator.clipboard.writeText(roomCode);
      setStatus("copied");
    } catch (e) {
      console.warn("Clipboard copy failed. This might happen on non-secure (http) pages.", e);
      // Fallback for older browsers or non-secure contexts
      try {
        const ta = document.createElement("textarea");
        ta.value = roomCode;
        ta.style.position = 'fixed'; // Avoid scrolling to bottom
        ta.style.top = '0';
        ta.style.left = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setStatus("copied");
      } catch (copyErr) {
        console.warn("Fallback clipboard copy also failed.", copyErr);
      }
    }

    // 2. Try to open the app using the universal custom scheme.
    window.location.href = CUSTOM_SCHEME;

    // 3. After a timeout, update the status to show the fallback link.
    // This assumes if the app opened, the user has switched away.
    // If it didn't open, the user is still on the page to see the link.
    setTimeout(() => {
      setBusy(false);
      setStatus("opened");
    }, openTimeout);
  };

  const getStoreUrl = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/android/i.test(userAgent)) return PLAY_STORE_URL;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) return APP_STORE_URL;
    return PLAY_STORE_URL; // Default to Play Store
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <button
        onClick={handleClick}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-transform disabled:bg-green-600/50 disabled:cursor-not-allowed"
        title="Copies room code and opens Ludo King"
      >
        <Gamepad2 className="w-5 h-5"/>
        <span>{busy ? "Opening..." : label}</span>
      </button>

      <div className="text-xs text-center text-muted-foreground h-4">
        {status === "copied" && (
          <span className="text-green-500 transition-opacity duration-300">✓ Room code copied! Opening Ludo King...</span>
        )}
        {status === "opened" && (
          <span className="transition-opacity duration-300">If app didn't open, <a className="underline" href={getStoreUrl()} target="_blank" rel="noreferrer">install/open from store</a>.</span>
        )}
      </div>
    </div>
  );
}

    