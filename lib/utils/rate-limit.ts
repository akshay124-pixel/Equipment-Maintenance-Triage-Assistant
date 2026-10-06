/**
 * Simple in-memory rate limiter
 * In production, use Redis or similar distributed cache
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const limitMap = new Map<string, RateLimitRecord>();

export interface RateLimitConfig {
  interval: number; // milliseconds
  maxRequests: number;
}

export const rateLimitConfigs = {
  api: { interval: 60000, maxRequests: 100 }, // 100 requests per minute
  auth: { interval: 60000, maxRequests: 5 },   // 5 auth attempts per minute
  upload: { interval: 60000, maxRequests: 10 }, // 10 uploads per minute
};

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const record = limitMap.get(identifier);

  // Clean up old entries periodically
  if (limitMap.size > 10000) {
    const cutoff = now - config.interval;
    for (const [key, value] of limitMap.entries()) {
      if (value.resetAt < cutoff) {
        limitMap.delete(key);
      }
    }
  }

  if (!record || now > record.resetAt) {
    // No record or expired - create new
    limitMap.set(identifier, {
      count: 1,
      resetAt: now + config.interval,
    });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: now + config.interval,
    };
  }

  if (record.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: record.resetAt,
    };
  }

  // Increment counter
  record.count++;
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - record.count,
    reset: record.resetAt,
  };
}

export function getRateLimitIdentifier(request: Request): string {
  // In production, use IP address from headers (considering proxies)
  // For now, use a combination of user agent and a simple hash
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${userAgent.substring(0, 50)}`;
}
