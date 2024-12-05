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
  // NOTE: this code is for “just in case”, mostly the server will handle XSS attacks
  const allowedTags = /^<\/?(i|b|strong|em|u|br|mark|blockquote)>$/;

  str = str.replace(/<br>/g, "\n");

  str = str.replace(/<\/?([a-zA-Z]+)[^>]*>|[^<]+/g, (match) => {
    if (allowedTags.test(match)) {
      return match;
    }

    const map: { [key: string]: string } = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;"
    };

    return match.replace(/([&<>"'])/g, (m) => {
      if (m === "&" && /&(?:amp|lt|gt|quot|#x27);/i.test(match)) {
        return m;
      }
      return map[m] || m;
    });
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
