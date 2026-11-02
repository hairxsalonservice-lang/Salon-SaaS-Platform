const { register, httpRequestDurationMicroseconds, httpRequestsTotal } = require("../services/metrics.service");

const metricsMiddleware = (req, res, next) => {
  if (req.path === "/metrics") {
    return next();
  }

  const end = httpRequestDurationMicroseconds.startTimer();

  res.on("finish", () => {
    const route = req.route ? req.route.path : req.path || "unknown";
    const statusCode = res.statusCode ? String(res.statusCode) : "500";

    const labels = {
      method: req.method,
      route,
      status_code: statusCode,
    };

    end(labels);
    httpRequestsTotal.inc(labels);
  });

  next();
};

const metricsHandler = async (req, res) => {
  try {
    const requiredToken = process.env.METRICS_AUTH_TOKEN;
    if (!requiredToken && process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message: "Metrics endpoint disabled: METRICS_AUTH_TOKEN not configured",
      });
    }
    if (requiredToken) {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${requiredToken}`) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid or missing Prometheus metrics token",
        });
      }
    }

    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
};

module.exports = {
  metricsMiddleware,
  metricsHandler,
};
