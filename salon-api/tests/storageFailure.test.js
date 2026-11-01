// Provider failures used to bubble up as an opaque 500 ("Cloud storage upload
// failed: Unauthorized"). These tests pin the user-facing contract instead:
// a 503 with a safe message, while the provider detail stays in the logs.

const mockSend = jest.fn();

jest.mock('../src/config/r2.config', () => ({
  s3Client: { send: (...args) => mockSend(...args) },
  bucketName: 'test-bucket',
  publicDomain: 'https://cdn.example.test',
  isConfigured: true,
}));

const StorageService = require('../src/services/storage.service');

const providerError = (httpStatusCode, message = 'Unauthorized') =>
  Object.assign(new Error(message), {
    name: 'Unauthorized',
    $metadata: { httpStatusCode },
  });

const uploadPdf = () =>
  StorageService.uploadBuffer({
    buffer: Buffer.from('%PDF-1.4 test'),
    originalName: 'test.pdf',
    mimeType: 'application/pdf',
    folder: 'test',
  });

describe('storage provider failures', () => {
  test('401 from the provider is reported as a 503 configuration error', async () => {
    mockSend.mockRejectedValueOnce(providerError(401));

    await expect(uploadPdf()).rejects.toMatchObject({
      statusCode: 503,
      code: 'STORAGE_UNAUTHORIZED',
    });
  });

  test('does not leak provider wording to the client', async () => {
    mockSend.mockRejectedValueOnce(providerError(401));

    const error = await uploadPdf().then(
      () => {
        throw new Error('expected upload to fail');
      },
      (err) => err,
    );

    expect(error.message).not.toMatch(/Unauthorized/i);
    expect(error.message).toMatch(/configuration error/i);
    expect(error.cause).toBeDefined();
  });

  test('other provider failures are reported as temporary unavailability', async () => {
    mockSend.mockRejectedValueOnce(providerError(500, 'InternalError'));

    await expect(uploadPdf()).rejects.toMatchObject({
      statusCode: 503,
      code: 'STORAGE_UNAVAILABLE',
    });
  });
});

describe('R2 connectivity diagnostics', () => {
  test('reports UNAUTHORIZED when the bucket rejects the credentials', async () => {
    mockSend.mockRejectedValueOnce(providerError(401));

    const result = await StorageService.checkConnectivity({ cacheTtlMs: 0 });

    expect(result).toMatchObject({
      configured: true,
      reachable: false,
      status: 'UNAUTHORIZED',
      httpStatus: 401,
    });
  });

  test('reports CONNECTED when the bucket is reachable', async () => {
    mockSend.mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } });

    const result = await StorageService.checkConnectivity({ cacheTtlMs: 0 });

    expect(result).toMatchObject({
      configured: true,
      reachable: true,
      status: 'CONNECTED',
    });
  });
});
