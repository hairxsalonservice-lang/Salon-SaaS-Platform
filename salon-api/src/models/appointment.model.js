const mongoose = require('mongoose')
const tenantPlugin = require('../utils/tenantPlugin')

// Appointment = a confirmed booking
// Links: customer → branch → staff → service → slot
// Has a full lifecycle: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
//                                           ↘ CANCELLED / NO_SHOW

const appointmentSchema = new mongoose.Schema(
  {
    // ================================
    // Core references
    // ================================

    // who booked
    // Null for walk-in / phone bookings where the customer has no app account.
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // Snapshot of an unregistered customer. Kept on the appointment so a
    // walk-in never needs a fake User account (email is required/unique).
    customerSnapshot: {
      name: {
        type: String,
        trim: true,
        maxlength: [100, 'Customer name cannot exceed 100 characters'],
        default: null
      },
      phone: {
        type: String,
        trim: true,
        maxlength: [30, 'Customer phone cannot exceed 30 characters'],
        default: null
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [254, 'Customer email cannot exceed 254 characters'],
        default: null
      }
    },

    // How the appointment entered the system.
    source: {
      type: String,
      enum: ['APP', 'WALK_IN', 'PHONE'],
      default: 'APP'
    },

    // Staff member who created the booking. Null when the customer
    // booked through the app themselves.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // at which branch
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required']
    },

    // under which salon org
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: [true, 'Salon is required']
    },

    // which staff member will serve
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Staff is required']
    },

    // which service is booked (primary service)
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required']
    },

    // all services booked in this appointment (multi-service support)
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
      }
    ],

    // which time slot
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: [true, 'Slot is required']
    },

    // ================================
    // Denormalized time fields
    // ================================
    // We copy these from the slot so we can query appointments by date
    // without always populating the slot
    date: {
      type: String, // "YYYY-MM-DD"
      required: true
    },

    startTime: {
      type: String, // "HH:MM"
      required: true
    },

    endTime: {
      type: String, // "HH:MM"
      required: true
    },

    // ================================
    // Lifecycle Status
    // ================================
    status: {
      type: String,
      enum: [
        'PENDING',      // customer booked, awaiting confirmation
        'CONFIRMED',    // manager/staff confirmed
        'IN_PROGRESS',  // customer is currently being served
        'COMPLETED',    // service done
        'CANCELLED',    // cancelled by customer or salon
        'NO_SHOW'       // customer didn't show up
      ],
      default: 'PENDING'
    },

    // who cancelled and why
    cancellation: {
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      reason: {
        type: String,
        default: null
      },
      cancelledAt: {
        type: Date,
        default: null
      }
    },

    // ================================
    // Pricing snapshot
    // ================================
    // We snapshot the price at time of booking
    // so if service price changes later, history is accurate
    pricePaid: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: 'INR'
    },

    // ================================
    // Payment tracking
    // ================================
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'other', 'not_recorded'],
      default: 'not_recorded'
    },

    // ================================
    // Notes & Feedback
    // ================================
    guests: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },

    customerNotes: {
      type: String,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: null
    },

    staffNotes: {
      type: String,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: null
    },

    // customer rating after completion
    rating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      },
      review: {
        type: String,
        maxlength: [500, 'Review cannot exceed 500 characters'],
        default: null
      },
      ratedAt: {
        type: Date,
        default: null
      }
    },

    // ================================
    // Status history — full audit trail
    // ================================
    // every status change is recorded with who changed it and when
    statusHistory: [
      {
        status: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        changedAt: {
          type: Date,
          default: Date.now
        },
        note: String
      }
    ],

    // ================================
    // Email Notification Tracking
    // ================================
    emailSent: {
      type: Boolean,
      default: false
    },
    lastEmailSentAt: {
      type: Date,
      default: null
    },
    emailLogs: [
      {
        type: { type: String }, // "BOOKING_SUBMITTED", "APPOINTMENT_ACCEPTED", "THANK_YOU_SENT"
        sentTo: String,
        sentAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
)

// ================================
// Indexes — built for 10k bookings/day
// ================================

// most common: get all appointments for a branch on a date
appointmentSchema.index({ branchId: 1, date: 1 })

// get all appointments for a branch by status
appointmentSchema.index({ branchId: 1, status: 1 })

// customer views their own appointment history
appointmentSchema.index({ customerId: 1, date: -1 })
// stats aggregation: filter by customerId only
appointmentSchema.index({ customerId: 1 })

// match a returning walk-in guest by phone within one salon
appointmentSchema.index({ salonId: 1, 'customerSnapshot.phone': 1 })

// staff views their schedule
appointmentSchema.index({ staffId: 1, date: 1 })

// compound — branch + date + status (most frequent analytics query)
appointmentSchema.index({ branchId: 1, date: 1, status: 1 })

// owner-level reports: filter by salon instead of branch (full-scan otherwise)
appointmentSchema.index({ salonId: 1, date: 1, status: 1 })

// public reviews: only appointments that actually have a rating
appointmentSchema.index(
  { branchId: 1, 'rating.ratedAt': -1 },
  { partialFilterExpression: { 'rating.score': { $type: 'number' } } },
)
appointmentSchema.index(
  { salonId: 1, 'rating.ratedAt': -1 },
  { partialFilterExpression: { 'rating.score': { $type: 'number' } } },
)

// ================================
// Pre-validate hook — an appointment must identify a customer
// either by account reference or by a guest snapshot.
// ================================
appointmentSchema.pre('validate', function (next) {
  if (this.customerId) return next()

  const name = this.customerSnapshot?.name
  const phone = this.customerSnapshot?.phone

  if (!name || !phone) {
    return next(
      new Error(
        'Customer is required. Provide a customerId or a guest name and phone number.',
      ),
    )
  }

  next()
})

// ================================
// Pre-save hook — auto-record status changes
// Creation history is written explicitly by the booking service so it can
// include the actor and the booking source. Only append on later changes.
// ================================
appointmentSchema.pre('save', function () {
  if (!this.isNew && this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date()
    })
  }
})
appointmentSchema.plugin(tenantPlugin)
module.exports = mongoose.model('Appointment', appointmentSchema)