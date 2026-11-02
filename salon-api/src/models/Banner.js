// salon-api/src/models/Banner.js
const mongoose = require('mongoose');
const publicIdPlugin = require("../plugins/publicIdPlugin");
const { PUBLIC_ID_PREFIXES } = require("../utils/publicId");

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    details: { type: String },
    tag: { type: String, default: 'SPECIAL OFFER' },
    ctaText: { type: String, default: 'Claim discount' },
    imageUrl: { type: String },
    promoCode: { type: String },
    discountPercentage: { type: Number },
    targetType: {
      type: String,
      enum: ['EXPLORE', 'CATEGORY', 'SALON', 'DISCOUNT'],
      default: 'EXPLORE',
    },
    targetId: { type: String },
    category: { type: String },
    city: { type: String },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    clickCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bannerSchema.index({ isActive: 1, displayOrder: 1 });
bannerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

bannerSchema.plugin(publicIdPlugin, { prefix: PUBLIC_ID_PREFIXES.banner });

module.exports = mongoose.model('Banner', bannerSchema);
