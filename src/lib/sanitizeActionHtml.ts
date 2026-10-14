import sanitizeHtml from "sanitize-html";

/** El HTML del editor se guarda tal cual lo envía el cliente: hay que sanearlo antes de pintarlo. */
export function sanitizeActionHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "blockquote",
      "ul", "ol", "li", "strong", "b", "em", "i", "u", "s", "a", "code", "pre",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      p: ["style"],
      h1: ["style"], h2: ["style"], h3: ["style"],
      th: ["colspan", "rowspan"], td: ["colspan", "rowspan"],
    },
    allowedStyles: { "*": { "text-align": [/^(left|right|center|justify)$/] } },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
  });
}
