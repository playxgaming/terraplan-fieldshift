/** V3 model constants only. Scoring is deliberately deferred to later build steps. */
export const MODEL = Object.freeze({
  effective_rain_factor: 0.65,
  dry_day_mm: 2.5,
  heavy_rain_mm: 64.5,
  infeasible_gap: 0.40,
  cover_possible_fit: 60,
  penalty_same_family: 8,
  bonus_nfixer_after_heavy: 6,
  penalty_bare_when_possible: 6,
  vuln_heat_days: 3,
  vuln_cold_days: 2,
  vuln_dry_spell: 10,
  vuln_heavy_days: 1,
});
