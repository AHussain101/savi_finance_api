// Health Check Endpoint - Matthew's responsibility
// See docs/MATTHEW_INFRA.md for implementation details

import { connectToDatabase } from "@/lib/db/connection";
import { redis } from "@/lib/cache/redis";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    database: { status: "up" | "down"; latency?: number };
    cache: { status: "up" | "down"; latency?: number };
  };
}

export async function GET() {
  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: { status: "down" },
      cache: { status: "down" },
    },
  };

  // Check MongoDB
  try {
    const dbStart = Date.now();
    const mongoose = await connectToDatabase();
    await mongoose.connection.db?.admin().ping();
    health.services.database = {
      status: "up",
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    console.error("Database health check failed:", error);
    health.services.database = { status: "down" };
  }

  // Check Redis
  try {
    const cacheStart = Date.now();
    await redis.ping();
    health.services.cache = {
      status: "up",
      latency: Date.now() - cacheStart,
    };
  } catch (error) {
    console.error("Cache health check failed:", error);
    health.services.cache = { status: "down" };
  }

  // Determine overall status
  const allServicesUp =
    health.services.database.status === "up" &&
    health.services.cache.status === "up";
  const anyServiceDown =
    health.services.database.status === "down" ||
    health.services.cache.status === "down";

  if (!allServicesUp && anyServiceDown) {
    health.status = health.services.database.status === "down" ? "unhealthy" : "degraded";
  }

  const httpStatus = health.status === "unhealthy" ? 503 : 200;

  return Response.json(health, { status: httpStatus });
}
