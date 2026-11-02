import { generateMapHtml } from '../src/services/mapService';

describe('mapService.generateMapHtml', () => {
  const base = {
    centerLat: 20.2961,
    centerLng: 85.8245,
    salons: [],
  };

  test('omits the user marker when there is no GPS fix', () => {
    const html = generateMapHtml({ ...base, userLat: null, userLng: null });

    expect(html).not.toContain('var userIcon');
    expect(html).not.toContain('L.marker([null, null]');
  });

  test('draws the user marker at the real GPS coordinates', () => {
    const html = generateMapHtml({
      ...base,
      userLat: 20.3012,
      userLng: 85.8301,
    });

    expect(html).toContain('var userIcon');
    expect(html).toContain('L.marker([20.3012, 85.8301]');
  });
});
