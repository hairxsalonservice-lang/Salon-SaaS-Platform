const mongoose = require('mongoose')
const logger = require('../utils/logger')

// Set up connection event listeners once
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected! Attempting to reconnect...')
  logger.warn('MongoDB disconnected')
})

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB Runtime Error: ${err.message}`)
  logger.error(`MongoDB runtime error: ${err.message}`)
})

const connectDB = async (retryCount = 0) => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ CRITICAL: MONGO_URI environment variable is missing!')
      logger.error('MONGO_URI environment variable is missing!')
      return
    }

    if (mongoose.connection.readyState === 1) {
      return
    }

    console.log('🔄 Connecting to MongoDB...')
    const conn = await mongoose.connect(process.env.MONGO_URI.trim(), {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 25,
      minPoolSize: 5,
    })
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
    logger.info(`MongoDB connected: ${conn.connection.host}`)

    // Trigger cache warming asynchronously so public endpoints are pre-cached immediately
    if (process.env.NODE_ENV !== 'test') {
      setTimeout(() => {
        try {
          const warmCacheOnBoot = require('../utils/cacheWarmer');
          if (typeof warmCacheOnBoot === 'function') {
            warmCacheOnBoot();
          }
        } catch (e) {
          // Ignore cache warming error in non-standard environments
        }
      }, 500);
    }

    // Backfill citySlug on branches created before the field existed.
    try {
      const Branch = require('../models/branch.model')
      const backfill = await Branch.updateMany(
        { $or: [{ citySlug: { $exists: false } }, { citySlug: null }] },
        [
          {
            $set: {
              citySlug: {
                $toLower: { $trim: { input: '$address.city' } }
              }
            }
          }
        ],
        { updatePipeline: true }
      )
      if (backfill.matchedCount > 0) {
        console.log(`🏙️ Backfilled citySlug on ${backfill.modifiedCount} branch(es)`)
      }
    } catch (e) {
      console.log('CitySlug backfill error:', e.message)
    }

    // Backfill publicId on documents created before the sequential-ID system
    try {
      const { PUBLIC_ID_PREFIXES, allocatePublicIds } = require('../utils/publicId')
      const modelEntries = [
        ['Salon', '../models/salon.model'],
        ['Branch', '../models/branch.model'],
        ['User', '../models/user.model'],
        ['Service', '../models/service.model'],
        ['Slot', '../models/slot.model'],
        ['Appointment', '../models/appointment.model'],
        ['Attendance', '../models/attendance.model'],
        ['StaffLeave', '../models/staffLeave.model'],
        ['Notification', '../models/notification.model'],
        ['UploadedFile', '../models/uploadedFile.model'],
        ['Banner', '../models/Banner'],
        ['OwnerRegistrationRequest', '../models/ownerRegistrationRequest.model'],
        ['Permission', '../models/permission.model'],
        ['Role', '../models/role.model'],
        ['Referral', '../models/referral.model'],
      ]
      const prefixMap = {
        Salon: PUBLIC_ID_PREFIXES.salon,
        Branch: PUBLIC_ID_PREFIXES.branch,
        User: PUBLIC_ID_PREFIXES.user,
        Service: PUBLIC_ID_PREFIXES.service,
        Slot: PUBLIC_ID_PREFIXES.slot,
        Appointment: PUBLIC_ID_PREFIXES.appointment,
        Attendance: PUBLIC_ID_PREFIXES.attendance,
        StaffLeave: PUBLIC_ID_PREFIXES.staffLeave,
        Notification: PUBLIC_ID_PREFIXES.notification,
        UploadedFile: PUBLIC_ID_PREFIXES.uploadedFile,
        Banner: PUBLIC_ID_PREFIXES.banner,
        OwnerRegistrationRequest: PUBLIC_ID_PREFIXES.ownerRegistrationRequest,
        Permission: PUBLIC_ID_PREFIXES.permission,
        Role: PUBLIC_ID_PREFIXES.role,
        Referral: PUBLIC_ID_PREFIXES.referral,
      }
      let totalBackfilled = 0
      for (const [name, modelPath] of modelEntries) {
        try {
          const M = require(modelPath)
          const docs = await M.find(
            { $or: [{ publicId: { $exists: false } }, { publicId: null }, { publicId: '' }] },
            { _id: 1 },
          ).sort({ _id: 1 }).lean()
          if (docs.length === 0) continue
          const ids = await allocatePublicIds(prefixMap[name], docs.length)
          const ops = docs.map((d, i) => ({
            updateOne: { filter: { _id: d._id }, update: { $set: { publicId: ids[i] } } },
          }))
          await M.bulkWrite(ops, { ordered: false })
          totalBackfilled += docs.length
          console.log(`🔢 Backfilled ${docs.length} publicId(s) on ${name}`)
        } catch (innerErr) {
          // Non-fatal per model
        }
      }
      if (totalBackfilled > 0) {
        console.log(`🔢 Total publicIds backfilled: ${totalBackfilled}`)
      }
    } catch (e) {
      console.log('PublicId backfill error:', e.message)
    }

    // Drop legacy non-sparse phone_1 index if present
    try {
      const User = require('../models/user.model')
      await User.collection.dropIndex('phone_1')
      console.log('✅ Dropped legacy non-sparse phone_1 index from MongoDB')
    } catch (indexErr) {
      // Index didn't exist or was already replaced — non-fatal
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error (${error.message}). Retrying in 3s...`)
    logger.error(`MongoDB connection error: ${error.message}`)
    if (retryCount < 5 && process.env.NODE_ENV !== 'test') {
      setTimeout(() => connectDB(retryCount + 1), 3000)
    }
  }
}

module.exports = connectDB