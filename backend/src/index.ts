import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app';

const PORT = parseInt(process.env.PORT ?? '5000', 10);
const MONGODB_URI = process.env.MONGODB_URI ?? '';

async function startServer(): Promise<void> {
  // ── Database Connection ───────────────────────────────────────────────────
  if (!MONGODB_URI) {
    console.error('[DB] MONGODB_URI is not set in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[DB] Connected to MongoDB Atlas ✓');
  } catch (error) {
    console.error('[DB] Failed to connect to MongoDB:', error);
    process.exit(1);
  }

  // ── Start HTTP Server ─────────────────────────────────────────────────────
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║       SEO Copilot API Server          ║
╠═══════════════════════════════════════╣
║  Status:  Running                     ║
║  Port:    ${PORT}                         ║
║  Env:     ${process.env.NODE_ENV ?? 'development'}         ║
║  Health:  http://localhost:${PORT}/api/health  ║
╚═══════════════════════════════════════╝
    `);
  });

  // ── Graceful Shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[Server] Received ${signal}, shutting down gracefully...`);
    await mongoose.connection.close();
    console.log('[DB] MongoDB connection closed');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
