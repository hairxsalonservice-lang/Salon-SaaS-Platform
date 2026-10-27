// src/config/socket.js
const { Server } = require("socket.io");
const logger = require("../utils/logger");
const { verifyAccessToken } = require("../utils/token");
const { isAllowedOrigin } = require("./cors");
const User = require("../models/user.model");
const Branch = require("../models/branch.model");

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) return callback(null, true);
        return callback(
          new Error(`CORS Security Violation: Origin ${origin} is not allowed by CORS policy.`),
        );
      },
      methods: ["GET", "POST", "PATCH", "PUT"],
    },
  });

  // ================================
  // Handshake authentication — every connection must carry a valid
  // access token (sent as { auth: { token } } from the client).
  //
  // The JWT signature alone is not enough: we must reload the account so a
  // deactivated user, or a token invalidated by tokenVersion, cannot stay
  // connected through the socket while being rejected by the HTTP API.
  // ================================
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }
      const decoded = verifyAccessToken(token);
      if (!decoded?.userId) {
        return next(new Error("Invalid token"));
      }

      const user = await User.findById(decoded.userId)
        .select("_id role salonId branchId tokenVersion isActive")
        .populate("role", "name")
        .lean();

      if (!user || !user.isActive) {
        return next(new Error("Account is inactive"));
      }

      if (user.tokenVersion !== decoded.tokenVersion) {
        return next(new Error("Session expired"));
      }

      socket.data.userId = String(user._id);
      socket.data.role = user.role?.name || "customer";
      socket.data.salonId = user.salonId ? String(user.salonId) : null;
      socket.data.branchId = user.branchId ? String(user.branchId) : null;
      logger.info(`Socket authenticated: user ${user._id} [${socket.data.role}]`);
      next();
    } catch (err) {
      logger.warn(`Socket auth rejected: ${err.message}`);
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, role, salonId, branchId } = socket.data;

    // ================================
    // Room joins — strictly validated so users can only join rooms
    // they actually belong to.
    // ================================

    // personal customer room — only the token owner
    socket.on("join_customer", (targetUserId, ack) => {
      if (String(targetUserId) === String(userId)) {
        socket.join(`customer_${userId}`);
        ack?.({ joined: true });
      } else {
        logger.warn(`Socket ${socket.id} blocked join_customer for ${targetUserId}`);
        ack?.({ joined: false });
      }
    });

    // personal user room (salon panel) — only the token owner
    socket.on("join_user", (targetUserId, ack) => {
      if (String(targetUserId) === String(userId)) {
        socket.join(`user_${userId}`);
        ack?.({ joined: true });
      } else {
        logger.warn(`Socket ${socket.id} blocked join_user for ${targetUserId}`);
        ack?.({ joined: false });
      }
    });

    // branch room — managers/staff may only join the branch they are
    // assigned to. Owners may join any active branch inside their salon.
    socket.on("join_branch", async (branchToJoin, ack) => {
      try {
        if (!branchToJoin) {
          ack?.({ joined: false });
          return;
        }

        const isOwnBranch =
          branchId && String(branchToJoin) === String(branchId);

        if (isOwnBranch) {
          socket.join(`branch_${branchId}`);
          ack?.({ joined: true });
          return;
        }

        if (role === "owner" && salonId) {
          const branch = await Branch.findOne({
            _id: branchToJoin,
            salonId,
            isActive: { $ne: false },
          }).select("_id").lean();

          if (branch) {
            socket.join(`branch_${branchToJoin}`);
            ack?.({ joined: true });
            return;
          }
        }

        logger.warn(`Socket ${socket.id} blocked join_branch for ${branchToJoin}`);
        ack?.({ joined: false });
      } catch (err) {
        logger.warn(`join_branch error: ${err.message}`);
        ack?.({ joined: false });
      }
    });

    // salon room — contains appointments from every branch, so only the salon
    // owner (who is authorized for the whole salon) may join it.
    socket.on("join_salon", (salonToJoin, ack) => {
      if (
        role === "owner" &&
        salonId &&
        String(salonToJoin) === String(salonId)
      ) {
        socket.join(`salon_${salonId}`);
        ack?.({ joined: true });
      } else {
        logger.warn(`Socket ${socket.id} blocked join_salon for ${salonToJoin}`);
        ack?.({ joined: false });
      }
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

function getIO() {
  if (!io) {
    logger.warn("Socket.io requested before initialization");
    return null;
  }
  return io;
}

module.exports = { initSocket, getIO };