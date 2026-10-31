/**
 * What may be reported as usage statistics, and how a page address is reported.
 * Kept free of the browser so the privacy rule (FR-MEAS-03) can be tested as plain functions.
 */

export type GameAddedMethod = 'manual' | 'seed' | 'scan';

/** The only events that are ever sent, with the only parameters each may carry. */
export interface AnalyticsEventParams {
  play_saved: undefined;
  share_sheet_opened: undefined;
  share_link_opened: undefined;
  share_link_added: undefined;
  game_added: { method: GameAddedMethod };
  catalog_exported: undefined;
  kakao_list_shared: undefined;
  backup_exported: undefined;
  backup_restored: undefined;
  play_photo_added: { count: number };
}

export type AnalyticsEventName = keyof AnalyticsEventParams;

/** A parameter is either a fixed list of allowed strings or a whole number in an inclusive range. */
type ParamRule = readonly string[] | { min: number; max: number };

const MAX_PHOTOS_PER_PLAY = 6;

const EVENT_RULES: Record<AnalyticsEventName, Record<string, ParamRule>> = {
  play_saved: {},
  share_sheet_opened: {},
  share_link_opened: {},
  share_link_added: {},
  game_added: { method: ['manual', 'seed', 'scan'] },
  catalog_exported: {},
  kakao_list_shared: {},
  backup_exported: {},
  backup_restored: {},
  play_photo_added: { count: { min: 1, max: MAX_PHOTOS_PER_PLAY } }
};

export interface ValidatedEvent {
  name: AnalyticsEventName;
  params: Record<string, string | number>;
}

const isEventName = (name: string): name is AnalyticsEventName => Object.hasOwn(EVENT_RULES, name);

function matchesRule(value: unknown, rule: ParamRule): value is string | number {
  if (Array.isArray(rule)) return typeof value === 'string' && rule.includes(value);
  const { min, max } = rule as { min: number; max: number };
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

/**
 * Null for an unknown event, an unknown or out-of-range parameter, or a missing parameter. Anything
 * else (a title, a name, a place) is refused here rather than trusted to every call site.
 */
export function validateEvent(name: string, params?: Record<string, unknown>): ValidatedEvent | null {
  if (!isEventName(name)) return null;
  const rules = EVENT_RULES[name];
  const given = params ?? {};
  if (Object.keys(given).some((key) => !Object.hasOwn(rules, key))) return null;

  const clean: Record<string, string | number> = {};
  for (const [key, rule] of Object.entries(rules)) {
    const value = given[key];
    if (!matchesRule(value, rule)) return null;
    clean[key] = value;
  }
  return { name, params: clean };
}

/**
 * A shared play travels in the `#play=` fragment and holds friends' names, so the fragment must never
 * reach an analytics service; the query string stays because campaign tags live there.
 */
export const safePageLocation = (href: string): string => href.split('#')[0];

/** Local servers are not real visits: nothing is injected there, which also keeps the dev console clean. */
export const isLocalHost = (hostname: string): boolean =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.endsWith('.localhost');

/** A GA4 web measurement id; anything else is treated as "not configured". */
export const isMeasurementId = (value: string | undefined): value is string => /^G-[A-Z0-9]{4,}$/.test(value ?? '');
