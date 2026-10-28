const { body } = require('express-validator');
const mongoose = require('mongoose');
const { isValidPhone } = require('../utils/phone');

const bookAppointmentValidator = [
  body('slotId')
    .notEmpty()
    .withMessage('Slot ID is required')
    .isMongoId()
    .withMessage('Invalid Slot ID format'),

  body('serviceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Service ID format'),

  body('serviceIds')
    .optional()
    .isArray({ min: 1 })
    .withMessage('serviceIds must be a non-empty array')
    .custom((value) => value.every((id) => mongoose.Types.ObjectId.isValid(id)))
    .withMessage('Each serviceId must be a valid MongoDB ObjectId'),

  body('guests')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Guests must be an integer between 1 and 10'),

  body('customerNotes')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Customer notes cannot exceed 300 characters')
    .escape(),
];

const staffBookingValidator = [
  body('slotId')
    .notEmpty()
    .withMessage('Slot ID is required')
    .isMongoId()
    .withMessage('Invalid Slot ID format'),

  body('branchId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Branch ID format'),

  body('staffId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Staff ID format'),

  body('serviceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Service ID format'),

  body('serviceIds')
    .optional()
    .isArray({ min: 1 })
    .withMessage('serviceIds must be a non-empty array')
    .custom((value) => value.every((id) => mongoose.Types.ObjectId.isValid(id)))
    .withMessage('Each serviceId must be a valid MongoDB ObjectId'),

  body('customerId')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Invalid Customer ID format'),

  body('customer.name')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Customer name must be between 1 and 100 characters')
    .escape(),

  body('customer.phone')
    .optional({ nullable: true })
    .isString()
    .trim()
    .custom((value) => {
      if (!isValidPhone(value)) {
        throw new Error('Phone number must contain 10 to 15 digits');
      }
      return true;
    }),

  body('customer.email')
    .optional({ nullable: true })
    .isEmail()
    .withMessage('Invalid customer email')
    .normalizeEmail(),

  body('guests')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Guests must be an integer between 1 and 10'),

  body('customerNotes')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Customer notes cannot exceed 300 characters')
    .escape(),

  body('source')
    .optional()
    .isIn(['WALK_IN', 'PHONE'])
    .withMessage('Source must be WALK_IN or PHONE'),

  body().custom((value) => {
    const hasCustomerId = Boolean(value.customerId);
    const guestName = value.customer?.name;
    const guestPhone = value.customer?.phone;
    const hasGuest = Boolean(guestName && guestPhone);

    if (!hasCustomerId && !hasGuest) {
      throw new Error(
        'Provide an existing customer or a guest name and phone number',
      );
    }

    if (hasCustomerId && hasGuest) {
      throw new Error(
        'Provide either customerId or guest details, not both',
      );
    }

    const requestedServices =
      Array.isArray(value.serviceIds) && value.serviceIds.length > 0
        ? value.serviceIds
        : value.serviceId
          ? [value.serviceId]
          : [];

    if (requestedServices.length === 0) {
      throw new Error('At least one service is required');
    }

    return true;
  }),
];

module.exports = { bookAppointmentValidator, staffBookingValidator };
