import { describe, expect, it } from 'vitest';
import { isLocalHost, isMeasurementId, safePageLocation, validateEvent } from './analyticsEvents';

describe('validateEvent (FR-MEAS-03: only listed events and values leave the browser)', () => {
  it.each([
    'play_saved',
    'share_sheet_opened',
    'share_link_opened',
    'share_link_added',
    'catalog_exported',
    'kakao_list_shared',
    'backup_exported',
    'backup_restored'
  ])('accepts %s with no parameters', (name) => {
    expect(validateEvent(name)).toEqual({ name, params: {} });
    expect(validateEvent(name, {})).toEqual({ name, params: {} });
  });

  it('accepts game_added only with a known method', () => {
    for (const method of ['manual', 'seed', 'scan']) {
      expect(validateEvent('game_added', { method })).toEqual({ name: 'game_added', params: { method } });
    }
    expect(validateEvent('game_added', { method: 'import' })).toBeNull();
    expect(validateEvent('game_added', { method: 3 })).toBeNull();
    expect(validateEvent('game_added')).toBeNull();
  });

  it('accepts play_photo_added only with a whole count from 1 to 6', () => {
    expect(validateEvent('play_photo_added', { count: 1 })).toEqual({ name: 'play_photo_added', params: { count: 1 } });
    expect(validateEvent('play_photo_added', { count: 6 })).toEqual({ name: 'play_photo_added', params: { count: 6 } });
    for (const count of [0, 7, 2.5, Number.NaN, '3', null]) {
      expect(validateEvent('play_photo_added', { count })).toBeNull();
    }
  });

  it('refuses an unknown event, including names that look like built-in object keys', () => {
    expect(validateEvent('page_view')).toBeNull();
    expect(validateEvent('')).toBeNull();
    expect(validateEvent('toString')).toBeNull();
    expect(validateEvent('__proto__')).toBeNull();
  });

  it('refuses any extra parameter, which is how a name, title or place would sneak out', () => {
    expect(validateEvent('play_saved', { gameTitle: '카탄' })).toBeNull();
    expect(validateEvent('play_saved', { participants: ['민수'] })).toBeNull();
    expect(validateEvent('game_added', { method: 'manual', title: '카탄' })).toBeNull();
    expect(validateEvent('play_photo_added', { count: 2, caption: '민수 얼굴' })).toBeNull();
  });

  it('returns only the listed parameters', () => {
    const event = validateEvent('game_added', { method: 'seed' });
    expect(Object.keys(event?.params ?? {})).toEqual(['method']);
  });
});

describe('safePageLocation', () => {
  it('drops the #fragment where a shared play travels', () => {
    expect(safePageLocation('https://board-log.vercel.app/#play=abc123')).toBe('https://board-log.vercel.app/');
  });

  it('keeps the path and the query string', () => {
    expect(safePageLocation('https://x.app/a?utm_source=kakao#play=abc')).toBe('https://x.app/a?utm_source=kakao');
  });

  it('leaves an address without a fragment unchanged', () => {
    expect(safePageLocation('https://x.app/')).toBe('https://x.app/');
  });
});

describe('isLocalHost', () => {
  it.each(['localhost', '127.0.0.1', '[::1]', 'app.localhost'])('treats %s as local', (host) => {
    expect(isLocalHost(host)).toBe(true);
  });

  it.each(['board-log.vercel.app', 'example.com', 'notlocalhost.com'])('treats %s as a real host', (host) => {
    expect(isLocalHost(host)).toBe(false);
  });
});

describe('isMeasurementId', () => {
  it.each(['G-ABCD1234', 'G-1A2B3C4D5E'])('accepts %s', (id) => {
    expect(isMeasurementId(id)).toBe(true);
  });

  it.each([undefined, '', 'UA-12345-1', 'G-', 'g-abcd1234', 'G-AB', ' G-ABCD1234', 'G-ABCD1234; alert(1)'])(
    'rejects %j',
    (id) => {
      expect(isMeasurementId(id)).toBe(false);
    }
  );
});
