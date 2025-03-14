import DOMPurify from "dompurify";
import { formatCache, formatNumCache, simpleHash256 } from "./cache";

const NUMBER_FORMATTERS = Object.freeze([
  Object.freeze({ limit: 1_000_000_000_000, suffix: "T" }),
  Object.freeze({ limit: 1_000_000_000, suffix: "B" }),
  Object.freeze({ limit: 1_000_000, suffix: "M" }),
  Object.freeze({ limit: 1_000, suffix: "K" })
]);

const ALLOWED_TAGS = Object.freeze(["i", "strong", "b", "em", "u", "br", "mark", "blockquote"]);

let emojiRanges: string[] | null = [
  "[\\u{1F300}-\\u{1F5FF}]",
  "[\\u{1F600}-\\u{1F64F}]",
  "[\\u{1F680}-\\u{1F6FF}]",
  "[\\u{1F700}-\\u{1F77F}]",
  "[\\u{1F780}-\\u{1F7FF}]",
  "[\\u{1F800}-\\u{1F8FF}]",
  "[\\u{1F900}-\\u{1F9FF}]",
  "[\\u{1FA00}-\\u{1FA6F}]",
  "[\\u{1FA70}-\\u{1FAFF}]",
  "[\\u{2600}-\\u{26FF}]",
  "[\\u{2700}-\\u{27BF}]",
  "[\\u{2300}-\\u{23FF}]",
  "\\u{2B50}",
  "\\u{2B06}",
  "\\u{2194}",
  "\\u{1F004}",
  "\\u{1F0CF}",
  "\\u{2764}"
];

const URL_REGEX = /https?:\/\/[^\s<]+|www\.[^\s<]+/giu;
const EMOJI_REGEX = new RegExp(emojiRanges.join("|"), "giu");
const THREE_NEWLINES_REGEX = /\n{3,}/g;
const NEWLINE_REGEX = /\n/g;

// Remove emojiRanges from memory since it is not used
emojiRanges.length = 0;
emojiRanges = null;

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

const sanitize = DOMPurify.sanitize.bind(DOMPurify);

export function formatNumber(num: number): string {
  if (formatNumCache.has(num)) return formatNumCache.get(num)!;

  if (num < 1_000) {
    const result = num.toString();
    formatNumCache.put(num, result);
    return result;
  }
  for (const { limit, suffix } of NUMBER_FORMATTERS) {
    if (num >= limit) {
      const formatted = Math.floor((num / limit) * 10) / 10;
      return formatted + suffix;
    }
  }

  const result = num.toString();
  formatNumCache.put(num, result);

  return result;
}

export function formatStringForHtml(str: string) {
  const hash = simpleHash256(str);
  if (formatCache.has(hash)) return formatCache.get(hash)!;

  const sanitized = sanitize(str, { ALLOWED_TAGS: ALLOWED_TAGS as string[] });

  let result = sanitized.replace(URL_REGEX, (match) => {
    const href = match.startsWith("http") ? match : `https://${match}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="link">${match}</a>`;
  });

  result = result.replace(EMOJI_REGEX, (match) => {
    return `<span class="emoji">${match}</span>`;
  });

  result = result
    .trim()
    .replace(THREE_NEWLINES_REGEX, () => "\n\n")
    .replace(NEWLINE_REGEX, () => "<br>");

  formatCache.put(hash, result);

  return result;
}

export function formatUnixTime(unixTime: number, locale: string = "en"): string {
  const date = new Date(unixTime * 1000);
  let formatter = dateFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    dateFormatters.set(locale, formatter);
  }
  return formatter.format(date);
}
