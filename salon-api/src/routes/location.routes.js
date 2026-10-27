// salon-api/src/routes/location.routes.js
const express = require("express");
const router = express.Router();
const { reverseGeocode, searchLocations, getPlaceDetails } = require("../controllers/location.controller");
const { locationLimiter } = require("../middleware/rateLimiter.middleware");

// These routes are public (signed-out browsing uses them), but call paid
// upstream APIs, so they get a dedicated per-IP rate limit.
router.use(locationLimiter);

// Reverse geocode latitude & longitude to address/city
router.post("/reverse-geocode", reverseGeocode);

// Search locations by name/query (Google Places Autocomplete / Geocode)
router.get("/search", searchLocations);

// Get structured place details by place_id
router.get("/details", getPlaceDetails);

module.exports = router;

