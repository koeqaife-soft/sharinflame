import DOMPurify from "dompurify";

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

// URL_REGEX is separate from COMBINED_REGEX because not all links work correctly
const URL_REGEX = /https?:\/\/[^\s<]+|www\.[^\s<]+/giu;
const COMBINED_REGEX = new RegExp(`(${emojiRanges.join("|")})|(\n)`, "giu");

// Remove emojiRanges from memory since it is not used
emojiRanges.length = 0;
emojiRanges = null;

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

const sanitize = DOMPurify.sanitize.bind(DOMPurify);

export function formatNumber(num: number): string {
  if (num < 1_000) return num.toString();
  for (const { limit, suffix } of NUMBER_FORMATTERS) {
    if (num >= limit) {
      const formatted = Math.floor((num / limit) * 10) / 10;
      return formatted + suffix;
    }
  }
  return num.toString();
}

export function formatStringForHtml(str: string): string {
  const sanitized = sanitize(str, { ALLOWED_TAGS: ALLOWED_TAGS as string[] });

  // First, replace URLs with links
  let result = sanitized.replace(URL_REGEX, (match) => {
    const href = match.startsWith("http") ? match : `https://${match}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="link">${match}</a>`;
  });

  // Then, replace emojis and newlines
  result = result.replace(COMBINED_REGEX, (...args) => {
    const match = args[0];
    // args[1] -> Emoji,
    // args[2] -> Newlines.
    if (args[1]) {
      return `<span class="emoji">${match}</span>`;
    } else if (args[2]) {
      return "<br>";
    }
    return match;
  });

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
