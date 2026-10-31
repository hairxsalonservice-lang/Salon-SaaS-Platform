const Appointment = require('../models/appointment.model')
const Service = require('../models/service.model')
const User = require('../models/user.model')
const Slot = require('../models/slot.model')
const AppError = require('../utils/AppError')
const dayjs = require('dayjs')
const { getCache, setCache } = require('../services/cache.service')
const reportCacheKey = require('../utils/reportCacheKey')

// ================================
// GET /api/v1/reports/overview
// owner → entire salon
// manager → their branch only
// ================================
function calculatePercentChange(curr, prev) {
  if (prev === 0) {
    if (curr === 0) return { pct: 0, text: "0%", direction: "neutral" };
    return { pct: 100, text: "+100%", direction: "up" };
  }
  const diff = ((curr - prev) / prev) * 100;
  const rounded = Math.round(diff);
  if (rounded === 0) return { pct: 0, text: "0%", direction: "neutral" };
  if (rounded > 0) return { pct: rounded, text: `+${rounded}%`, direction: "up" };
  return { pct: rounded, text: `${rounded}%`, direction: "down" };
}

// ================================
// GET /api/v1/reports/overview
// owner → entire salon
// manager → their branch only
// ================================
const getOverview = async (req, res, next) => {
  try {
    const { role, branchId, salonId } = req.user
    const { startDate, endDate } = req.query

    // default to current month if no dates given
    const start = startDate || dayjs().startOf('month').format('YYYY-MM-DD')
    const end = endDate || dayjs().endOf('month').format('YYYY-MM-DD')

    const cacheKey = reportCacheKey('overview', {
      role,
      salonId,
      branchId,
      suffix: `${start}:${end}`,
    })
    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached })
    }

    // build filter based on role
    const filter = {
      date: { $gte: start, $lte: end }
    }

    if (role === 'manager') filter.branchId = branchId;
    if (role === 'owner') filter.salonId = salonId;

    // Previous period calculation for accurate percentage change
    const diffDays = Math.max(1, dayjs(end).diff(dayjs(start), 'day') + 1);
    const prevStart = dayjs(start).subtract(diffDays, 'day').format('YYYY-MM-DD');
    const prevEnd = dayjs(start).subtract(1, 'day').format('YYYY-MM-DD');

    const prevFilter = {
      date: { $gte: prevStart, $lte: prevEnd }
    };
    if (role === 'manager') prevFilter.branchId = branchId;
    if (role === 'owner') prevFilter.salonId = salonId;

    const [[stats], [prevStats]] = await Promise.all([
      Appointment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
            confirmed: { $sum: { $cond: [{ $eq: ["$status", "CONFIRMED"] }, 1, 0] } },
            noShow: { $sum: { $cond: [{ $eq: ["$status", "NO_SHOW"] }, 1, 0] } },
            totalRevenue: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, { $ifNull: ["$pricePaid", 0] }, 0] } },
          },
        },
      ]),
      Appointment.aggregate([
        { $match: prevFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
            confirmed: { $sum: { $cond: [{ $eq: ["$status", "CONFIRMED"] }, 1, 0] } },
            noShow: { $sum: { $cond: [{ $eq: ["$status", "NO_SHOW"] }, 1, 0] } },
            totalRevenue: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, { $ifNull: ["$pricePaid", 0] }, 0] } },
          },
        },
      ])
    ]);

    const totalAppointments = stats?.total || 0;
    const completedAppointments = stats?.completed || 0;
    const cancelledAppointments = stats?.cancelled || 0;
    const pendingAppointments = stats?.pending || 0;
    const confirmedAppointments = stats?.confirmed || 0;
    const noShowAppointments = stats?.noShow || 0;
    const totalRevenue = stats?.totalRevenue || 0;

    const prevTotalRevenue = prevStats?.totalRevenue || 0;
    const prevTotalAppointments = prevStats?.total || 0;
    const prevCompletedAppointments = prevStats?.completed || 0;
    const prevCancelledAppointments = prevStats?.cancelled || 0;
    const prevPendingAppointments = (prevStats?.pending || 0) + (prevStats?.confirmed || 0);
    const prevNoShowAppointments = prevStats?.noShow || 0;

    const responseData = {
      period: { startDate: start, endDate: end },
      appointments: {
        total: totalAppointments,
        totalChange: calculatePercentChange(totalAppointments, prevTotalAppointments),
        completed: completedAppointments,
        completedChange: calculatePercentChange(completedAppointments, prevCompletedAppointments),
        cancelled: cancelledAppointments,
        cancelledChange: calculatePercentChange(cancelledAppointments, prevCancelledAppointments),
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        pendingChange: calculatePercentChange(pendingAppointments + confirmedAppointments, prevPendingAppointments),
        noShow: noShowAppointments,
        noShowChange: calculatePercentChange(noShowAppointments, prevNoShowAppointments),
        completionRate: totalAppointments > 0
          ? ((completedAppointments / totalAppointments) * 100).toFixed(1) + '%'
          : '0%'
      },
      revenue: {
        total: totalRevenue,
        display: `₹${(totalRevenue / 100).toFixed(2)}`,
        change: calculatePercentChange(totalRevenue, prevTotalRevenue)
      }
    }

    await setCache(cacheKey, responseData, 120)

    res.status(200).json({
      success: true,
      cached: false,
      data: responseData
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/reports/popular-services
// most booked services in a period
// ================================
const getPopularServices = async (req, res, next) => {
  try {
    const { role, branchId, salonId } = req.user
    const { startDate, endDate, limit = 5 } = req.query

    const start = startDate || dayjs().startOf('month').format('YYYY-MM-DD')
    const end = endDate || dayjs().endOf('month').format('YYYY-MM-DD')

    const cacheKey = reportCacheKey('popular-services', {
      role,
      salonId,
      branchId,
      suffix: `${start}:${end}:${limit}`,
    })
    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached })
    }

    const matchFilter = {
      date: { $gte: start, $lte: end },
      status: 'COMPLETED'
    }

    if (role === 'manager') matchFilter.branchId = branchId
    if (role === 'owner') matchFilter.salonId = salonId

    const popularServices = await Appointment.aggregate([
      { $match: matchFilter },

      // group by serviceId and count bookings + sum revenue
      {
        $group: {
          _id: '$serviceId',
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$pricePaid' }
        }
      },

      // sort by most booked
      { $sort: { totalBookings: -1 } },

      // limit results
      { $limit: parseInt(limit) },

      // join with services collection to get service details
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service'
        }
      },

      // flatten the service array
      { $unwind: '$service' },

      // shape the output
      {
        $project: {
          _id: 0,
          serviceId: '$_id',
          name: '$service.name',
          category: '$service.category',
          totalBookings: 1,
          totalRevenue: 1,
          revenueDisplay: {
            $concat: ['₹', { $toString: { $divide: ['$totalRevenue', 100] } }]
          }
        }
      }
    ])

    const popularData = {
      period: { startDate: start, endDate: end },
      popularServices
    }

    await setCache(cacheKey, popularData, 300)

    res.status(200).json({
      success: true,
      cached: false,
      data: popularData
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/reports/staff-performance
// bookings and revenue per staff member
// ================================
const getStaffPerformance = async (req, res, next) => {
  try {
    const { role, branchId, salonId } = req.user
    const { startDate, endDate } = req.query

    const start = startDate || dayjs().startOf('month').format('YYYY-MM-DD')
    const end = endDate || dayjs().endOf('month').format('YYYY-MM-DD')

    const cacheKey = reportCacheKey('staff-performance', {
      role,
      salonId,
      branchId,
      suffix: `${start}:${end}`,
    })
    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached })
    }

    const matchFilter = {
      date: { $gte: start, $lte: end },
      status: 'COMPLETED'
    }

    if (role === 'manager') matchFilter.branchId = branchId
    if (role === 'owner') matchFilter.salonId = salonId

    const staffPerformance = await Appointment.aggregate([
      { $match: matchFilter },

      {
        $group: {
          _id: '$staffId',
          totalAppointments: { $sum: 1 },
          totalRevenue: { $sum: '$pricePaid' },
          avgRating: { $avg: '$rating.score' }
        }
      },

      { $sort: { totalAppointments: -1 } },

      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staff'
        }
      },

      { $unwind: '$staff' },

      {
        $project: {
          _id: 0,
          staffId: '$_id',
          name: '$staff.name',
          email: '$staff.email',
          totalAppointments: 1,
          totalRevenue: 1,
          revenueDisplay: {
            $concat: ['₹', { $toString: { $divide: ['$totalRevenue', 100] } }]
          },
          avgRating: {
            $cond: {
              if: { $gt: ['$avgRating', null] },
              then: { $round: ['$avgRating', 1] },
              else: 'No ratings yet'
            }
          }
        }
      }
    ])

    const staffData = {
      period: { startDate: start, endDate: end },
      staffPerformance
    }

    await setCache(cacheKey, staffData, 300)

    res.status(200).json({
      success: true,
      cached: false,
      data: staffData
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/reports/daily-bookings
// bookings count per day in a period
// useful for charts on frontend
// ================================
const getDailyBookings = async (req, res, next) => {
  try {
    const { role, branchId, salonId } = req.user
    const { startDate, endDate } = req.query

    const start = startDate || dayjs().startOf('month').format('YYYY-MM-DD')
    const end = endDate || dayjs().endOf('month').format('YYYY-MM-DD')

    const cacheKey = reportCacheKey('daily-bookings', {
      role,
      salonId,
      branchId,
      suffix: `${start}:${end}`,
    })
    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached })
    }

    const matchFilter = {
      date: { $gte: start, $lte: end }
    }

    if (role === 'manager') matchFilter.branchId = branchId
    if (role === 'owner') matchFilter.salonId = salonId

    const dailyData = await Appointment.aggregate([
      { $match: matchFilter },

      {
        $group: {
          _id: '$date',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] }
          },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$pricePaid', 0]
            }
          }
        }
      },

      { $sort: { _id: 1 } },

      {
        $project: {
          _id: 0,
          date: '$_id',
          total: 1,
          completed: 1,
          cancelled: 1,
          revenue: 1,
          revenueDisplay: {
            $concat: ['₹', { $toString: { $divide: ['$revenue', 100] } }]
          }
        }
      }
    ])

    const dailyDataResponse = {
      period: { startDate: start, endDate: end },
      dailyBookings: dailyData
    }

    await setCache(cacheKey, dailyDataResponse, 300)

    res.status(200).json({
      success: true,
      cached: false,
      data: dailyDataResponse
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/reports/slot-utilization
// how many slots are being used vs available
// ================================
const getSlotUtilization = async (req, res, next) => {
  try {
    const { role, branchId, salonId } = req.user
    const { date } = req.query

    const targetDate = date || dayjs().format('YYYY-MM-DD')

    const cacheKey = reportCacheKey('slot-utilization', {
      role,
      salonId,
      branchId,
      suffix: targetDate,
    })
    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached })
    }

    const filter = { date: targetDate }
    if (role === 'manager') filter.branchId = branchId
    if (role === 'owner') filter.salonId = salonId

    const [total, available, booked, blocked] = await Promise.all([
      Slot.countDocuments(filter),
      Slot.countDocuments({ ...filter, status: 'AVAILABLE' }),
      Slot.countDocuments({ ...filter, status: 'BOOKED' }),
      Slot.countDocuments({ ...filter, status: 'BLOCKED' })
    ])

    const utilizationData = {
      date: targetDate,
      slots: {
        total,
        available,
        booked,
        blocked,
        utilizationRate: total > 0
          ? ((booked / total) * 100).toFixed(1) + '%'
          : '0%'
      }
    }

    await setCache(cacheKey, utilizationData, 120)

    res.status(200).json({
      success: true,
      cached: false,
      data: utilizationData
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/reports/booking-breakdown
// booking sources (app / walk-in / phone) and
// completed payments by method (cash / upi / card)
// ================================
const SOURCE_KEYS = ['APP', 'WALK_IN', 'PHONE']
const PAYMENT_KEYS = ['cash', 'upi', 'card', 'other', 'not_recorded']

const getBookingBreakdown = async (req, res, next) => {
  try {
    const { role, branchId, salonId } = req.user
    const { startDate, endDate } = req.query

    const start = startDate || dayjs().startOf('month').format('YYYY-MM-DD')
    const end = endDate || dayjs().endOf('month').format('YYYY-MM-DD')

    const cacheKey = reportCacheKey('booking-breakdown', {
      role,
      salonId,
      branchId,
      suffix: `${start}:${end}`,
    })
    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached })
    }

    const matchFilter = {
      date: { $gte: start, $lte: end }
    }

    if (role === 'manager') matchFilter.branchId = branchId
    if (role === 'owner') matchFilter.salonId = salonId

    // One aggregation for both breakdowns. Payment figures only include
    // COMPLETED appointments because that is when money is actually collected.
    const aggregation = await Appointment.aggregate([
      { $match: matchFilter },
      {
        $facet: {
          sources: [
            {
              $group: {
                _id: { $ifNull: ['$source', 'APP'] },
                count: { $sum: 1 },
                completed: {
                  $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
                }
              }
            }
          ],
          payments: [
            { $match: { status: 'COMPLETED' } },
            {
              $group: {
                _id: { $ifNull: ['$paymentMethod', 'not_recorded'] },
                count: { $sum: 1 },
                amount: { $sum: { $ifNull: ['$pricePaid', 0] } }
              }
            }
          ]
        }
      }
    ])

    const result = aggregation[0] || {}
    const sourceMap = new Map(
      (result.sources || []).map((row) => [row._id, row])
    )
    const paymentMap = new Map(
      (result.payments || []).map((row) => [row._id, row])
    )

    const totalBookings = (result.sources || []).reduce(
      (sum, row) => sum + (row.count || 0),
      0
    )

    const sourceItems = SOURCE_KEYS.map((source) => {
      const row = sourceMap.get(source) || { count: 0, completed: 0 }
      return {
        source,
        count: row.count || 0,
        completed: row.completed || 0,
        percentage: totalBookings > 0
          ? Number((((row.count || 0) / totalBookings) * 100).toFixed(1))
          : 0
      }
    })

    const paymentItems = PAYMENT_KEYS.map((method) => {
      const row = paymentMap.get(method) || { count: 0, amount: 0 }
      return {
        method,
        count: row.count || 0,
        amount: row.amount || 0
      }
    })

    const completedAppointments = paymentItems.reduce(
      (sum, row) => sum + row.count,
      0
    )
    const totalCollected = paymentItems.reduce(
      (sum, row) => sum + row.amount,
      0
    )

    const paymentItemsWithShare = paymentItems.map((row) => ({
      ...row,
      percentage: totalCollected > 0
        ? Number(((row.amount / totalCollected) * 100).toFixed(1))
        : 0
    }))

    const responseData = {
      period: { startDate: start, endDate: end },
      sources: {
        total: totalBookings,
        items: sourceItems
      },
      payments: {
        completedAppointments,
        totalCollected,
        items: paymentItemsWithShare
      }
    }

    await setCache(cacheKey, responseData, 120)

    res.status(200).json({
      success: true,
      cached: false,
      data: responseData
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getOverview,
  getPopularServices,
  getStaffPerformance,
  getDailyBookings,
  getSlotUtilization,
  getBookingBreakdown
}