import sanitizeHtml from 'sanitize-html';

/**
 * Allowlist-based HTML sanitizer for admin-authored rich text (project description),
 * rendered via mp `<rich-text>` (sandboxed) and H5.
 *
 * sanitize-html (htmlparser2-based, pure CJS, no jsdom) strips <script>, on* handlers,
 * javascript:/data: URLs in href/src, <iframe>/<svg>/<form>/formaction, etc. by default;
 * we additionally restrict to a small tag/attribute allowlist.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'span', 'div',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'img', 'a', 'hr', 'blockquote',
  ],
  allowedAttributes: {
    '*': ['class'],
    a: ['href', 'title'],
    img: ['src', 'alt', 'title'],
  },
  // sanitize-html drops javascript:/vbscript:/data: in href/src by default.
};

export function sanitizeRichText(html: string): string {
  if (!html) return html;
  return sanitizeHtml(html, OPTIONS);
}
