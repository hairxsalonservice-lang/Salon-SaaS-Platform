const User = require("../models/user.model");
const Referral = require("../models/referral.model");
const AppError = require("../utils/AppError");

// GET /api/v1/customers/me/referral
const getMyReferral = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;

    const user = await User.findById(userId)
      .select("referralCode referralCount referredBy")
      .lean();

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // If user doesn't have a referral code yet, generate one
    if (!user.referralCode) {
      const fullUser = await User.findById(userId);
      const name = (fullUser.name || "USER").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "USER";
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      fullUser.referralCode = `${name}${rand}`;
      await fullUser.save();
      user.referralCode = fullUser.referralCode;
    }

    const referrals = await Referral.find({ referrer: userId })
      .populate("referee", "name avatar createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralCount: user.referralCount || 0,
        referredBy: user.referredBy || null,
        referrals: referrals.map((r) => ({
          id: r._id,
          name: r.referee?.name || "User",
          avatar: r.referee?.avatar || null,
          status: r.status,
          rewardGranted: r.rewardGranted,
          joinedAt: r.referee?.createdAt || r.createdAt,
          completedAt: r.completedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/customers/me/referral/apply
const applyReferralCode = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { code } = req.body;

    if (!code || typeof code !== "string") {
      return next(new AppError("Referral code is required", 400));
    }

    const normalizedCode = code.trim().toUpperCase();

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return next(new AppError("User not found", 404));
    }

    if (currentUser.referredBy) {
      return next(new AppError("You have already used a referral code", 400));
    }

    if (currentUser.referralCode === normalizedCode) {
      return next(new AppError("You cannot use your own referral code", 400));
    }

    const referrer = await User.findOne({ referralCode: normalizedCode });
    if (!referrer) {
      return next(new AppError("Invalid referral code", 404));
    }

    const existingReferral = await Referral.findOne({ referee: userId });
    if (existingReferral) {
      return next(new AppError("You have already been referred", 400));
    }

    await Referral.create({
      referrer: referrer._id,
      referee: userId,
      referralCode: normalizedCode,
      status: "PENDING",
    });

    currentUser.referredBy = normalizedCode;
    await currentUser.save();

    await User.findByIdAndUpdate(referrer._id, { $inc: { referralCount: 1 } });

    res.status(200).json({
      success: true,
      message: "Referral code applied successfully",
      data: {
        referredBy: normalizedCode,
        referrerName: referrer.name,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("You have already been referred", 400));
    }
    next(error);
  }
};

// POST /api/v1/referrals/:referralId/complete  (internal/admin use)
const completeReferral = async (req, res, next) => {
  try {
    const { referralId } = req.params;

    const referral = await Referral.findById(referralId);
    if (!referral) {
      return next(new AppError("Referral not found", 404));
    }

    if (referral.status === "COMPLETED") {
      return next(new AppError("Referral already completed", 400));
    }

    referral.status = "COMPLETED";
    referral.rewardGranted = true;
    referral.completedAt = new Date();
    await referral.save();

    res.status(200).json({
      success: true,
      message: "Referral marked as completed",
      data: { referral },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyReferral,
  applyReferralCode,
  completeReferral,
};
