// Lightweight typed i18n solution. All UI strings live in locales/fa/common.json.
import fa from "@/locales/fa/common.json";

type Dictionary = { [key: string]: string | Dictionary };

const dictionaries: Record<string, Dictionary> = { fa };

export type Locale = keyof typeof dictionaries;

/**
 * Translate a dotted key path, e.g. t("common.loading").
 * Returns the key itself when missing (easy to spot during development).
 */
export function t(key: string, locale: Locale = "fa"): string {
  let node: string | Dictionary | undefined = dictionaries[locale];
  for (const part of key.split(".")) {
    if (node && typeof node === "object" && !(node instanceof String)) {
      node = node[part];
    } else {
      return key;
    }
  }
  return typeof node === "string" ? node : key;
}

/**
 * Interpolate placeholders like {count} inside translated strings.
 */
export function tf(key: string, params: Record<string, string | number>, locale: Locale = "fa"): string {
  let result = t(key, locale);
  for (const [name, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${name}\\}`, "g"), String(value));
  }
  return result;
}
