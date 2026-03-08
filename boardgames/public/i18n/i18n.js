import ja from "./ja.json" assert { type: "json" };
import en from "./en.json" assert { type: "json" };

const translations = { ja, en };

let current_lang = "en";

export function set_lang(lang) {
  current_lang = lang;
}

export function t(path) {
  return path
    .split(".")
    .reduce((obj, key) => obj?.[key], translations[current_lang]);
}
