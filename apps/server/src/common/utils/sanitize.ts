/**
 * Defense-in-depth HTML sanitizer for admin-authored rich text (e.g. project description).
 * Strips script/iframe/object/embed/link/meta/style tags, on* event handlers, and
 * javascript:/vbscript: protocols.
 *
 * NOT a full sanitizer — the mp-weixin `<rich-text>` is additionally sandboxed by the
 * WeChat runtime (no JS execution). This protects the H5 build and any other client.
 * For full safety, integrate DOMPurify (jsdom) server-side in a later hardening pass.
 */
export function sanitizeRichText(html: string): string {
  if (!html) return html;
  return html
    .replace(/<\s*script[\s\S]*?<\/\s*script\s*>/gi, '')
    .replace(/<\s*\/?\s*(script|iframe|object|embed|link|meta|style)\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(javascript|vbscript)\s*:/gi, '$1blocked:');
}
