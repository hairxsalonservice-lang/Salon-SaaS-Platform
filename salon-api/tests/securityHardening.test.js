// Pure unit coverage for the security helpers added during the audit.
// No database or network access is required for these tests.

const {
  isAllowedOrigin,
  parseAllowedOrigins,
} = require('../src/config/cors');

const {
  validatePresignedUpload,
  MAX_PRESIGNED_UPLOAD_BYTES,
} = require('../src/utils/uploadValidation');

const reportCacheKey = require('../src/utils/reportCacheKey');
const StorageService = require('../src/services/storage.service');

describe('CORS origin policy', () => {
  test('does not trust arbitrary railway.app subdomains', () => {
    expect(
      isAllowedOrigin('https://evil-project.up.railway.app', {
        nodeEnv: 'production',
        allowedOrigins: [],
      }),
    ).toBe(false);
  });

  test('production does not automatically trust localhost', () => {
    expect(
      isAllowedOrigin('http://localhost:3000', {
        nodeEnv: 'production',
        allowedOrigins: [],
      }),
    ).toBe(false);
  });

  test('explicitly allowlisted origins are accepted in production', () => {
    expect(
      isAllowedOrigin('https://admin.example.com', {
        nodeEnv: 'production',
        allowedOrigins: ['https://admin.example.com'],
      }),
    ).toBe(true);
  });

  test('platform-owned domains remain accepted in production', () => {
    expect(
      isAllowedOrigin('https://admin.hairxsalon.com', {
        nodeEnv: 'production',
        allowedOrigins: [],
      }),
    ).toBe(true);
    expect(
      isAllowedOrigin('https://not-hairxsalon.com', {
        nodeEnv: 'production',
        allowedOrigins: [],
      }),
    ).toBe(false);
  });

  test('local development origins are accepted outside production', () => {
    expect(
      isAllowedOrigin('http://localhost:3000', {
        nodeEnv: 'development',
        allowedOrigins: [],
      }),
    ).toBe(true);
    expect(
      isAllowedOrigin('http://192.168.1.10:8081', {
        nodeEnv: 'development',
        allowedOrigins: [],
      }),
    ).toBe(true);
  });

  test('requests without an Origin header are allowed (native clients)', () => {
    expect(
      isAllowedOrigin(undefined, { nodeEnv: 'production', allowedOrigins: [] }),
    ).toBe(true);
  });

  test('parses and trims the ALLOWED_ORIGINS list', () => {
    expect(parseAllowedOrigins(' https://a.com, ,https://b.com ')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });
});

describe('Presigned upload validation', () => {
  const validImage = {
    fileName: 'avatar.png',
    fileType: 'image/png',
    fileSize: 1024,
  };

  test('accepts an allowlisted image with a declared size', () => {
    expect(validatePresignedUpload(validImage)).toEqual({
      valid: true,
      fileType: 'image/png',
      fileSize: 1024,
    });
  });

  test('rejects active content types such as SVG and HTML', () => {
    expect(
      validatePresignedUpload({
        fileName: 'x.svg',
        fileType: 'image/svg+xml',
        fileSize: 100,
      }).valid,
    ).toBe(false);

    expect(
      validatePresignedUpload({
        fileName: 'x.html',
        fileType: 'text/html',
        fileSize: 100,
      }).valid,
    ).toBe(false);
  });

  test('rejects an extension that does not match the declared type', () => {
    expect(
      validatePresignedUpload({
        fileName: 'payload.html',
        fileType: 'image/png',
        fileSize: 100,
      }).valid,
    ).toBe(false);
  });

  test('requires a positive integer fileSize', () => {
    expect(
      validatePresignedUpload({ ...validImage, fileSize: undefined }).valid,
    ).toBe(false);
    expect(
      validatePresignedUpload({ ...validImage, fileSize: 0 }).valid,
    ).toBe(false);
    expect(
      validatePresignedUpload({ ...validImage, fileSize: -5 }).valid,
    ).toBe(false);
    expect(
      validatePresignedUpload({ ...validImage, fileSize: 1.5 }).valid,
    ).toBe(false);
  });

  test('rejects files above the size ceiling', () => {
    expect(
      validatePresignedUpload({
        ...validImage,
        fileSize: MAX_PRESIGNED_UPLOAD_BYTES + 1,
      }).valid,
    ).toBe(false);

    expect(
      validatePresignedUpload({
        ...validImage,
        fileSize: MAX_PRESIGNED_UPLOAD_BYTES,
      }).valid,
    ).toBe(true);
  });

  test('generated keys are tenant-prefixed and never use client paths', async () => {
    const salonId = '64f000000000000000000001';

    const result = await StorageService.generatePresignedUploadUrl({
      fileName: '../../etc/passwd.png',
      fileType: 'image/png',
      fileSize: 2048,
      folder: '../../secret',
      salonId,
    });

    expect(result.key.startsWith(`salons/${salonId}/secret/`)).toBe(true);
    expect(result.key).not.toContain('..');
  });

  test('service refuses invalid types even when called directly', async () => {
    await expect(
      StorageService.generatePresignedUploadUrl({
        fileName: 'shell.php',
        fileType: 'application/x-php',
        fileSize: 10,
        folder: 'uploads',
      }),
    ).rejects.toThrow(/Unsupported file type/);
  });
});

describe('Report cache keys', () => {
  const salonId = '64f000000000000000000100';
  const branchA = '64f000000000000000000101';
  const branchB = '64f000000000000000000102';

  test('two managers in the same salon but different branches get different keys', () => {
    const keyA = reportCacheKey('overview', {
      role: 'manager',
      salonId,
      branchId: branchA,
    });
    const keyB = reportCacheKey('overview', {
      role: 'manager',
      salonId,
      branchId: branchB,
    });

    expect(keyA).not.toBe(keyB);
    expect(keyA).toContain(branchA);
    expect(keyB).toContain(branchB);
  });

  test('owner and manager keys never collide', () => {
    const ownerKey = reportCacheKey('overview', { role: 'owner', salonId });
    const managerKey = reportCacheKey('overview', {
      role: 'manager',
      salonId,
      branchId: branchA,
    });

    expect(ownerKey).not.toBe(managerKey);
  });

  test('date suffix is part of the key', () => {
    const first = reportCacheKey('daily-bookings', {
      role: 'owner',
      salonId,
      suffix: '2026-01-01:2026-01-31',
    });
    const second = reportCacheKey('daily-bookings', {
      role: 'owner',
      salonId,
      suffix: '2026-02-01:2026-02-28',
    });

    expect(first).not.toBe(second);
  });
});
