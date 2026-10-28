const router = require('express').Router()

const {
  bookAppointment,
  createStaffAppointment,
  lookupCustomerForStaff,
  getAppointments,
  getAppointment,
  updateAppointmentStatus,
  rateAppointment,
  rescheduleAppointment
} = require('../controllers/appointment.controller')

const authenticate = require('../middleware/authenticate')
const checkPermission = require('../middleware/checkPermission')
const { requireAppointmentScope } = require('../middleware/checkScope')
const idempotency = require('../middleware/idempotency')

const validate = require('../middleware/validate')
const { bookAppointmentValidator, staffBookingValidator } = require('../validators/appointment.validator')

const { apiLimiter, bookingLimiter } = require('../middleware/rateLimiter.middleware')

router.use(authenticate)

router.post('/',
  bookingLimiter,
  checkPermission('appointment:create'),
  bookAppointmentValidator,
  validate,
  idempotency,
  bookAppointment
)

// Staff front-desk booking for walk-in / phone customers.
// Declared before the /:appointmentId routes so the static paths win.
router.post('/staff',
  bookingLimiter,
  checkPermission('appointment:create'),
  staffBookingValidator,
  validate,
  idempotency,
  createStaffAppointment
)

// Exact-phone customer lookup. Rate-limited even though it only answers for
// customers already known to the caller's salon — that keeps it useless as a
// phone-number enumeration oracle.
router.get('/staff/customer-lookup',
  apiLimiter,
  checkPermission('appointment:create'),
  lookupCustomerForStaff
)

router.get('/',
  checkPermission('appointment:read'),
  getAppointments
)

router.get('/:appointmentId',
  checkPermission('appointment:read'),
  requireAppointmentScope,
  getAppointment
)

router.patch('/:appointmentId/status',
  checkPermission('appointment:update'),
  requireAppointmentScope,
  updateAppointmentStatus
)

router.patch('/:appointmentId/rate',
  checkPermission('appointment:read'),
  requireAppointmentScope,
  rateAppointment
)

router.post('/:appointmentId/review',
  checkPermission('appointment:read'),
  requireAppointmentScope,
  rateAppointment
)

router.patch('/:appointmentId/reschedule',
  checkPermission('appointment:update'),
  requireAppointmentScope,
  rescheduleAppointment
)

module.exports = router
