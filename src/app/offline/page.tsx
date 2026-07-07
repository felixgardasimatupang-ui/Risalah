"use client";

import { WifiOff, RotateCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <WifiOff className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">You are offline</h1>
        <p className="max-w-md text-muted-foreground">
          Some features may be unavailable. Cached meetings and transcripts are still accessible.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <RotateCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
