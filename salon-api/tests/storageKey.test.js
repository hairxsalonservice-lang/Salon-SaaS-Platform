// Object keys are the public storage contract: every upload must land in a
// predictable, tenant-scoped folder no matter what the client sends.

const {
  buildObjectKey,
  normalizeCategory,
  slugify,
  resolveExtension,
  DEFAULT_CATEGORY,
} = require('../src/utils/storageKey');

const SALON = '64f000000000000000000001';
const BRANCH = '64f000000000000000000002';
const USER = '64f000000000000000000003';

const build = (overrides = {}) =>
  buildObjectKey({
    category: 'gallery',
    originalName: 'Front Desk Photo.PNG',
    mimeType: 'image/png',
    salonId: SALON,
    ...overrides,
  });

describe('storage object keys', () => {
  test('salon gallery images live under salons/{salonId}/gallery', () => {
    const key = build({ hash: 'abcd1234' });

    expect(key).toBe(
      `salons/${SALON}/gallery/front-desk-photo-abcd1234.png`,
    );
  });

  test('branding images are separated from gallery images', () => {
    const key = build({ category: 'branding', hash: 'abcd1234' });

    expect(key).toBe(
      `salons/${SALON}/branding/front-desk-photo-abcd1234.png`,
    );
  });

  test('logo and cover categories share the branding folder', () => {
    for (const category of ['logo', 'cover']) {
      const key = build({ category, hash: 'abcd1234' });

      expect(key).toBe(
        `salons/${SALON}/branding/front-desk-photo-abcd1234.png`,
      );
    }
  });

  test('service images include the branch when one is available', () => {
    const withBranch = build({
      category: 'services',
      branchId: BRANCH,
      hash: 'abcd1234',
    });
    const withoutBranch = build({
      category: 'services',
      hash: 'abcd1234',
    });

    expect(withBranch).toBe(
      `salons/${SALON}/branches/${BRANCH}/services/front-desk-photo-abcd1234.png`,
    );
    expect(withoutBranch).toBe(
      `salons/${SALON}/services/front-desk-photo-abcd1234.png`,
    );
  });

  test('user avatars are scoped to the user', () => {
    const key = build({
      category: 'avatars',
      salonId: undefined,
      userId: USER,
      hash: 'abcd1234',
    });

    expect(key).toBe(`users/${USER}/avatars/front-desk-photo-abcd1234.png`);
  });

  test('platform banners are separated from salon banners', () => {
    const platform = build({
      category: 'platform-banners',
      salonId: undefined,
      userId: USER,
      hash: 'abcd1234',
    });
    const salon = build({ category: 'banners', hash: 'abcd1234' });

    expect(platform).toBe('platform/banners/front-desk-photo-abcd1234.png');
    expect(salon).toBe(
      `salons/${SALON}/banners/front-desk-photo-abcd1234.png`,
    );
  });

  test('optimized images use the extension from the encoder', () => {
    const key = build({ extension: 'webp', hash: 'abcd1234' });

    expect(key.endsWith('.webp')).toBe(true);
  });

  test('unknown categories fall back to misc instead of inventing folders', () => {
    expect(normalizeCategory('../../etc')).toBe(DEFAULT_CATEGORY);
    expect(normalizeCategory('not-a-category')).toBe(DEFAULT_CATEGORY);

    const key = build({ category: '../../etc', hash: 'abcd1234' });

    expect(key).toBe(`salons/${SALON}/misc/front-desk-photo-abcd1234.png`);
  });

  test('two uploads of the same filename never collide', () => {
    const first = build();
    const second = build();

    expect(first).not.toBe(second);
  });

  test('slugify removes unsafe characters and traversal segments', () => {
    expect(slugify('../../etc/passwd')).toBe('etc-passwd');
    expect(slugify('  My Salon Logo!!  ')).toBe('my-salon-logo');
    expect(slugify('')).toBe('file');
  });

  test('extension falls back to the mime type when the name has none', () => {
    expect(resolveExtension('photo', 'image/jpeg')).toBe('jpg');
    expect(resolveExtension('photo.webp', 'image/png')).toBe('webp');
  });
});
