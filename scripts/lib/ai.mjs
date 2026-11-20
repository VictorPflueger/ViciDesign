// The AI-notice rule as a pure function, so a prototype's own tests can import it without running the
// docs checks: import { aiNoticeProblems } from '<ViciDesign>/scripts/lib/ai.mjs'.
// scripts/check-ai.mjs runs it with a self-test over every page and starter.
//
// A page can start a live run with a model when its content security policy lets it connect to a
// model's API, or when an element carries data-vc-live. Such a page says so in its markup, in the
// fixed words: "You are interacting with an AI system" (in German: "Sie interagieren mit einem
// KI-System"), and nothing the agent prepares leaves it without a person's approval.

/** Hosts of model APIs that a browser page could call directly. */
export const MODEL_HOSTS = ['api.anthropic.com', 'api.openai.com', 'generativelanguage.googleapis.com', 'api.mistral.ai', 'api.cohere.com', 'openai.azure.com'];

/** The fixed words of the notice, English and German. */
export const AI_NOTICE = { en: 'You are interacting with an AI system', de: 'Sie interagieren mit einem KI-System' };

const visible = (html) => html
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<(script|style|template|pre|code)\b[\s\S]*?<\/\1>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .replace(/\s+/g, ' ');

/** True when the page can start a live run with a model. */
export function canRunLive(html) {
  const csp = (html.match(/<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*content="([^"]*)"/i) || [])[1] || '';
  const connect = (csp.match(/connect-src([^;]*)/) || [])[1] || '';
  return MODEL_HOSTS.some((h) => connect.includes(h)) || /\bdata-vc-live\b/.test(html);
}

/** Problems with the AI notice in one HTML page; an empty list means the page keeps the rule. */
export function aiNoticeProblems(html) {
  if (!canRunLive(html)) return [];
  const text = visible(html);
  if (!text.includes(AI_NOTICE.en) && !text.includes(AI_NOTICE.de)) {
    return [`the page can start a live run with a model but never says "${AI_NOTICE.en}"`];
  }
  return [];
}
