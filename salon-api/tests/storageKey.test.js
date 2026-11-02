// Object keys are the public storage contract: every upload must land in a
// predictable, tenant-scoped folder no matter what the client sends.

const {
  buildObjectKey,
  normalizeCategory,
  slugify,
  resolveExtension,
  shortHash,
  createBatchId,
  formatBranchAddress,
  DEFAULT_CATEGORY,
} = require('../src/utils/storageKey');

const SALON = '64f000000000000000000001';
const BRANCH = '64f000000000000000000002';
const USER = '64f000000000000000000003';

const NAMING = {
  salonName: 'Nishit Pattnaik',
  ownerName: 'Ramesh Pattnaik',
  contextBranchName: 'Bandra West',
  contextBranchAddress: 'Mumbai Maharashtra',
};

const SALON_FOLDER =
  `salons/nishit-pattnaik_ramesh-pattnaik_bandra-west_mumbai-maharashtra_${shortHash(SALON)}`;

const build = (overrides = {}) =>
  buildObjectKey({
    category: 'gallery',
    originalName: 'Front Desk Photo.PNG',
    mimeType: 'image/png',
    salonId: SALON,
    ...overrides,
  });

describe('storage object keys', () => {
  test('falls back to salons/{salonId}/gallery when no naming context exists', () => {
    const key = build({ hash: 'abcd1234' });

    expect(key).toBe(
      `salons/${SALON}/gallery/front-desk-photo-abcd1234.png`,
    );
  });

  test('uses readable salon, owner, branch and location names', () => {
    const key = build({
      ...NAMING,
      batchId: '2026-11-02_abcd1234',
      sequence: 1,
    });

    expect(key).toBe(
      `${SALON_FOLDER}/gallery/2026-11-02_abcd1234/1.png`,
    );
  });

  test('does not repeat an owner name that matches the salon name', () => {
    const key = build({
      salonName: 'Nishit Pattnaik',
      ownerName: 'Nishit Pattnaik',
      batchId: '2026-11-02_abcd1234',
      sequence: 1,
    });

    expect(key).toBe(
      `salons/nishit-pattnaik_${shortHash(SALON)}/gallery/2026-11-02_abcd1234/1.png`,
    );
  });

  test('numbers files inside one upload batch', () => {
    const first = build({
      ...NAMING,
      batchId: '2026-11-02_abcd1234',
      sequence: 1,
    });
    const second = build({
      ...NAMING,
      batchId: '2026-11-02_abcd1234',
      sequence: 2,
    });

    expect(first).toBe(`${SALON_FOLDER}/gallery/2026-11-02_abcd1234/1.png`);
    expect(second).toBe(`${SALON_FOLDER}/gallery/2026-11-02_abcd1234/2.png`);
  });

  test('branding images are separated from gallery images', () => {
    const key = build({
      category: 'branding',
      ...NAMING,
      batchId: '2026-11-02_abcd1234',
      sequence: 1,
    });

    expect(key).toBe(
      `${SALON_FOLDER}/branding/2026-11-02_abcd1234/1.png`,
    );
  });

  test('logo and cover categories share the branding folder', () => {
    for (const category of ['logo', 'cover']) {
      const key = build({
        category,
        ...NAMING,
        batchId: '2026-11-02_abcd1234',
        sequence: 1,
      });

      expect(key).toBe(
        `${SALON_FOLDER}/branding/2026-11-02_abcd1234/1.png`,
      );
    }
  });

  test('service images include the readable branch when one is available', () => {
    const withBranch = build({
      category: 'services',
      branchId: BRANCH,
      ...NAMING,
      branchName: 'Bandra West',
      branchAddress: 'Mumbai Maharashtra',
      batchId: '2026-11-02_abcd1234',
      sequence: 1,
    });
    const withoutBranch = build({
      category: 'services',
      ...NAMING,
      batchId: '2026-11-02_abcd1234',
      sequence: 1,
    });

    expect(withBranch).toBe(
      `${SALON_FOLDER}/branches/bandra-west_mumbai-maharashtra_${shortHash(BRANCH)}/services/2026-11-02_abcd1234/1.png`,
    );
    expect(withoutBranch).toBe(
      `${SALON_FOLDER}/services/2026-11-02_abcd1234/1.png`,
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
    const key = build({
      ...NAMING,
      extension: 'webp',
      batchId: '2026-11-02_abcd1234',
      sequence: 1,
    });

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

  test('different salons with the same names get different folders', () => {
    const otherSalon = '64f000000000000000000009';
    const first = buildObjectKey({
      ...NAMING,
      category: 'gallery',
      originalName: 'photo.png',
      mimeType: 'image/png',
      salonId: SALON,
      batchId: '2026-11-02_abcd1234',
      sequence: 1,
    });
    const second = buildObjectKey({
      ...NAMING,
      category: 'gallery',
      originalName: 'photo.png',
      mimeType: 'image/png',
      salonId: otherSalon,
      batchId: '2026-11-02_abcd1234',
      sequence: 1,
    });

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

  test('batch ids are date-prefixed and unique', () => {
    const batch = createBatchId(new Date('2026-11-02T12:00:00Z'));

    expect(batch).toMatch(/^2026-11-02_[a-f0-9]{8}$/);
    expect(createBatchId()).not.toBe(createBatchId());
  });

  test('address folders never include the street or pincode', () => {
    expect(
      formatBranchAddress({
        street: '12 Hill Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
      }),
    ).toBe('Mumbai Maharashtra');
  });
});
