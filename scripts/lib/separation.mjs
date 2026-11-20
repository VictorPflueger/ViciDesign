// Status colours that must stay apart, shared by check-tokens (which fails the build) and the
// Colour page (which shows the measured values). Distances are ΔOK, the Euclidean distance in OKLab.
// [a, b, minimum ΔOK in normal vision, also checked under protan and deutan simulation]
export const SEPARATION = [
  ['accent-text', 'danger-solid', 0.1, false],
  ['accent', 'danger-solid', 0.1, false],
  ['danger-solid', 'success-solid', 0.08, true],
  ['danger-solid', 'warning-solid', 0.08, false],
  ['danger-solid', 'info-solid', 0.08, false],
  ['warning-solid', 'success-solid', 0.08, false],
  ['info-solid', 'success-solid', 0.08, false],
  ['surface-selected', 'danger-bg', 0.04, false],
];
// danger-solid and success-solid must also differ this much in OKLCH lightness, so they stay
// apart for anyone who can't tell red from green.
export const DANGER_SUCCESS_LIGHTNESS_GAP = 0.08;
