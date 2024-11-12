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
  const allowedTags = /^<\/?(i|b|strong|em|u|br)>$/;

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

    return match.replace(/([&<>"'])/g, (m) => map[m] || m);
  });

  str = str.replace(/\n/g, "<br>");

  return str;
}

export { formatNumber, formatStringForHtml };
