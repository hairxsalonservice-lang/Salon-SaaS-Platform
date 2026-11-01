// Gallery images used to be silently dropped because the schema had no
// `images` path. These tests pin the field so it cannot regress.

const mongoose = require('mongoose');
const Salon = require('../src/models/salon.model');

describe('salon gallery persistence', () => {
  test('keeps a multi-image gallery on the salon document', () => {
    const images = [
      'https://cdn.example.com/salons/a/gallery/front-desk-11111111.webp',
      'https://cdn.example.com/salons/a/gallery/treatment-room-22222222.webp',
    ];

    const salon = new Salon({
      name: 'Test Salon',
      owner: new mongoose.Types.ObjectId(),
      images,
    });

    expect(salon.images).toEqual(images);
  });

  test('defaults to an empty gallery instead of undefined', () => {
    const salon = new Salon({
      name: 'Test Salon',
      owner: new mongoose.Types.ObjectId(),
    });

    expect(salon.images).toEqual([]);
  });
});
