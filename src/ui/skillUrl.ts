/** Resolve the hosted skill without leaking board query strings or changing origin. */
export function skillUrl(base = location.href): string {
  return new URL("./skills/sketch-lab/SKILL.md", base).href;
}
