import { create } from "zustand";

export interface TourStep {
  selector: string;
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface TourState {
  isActive: boolean;
  currentStep: number;
  tourSteps: TourStep[];
  startTour: (steps: TourStep[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
  goToStep: (step: number) => void;
}

export const useTourStore = create<TourState>()((set) => ({
  isActive: false,
  currentStep: 0,
  tourSteps: [],
  startTour: (steps) => set({ isActive: true, currentStep: 0, tourSteps: steps }),
  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, state.tourSteps.length - 1),
      ...(state.currentStep >= state.tourSteps.length - 1 ? { isActive: false } : {}),
    })),
  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    })),
  endTour: () => set({ isActive: false, currentStep: 0, tourSteps: [] }),
  goToStep: (step) => set({ currentStep: step }),
}));
