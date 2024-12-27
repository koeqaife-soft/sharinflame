import DOMPurify from "dompurify";

function formatNumber(num: number): string {
  if (num >= 1_000_000_000_000) {
    return (num / 1_000_000_000_000).toFixed(1).replace(/\.0$/, "") + "T";
  }
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

function formatStringForHtml(str: string): string {
  str = DOMPurify.sanitize(str, {
    ALLOWED_TAGS: ["i", "strong", "b", "em", "u", "br", "mark", "blockquote"]
  });

  str = str.replace(/<br>/g, "\n");

  const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/g;
  str = str.replace(urlRegex, (url) => {
    const href = url.startsWith("http") ? url : `https://${url}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="link">${url}</a>`;
  });

  const emojiRegex =
    /([\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2B06}\u{2194}\u{1F004}\u{1F0CF}\u{2764}\u{2B50}\u{1F004}\u{1F004}\u{1F004}])/gu;
  str = str.replace(emojiRegex, (match) => {
    return `<span class="emoji">${match}</span>`;
  });

  str = str.replace(/\n/g, "<br>");

  return str;
}

function formatUnixTime(unixTime: number, locale: string = "en") {
  const date = new Date(unixTime * 1000);
  const formatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return formatter.format(date);
}

export { formatNumber, formatStringForHtml, formatUnixTime };
