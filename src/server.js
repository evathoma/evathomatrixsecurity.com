require('dotenv').config();
const app = require('./app');
const { pool, testConnection } = require('./config/database');

const PORT = Number(process.env.PORT || 3000);
const MAX_PORT_ATTEMPTS = 10;
let server;

function listen(port, attempt = 0) {
  const candidate = app.listen(port, async () => {
    console.info(JSON.stringify({
      event: 'server.started',
      port,
      websiteUrl: `http://localhost:${port}`,
      healthUrl: `http://localhost:${port}/api/v1/health`,
      databaseHealthUrl: `http://localhost:${port}/api/v1/health/db`,
    }));

    const dbStatus = await testConnection();
    if (dbStatus.connected) {
      console.info(JSON.stringify({ event: 'database.connected', database: dbStatus.database }));
    } else {
      console.warn(JSON.stringify({ event: 'database.unavailable' }));
    }
  });
  server = candidate;

  candidate.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && attempt < MAX_PORT_ATTEMPTS) {
      console.warn(`Port ${port} is already in use. Trying port ${port + 1}...`);
      listen(port + 1, attempt + 1);
      return;
    }

    console.error(`Unable to start the server on port ${port}:`, error.message);
    process.exitCode = 1;
  });

  return candidate;
}

listen(PORT);

let shuttingDown = false;

async function shutdown(reason, fatal = false) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(JSON.stringify({ event: 'server.shutdown', reason }));

  if (server?.listening) {
    await new Promise((resolve) => server.close(resolve));
  }

  await pool.end();
  if (fatal) process.exitCode = 1;
  console.info(JSON.stringify({ event: 'server.closed' }));
}

process.on('SIGTERM', () => shutdown('SIGTERM').catch((error) => {
  console.error(JSON.stringify({ event: 'server.shutdown_failed', code: error.code }));
  process.exitCode = 1;
}));
process.on('SIGINT', () => shutdown('SIGINT').catch((error) => {
  console.error(JSON.stringify({ event: 'server.shutdown_failed', code: error.code }));
  process.exitCode = 1;
}));
process.on('unhandledRejection', (reason) => {
  console.error(JSON.stringify({
    event: 'process.unhandled_rejection',
    message: reason instanceof Error ? reason.message : String(reason),
  }));
  shutdown('unhandledRejection', true).catch((error) => {
    console.error(JSON.stringify({ event: 'server.shutdown_failed', code: error.code }));
    process.exitCode = 1;
  });
});
process.on('uncaughtException', (error) => {
  console.error(JSON.stringify({
    event: 'process.uncaught_exception',
    message: error.message,
  }));
  shutdown('uncaughtException', true).catch((shutdownError) => {
    console.error(JSON.stringify({ event: 'server.shutdown_failed', code: shutdownError.code }));
    process.exitCode = 1;
  });
});
