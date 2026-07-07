import { useUiStore } from "@/stores/ui-store";
import { translations } from "@/lib/i18n";

type TranslationPath = string;

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === "string" ? current : path;
}

export function useTranslation() {
  const language = useUiStore((s) => s.language);
  const lang = language || "id";
  const dict = translations[lang] || translations.id;

  const t = (path: TranslationPath, params?: Record<string, string>): string => {
    let text = getNestedValue(dict as unknown as Record<string, unknown>, path);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        text = text.replace(`{{${key}}}`, value);
      }
    }
    return text;
  };

  return { t, language: lang };
}
