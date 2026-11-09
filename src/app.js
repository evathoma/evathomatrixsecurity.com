const path = require('path');
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const healthRoutes = require('./routes/health.routes');
const inquiryRoutes = require('./routes/inquiry.routes');
const { errorHandler } = require('./middleware/errorHandler');
const { serveSeoPage, serveSitemap } = require('./middleware/seo');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = new Set([
  new URL(process.env.SITE_URL || 'https://www.evathomatrixsecurity.com').origin,
  ...(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => new URL(origin).origin),
]);

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests. Please try again later.' },
});

const inquiryRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many inquiries. Please try again later.' },
});

app.disable('x-powered-by');
const proxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (Number.isInteger(proxyHops) && proxyHops > 0) {
  app.set('trust proxy', proxyHops);
}

app.use(compression());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      styleSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      ...(isProduction ? { upgradeInsecureRequests: [] } : {}),
    },
  },
  frameguard: { action: 'deny' },
  hsts: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

if (isProduction) {
  app.use((req, res, next) => {
    if (req.secure) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });
}

app.use('/api/v1', cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Accept', 'Content-Type'],
  maxAge: 600,
}));
app.use('/api/v1', apiRateLimit);
app.use('/api/v1', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb', parameterLimit: 20 }));

// Render canonical, page-specific SEO metadata before static HTML is served.
app.get('/', serveSeoPage);
app.get('/index.html', (req, res) => res.redirect(301, '/'));
app.get('/pages/:page.html', serveSeoPage);
app.get('/sitemap.xml', serveSitemap);

// Serve frontend static files from /public
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1d',
  setHeaders(res, filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const isHashedBuildAsset = /[\\/](?:js|css)[\\/][^\\/]+-[a-f0-9]{12}\.(?:js|css)$/i.test(filePath);

    if (isHashedBuildAsset) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (extension === '.html') {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else if (/\.(?:css|js|png|jpe?g|webp|svg|ico|woff2?)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    }
  },
}));

// API Routes (v1)
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/inquiries', inquiryRateLimit, inquiryRoutes);
app.use('/api/v1', (req, res) => {
  res.status(404).json({ status: 'error', message: 'API endpoint not found.' });
});

app.use((req, res) => {
  if (req.accepts('html')) {
    return res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
  }

  return res.status(404).json({ status: 'error', message: 'The requested resource was not found.' });
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
