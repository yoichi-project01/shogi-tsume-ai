"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

interface AdBannerProps {
  slot?: string;
  className?: string;
}

/**
 * Renders a placeholder box until an AdSense client ID is configured
 * (NEXT_PUBLIC_ADSENSE_CLIENT_ID); once set, requests a real ad unit.
 */
export default function AdBanner({ slot, className = "" }: AdBannerProps) {
  useEffect(() => {
    if (!ADSENSE_CLIENT_ID) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not loaded yet (e.g. blocked by an ad blocker); ignore.
    }
  }, []);

  if (!ADSENSE_CLIENT_ID) {
    return (
      <div
        className={`flex h-24 w-full items-center justify-center rounded border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400 ${className}`}
      >
        広告枠{slot ? ` (${slot})` : ""}
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
