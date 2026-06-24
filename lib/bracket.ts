// Pure knockout-bracket helpers, kept free of any server-only ("use cache")
// code so they can be imported from both Server and Client Components.
import type { BracketSlot, StandingRow } from "./fifa";

// Resolve a knockout placeholder code ("1A", "2F", "3ABCDF") against the current
// group standings: group winners/runners-up project to the team currently in
// that position, while best-third-placed sets stay unresolved but expose each
// candidate group's current third-placed team so the UI can show flags.
export function resolveSlot(
  code: string | null,
  standings: Record<string, StandingRow[]>,
): BracketSlot {
  if (!code) return { code: "", label: "TBD", resolved: false };
  const m = code.match(/^(\d)([A-Z]+)$/i);
  if (!m) return { code, label: code, resolved: false };
  const rank = Number(m[1]);
  const groups = m[2].toUpperCase();

  // Group winners / runners-up resolve to the team currently in that position.
  if ((rank === 1 || rank === 2) && groups.length === 1) {
    const label = `${rank === 1 ? "Winner" : "Runner-up"} ${groups}`;
    const row = standings[groups]?.find((r) => r.position === rank);
    return row
      ? {
          code,
          label,
          resolved: true,
          teamName: row.teamName,
          countryCode: row.countryCode,
          played: row.played,
          clinched: row.qualificationStatus === "ConfirmedQualified",
        }
      : { code, label, resolved: false };
  }
  // Best third-placed qualifiers: FIFA assigns these via a fixed table once the
  // group stage finishes, so the matchup stays unresolved. Surface the current
  // third-placed team of each candidate group so the bracket can show flags.
  const groupCountryCodes = groups
    .split("")
    .map((g) => standings[g]?.find((r) => r.position === 3)?.countryCode)
    .filter((c): c is string => Boolean(c));
  return {
    code,
    label: `3rd ${groups.split("").join("/")}`,
    resolved: false,
    groupCountryCodes,
  };
}
