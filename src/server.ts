// Web app
import "dotenv/config";
import express, { Request, Response, NextFunction } from 'express';
import productRoutes from './routes/product.routes.js';

// TODO Scaleing: Stateless + horizontal
// TODO Deploy: Containerized
const app = express();

/**
 * ---- BASIC SECURITY / HARDENING ----
 * Limit JSON size to avoid accidental or malicious large payloads.
 */
app.use(express.json({ limit: '1mb' }));

/**
 * Very small demo-rate-limit.
 * In real prod: use redis-backed rate limiter.
 */
const rateLimitWindowMs = 60000;
const maxRequestsPerWindow = 100;
const requests = new Map<string, { count: number; ts: number }>(); // TODO ❌ not scalable, try `rate-limiter-flexible`, Redis

/**
 * Periodic cleanup to prevent memory leak.
 * Removes stale IP entries outside the rate-limit window.
 */
setInterval(() => {
    const now = Date.now();

    for (const [ip, entry] of requests) {
        if (now - entry.ts > rateLimitWindowMs) {
            requests.delete(ip);
        }
    }
}, rateLimitWindowMs);

// SyntaxErrorMiddleware
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON' });
    }
    next(err);
});

// RateLimitMiddleware
app.use((req, res, next) => {
    // req.id = crypto.randomUUID(); # request ID, try Pino, Datadog
    const ip = req.ip ?? "unknown";
    const now = Date.now();
    const entry = requests.get(ip);

    if (!entry) {
        requests.set(ip, { count: 1, ts: now });
        return next();
    }

    if (now - entry.ts > rateLimitWindowMs) {
        entry.count = 1;
        entry.ts = now;
        return next();
    }

    entry.count += 1;
    if (entry.count > maxRequestsPerWindow) {
        return res.status(429).json({ error: "Too many requests" });
    }

    next();
});

/**
 * Application routes
 */
app.use('/products', productRoutes);

/**
 * Health check
 * Used by load balancers / uptime monitors.
 */
app.get('/health', (_req, res) => res.json({ ok: true }));

/**
 * ---- GLOBAL ERROR HANDLER ----
 * Any thrown error (sync or async) ends up here.
 * This prevents server crashes on Prisma errors.
 */
// ExceptionMiddleware
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[ERROR]", err);

    res.status(500).json({
        error: "Internal server error",
    });
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
    console.log(`Server running http://localhost:${port}`);
});
