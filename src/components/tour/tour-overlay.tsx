"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTourStore } from "@/stores/tour-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight, Compass } from "lucide-react";

export function TourOverlay() {
  const { isActive, currentStep, tourSteps, nextStep, prevStep, endTour } = useTourStore();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const updatePosition = useCallback(() => {
    if (!isActive || !tourSteps[currentStep]) return;
    const el = document.querySelector(tourSteps[currentStep].selector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    }
  }, [isActive, currentStep, tourSteps]);

  useEffect(() => {
    updatePosition();
    const handleResize = () => updatePosition();
    window.addEventListener("resize", handleResize);
    const observer = new MutationObserver(updatePosition);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [updatePosition]);

  useEffect(() => {
    if (!isActive) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") endTour();
      if (e.key === "ArrowRight" || e.key === "Enter") nextStep();
      if (e.key === "ArrowLeft") prevStep();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isActive, nextStep, prevStep, endTour]);

  useEffect(() => {
    if (isActive && tourSteps[currentStep]) {
      const el = document.querySelector(tourSteps[currentStep].selector);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        (el as HTMLElement).style.outline = "3px solid var(--color-primary, #2563eb)";
        (el as HTMLElement).style.outlineOffset = "4px";
        (el as HTMLElement).style.borderRadius = "8px";
      }
      return () => {
        if (el) {
          (el as HTMLElement).style.outline = "";
          (el as HTMLElement).style.outlineOffset = "";
          (el as HTMLElement).style.borderRadius = "";
        }
      };
    }
  }, [isActive, currentStep, tourSteps]);

  if (!mounted || !isActive || !tourSteps.length || !targetRect) return null;

  const step = tourSteps[currentStep];
  const isLast = currentStep === tourSteps.length - 1;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const getTooltipStyle = (): React.CSSProperties => {
    const gap = 16;
    const pos = step.position || "bottom";
    const base: React.CSSProperties = { position: "fixed", zIndex: 10001, width: "320px" };

    switch (pos) {
      case "top":
        base.left = Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - 160, window.innerWidth - 336));
        base.top = Math.max(16, targetRect.top - gap - 200);
        break;
      case "bottom":
        base.left = Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - 160, window.innerWidth - 336));
        base.top = Math.min(window.innerHeight - 216, targetRect.bottom + gap);
        break;
      case "left":
        base.left = Math.max(16, targetRect.left - gap - 320);
        base.top = Math.max(16, Math.min(targetRect.top + targetRect.height / 2 - 100, window.innerHeight - 216));
        break;
      case "right":
        base.left = Math.min(window.innerWidth - 336, targetRect.right + gap);
        base.top = Math.max(16, Math.min(targetRect.top + targetRect.height / 2 - 100, window.innerHeight - 216));
        break;
    }
    return base;
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9999] bg-black/50"
        onClick={endTour}
      />
      <Card
        style={getTooltipStyle()}
        className="p-4 space-y-3 shadow-2xl border-primary/20 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            <span className="text-label-xs text-on-surface-variant">
              {currentStep + 1} / {tourSteps.length}
            </span>
          </div>
          <button onClick={endTour} className="text-on-surface-variant hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-1 w-full rounded-full bg-surface-container-high">
          <div className="h-1 rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div>
          <h3 className="font-medium text-on-surface text-sm">{step.title}</h3>
          <p className="mt-1 text-label-sm text-on-surface-variant">{step.content}</p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Button variant="ghost" size="sm" onClick={endTour} className="text-label-xs">
            Skip
          </Button>
          <div className="flex items-center gap-1">
            {currentStep > 0 && (
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" onClick={isLast ? endTour : nextStep}>
              {isLast ? "Selesai" : "Lanjut"}
              {!isLast && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>
    </>,
    document.body
  );
}
