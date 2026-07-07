import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface OnboardingStep {
  id: string;
  title: string;
  completed: boolean;
}

interface OnboardingState {
  hasSeenOnboarding: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  completeStep: (id: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  dismiss: () => void;
  reset: () => void;
}

const defaultSteps: OnboardingStep[] = [
  { id: "welcome", title: "Selamat Datang", completed: false },
  { id: "profile", title: "Lengkapi Profil", completed: false },
  { id: "upload", title: "Upload Meeting Pertama", completed: false },
  { id: "explore", title: "Jelajahi Fitur", completed: false },
];

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      currentStep: 0,
      steps: defaultSteps,
      completeStep: (id) =>
        set((state) => ({
          steps: state.steps.map((s) => (s.id === id ? { ...s, completed: true } : s)),
        })),
      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, state.steps.length),
        })),
      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        })),
      dismiss: () => set({ hasSeenOnboarding: true }),
      reset: () =>
        set({
          hasSeenOnboarding: false,
          currentStep: 0,
          steps: defaultSteps.map((s) => ({ ...s, completed: false })),
        }),
    }),
    { name: "risalah-onboarding" }
  )
);
