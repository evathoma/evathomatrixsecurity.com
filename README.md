# Evatho Matrix Security Tanzania Website

Company website and Express API for Evatho Matrix Security Limited.

The site includes the Home, About, Services, Coverage, Contact, and Careers
pages. Contact forms create a pre-filled email addressed to
`info@evathomatrixsecurity.com` in the visitor's email app. The visitor reviews
the draft and presses **Send** to deliver the inquiry.

The project also includes a JSON API and a PostgreSQL-backed inquiry endpoint
that can be used independently of the public website forms.

## Features

- Responsive company and service information pages
- Contact forms with custom accessible feedback and pre-filled email drafts
- Accessible gallery, navigation, notifications, and branded not-found page
- SEO metadata, sitemap, and optimized responsive images
- Docker Compose deployment for the website/API and PostgreSQL service

## Requirements

- Docker Engine with Docker Compose (for the complete hosted stack)
- Node.js 22 or later for the local production asset build
- npm

## Run the complete system with Docker

The Compose stack builds the production website/API image and starts PostgreSQL
for the optional inquiry API. Website contact forms create pre-filled email
drafts and do not require the database. From the project folder:

```powershell
if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
}
```

Edit `.env` and replace `DB_PASSWORD` with a long, unique password before
starting the application:

```powershell
docker compose up --build -d
```

Open **http://localhost:3000**. To use a different host port, set `HOST_PORT`
in `.env` before starting the stack. The database is only reachable by the app
inside the Compose network, and its data persists in the `postgres_data` volume
when containers are restarted or recreated.

Useful operations:

```powershell
docker compose ps
docker compose logs -f
docker compose down
```

`docker compose down` keeps the database volume. **Do not run
`docker compose down --volumes` unless you intend to permanently delete saved
inquiries submitted through the API. The schema is loaded when PostgreSQL
first initializes its data volume; back up the volume before hosting upgrades
or migrations.

For internet hosting, configure the host firewall and hosting platform to expose
the selected HTTP port, and terminate HTTPS with your hosting platform or a
TLS reverse proxy. Keep `.env` private and use a strong unique database
password. The app, assets, API, and inquiry database do not call external
services. Website forms rely on a configured email app and the visitor must
press **Send** in that app; form submissions are not automatically stored in
PostgreSQL.

## Run locally on Windows

Open PowerShell in the project folder:

```powershell
Set-Location C:\evatho-matrix-website
npm.cmd install
npm.cmd run dev
```

When the server starts, it prints the URL and API addresses. By default, open
the website at **http://localhost:3000**. You can Ctrl+click the URL in a
terminal, or open it from PowerShell:

```powershell
Start-Process "http://localhost:3000"
```

Keep the terminal running while you use the site. Stop the development server
with **Ctrl+C** in that terminal.

### If port 3000 is already in use

`EADDRINUSE` means another process is already listening on the requested port.
The app automatically tries the next port, up to 10 ports above the requested
one, and prints the URL it successfully starts on. Use that printed URL.

To choose a different starting port yourself, set `PORT` in the current
PowerShell window:

```powershell
$env:PORT = "3001"
npm.cmd run dev
```

The app uses port 3001 if it is free; if not, it tries the following ports.
Use the URL printed by the server. For example, if it reports port 3001:

```powershell
Start-Process "http://localhost:3001"
```

To see which process owns port 3000, run:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen |
  Select-Object LocalAddress, LocalPort, OwningProcess
```

To identify the process without manually copying the ID:

```powershell
$connection = Get-NetTCPConnection -LocalPort 3000 -State Listen
Get-Process -Id $connection.OwningProcess
```

Do not stop a process unless you know it is safe to do so. The `PORT` setting
above applies only to the current PowerShell window. To make a port choice
persistent, set `PORT` in the project `.env` file.

Typing a URL by itself at a PowerShell prompt does not open a browser; use
`Start-Process "http://localhost:3000"` or enter the URL in your browser's
address bar.

## Configuration

The app uses port `3000` unless `PORT` is set. Database connection settings are
optional for serving the website. To configure PostgreSQL, copy the example
environment file and edit the values:

```powershell
if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
}
```

Set the appropriate values in `.env` (the committed file contains placeholders,
not credentials):

```ini
PORT=3000
NODE_ENV=development
HOST_PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=evatho_security_db
DB_USER=evatho
DB_PASSWORD=replace-with-a-long-unique-password
```

Keep real credentials private; do not commit them. The server can start when
PostgreSQL is unavailable, but database health checks report the connection as
unavailable and the inquiry endpoint returns an error instead of accepting an
inquiry that cannot be saved.

### Password and secret storage

Do not put real passwords, API keys, or other credentials in this README,
`.env.example`, source files, screenshots, or version control. Keep local
values in the ignored `.env` file and use a password manager for the actual
passwords. Share credentials only through an approved secure channel. The
`.env.example` file is a template and must contain placeholders only.

If a real credential has already been added to a README or committed, treat it
as exposed: rotate it, update the private `.env` and any deployment settings,
and remove the value from the current documentation. Deleting a committed
value alone does not remove it from Git history.

To create the database and tables, use PostgreSQL tools to create
`evatho_security_db`, then run the included schema from the project directory:

```powershell
psql -U postgres -c "CREATE DATABASE evatho_security_db;"
psql -U postgres -d evatho_security_db -f database/schema.sql
```

Change `postgres` if your PostgreSQL user is different. The inquiry endpoint
also ensures its table exists when an inquiry is submitted.

## Pages

The Express app serves `public/index.html` at `/` and serves other files from
`public/` as static assets.

- Home: `/`
- About: `/pages/about.html`
- Services: `/pages/services.html`
- Coverage: `/pages/coverage.html`
- Contact: `/pages/contact.html`
- Careers: `/pages/careers.html`

For example, with the default port, the About page is
http://localhost:3000/pages/about.html.

## API

All API routes are served by the same Express server and use the same port as
the website.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Confirms the API server is running |
| `GET` | `/api/v1/health/db` | Checks PostgreSQL connectivity |
| `POST` | `/api/v1/inquiries` | Submits a security inquiry |

The inquiry endpoint requires `fullName`, `email`, and `message`. It returns a
reference ID after the inquiry has been stored in PostgreSQL. If the database
is unavailable, the endpoint responds with `503 Service Unavailable` rather
than reporting an unsaved inquiry as successful.

## Search engine metadata and indexing

The Express SEO middleware renders a page-specific title and concise English
and Swahili search description, canonical URL, Open Graph and Twitter cards, and
JSON-LD business and page metadata for each public page. English is the primary
page language, with visible Swahili service descriptions for local search
queries. Set `SITE_URL` in `.env` to the canonical HTTPS origin when hosting
under another domain; the default is
`https://www.evathomatrixsecurity.com`. Keep the matching public-domain sitemap
URL in `public/robots.txt` in sync if the domain changes.
The official site name, `www.evathomatrixsecurity.com`, is included in the
website and business structured data, application name, and social site name;
page titles remain focused on each page's search topic and company brand.

`/robots.txt` is served from `public/robots.txt` and allows crawlers to access
the public pages while disallowing API, admin, and private paths.
`/sitemap.xml` is generated from the page list in
[`src/middleware/seo.js`](./src/middleware/seo.js), with each page file's last
modified date. The shared social preview image is
[`public/assets/images/og-cover.png`](./public/assets/images/og-cover.png)
(1200 × 630 pixels). Update it or its URL in the SEO middleware if you replace
the image.

After deployment, submit `https://www.evathomatrixsecurity.com/sitemap.xml` to
Google Search Console and Bing Webmaster Tools. Metadata and sitemap entries
are present in the server-rendered HTML/XML responses for crawlers.

## Security and performance controls

The Express application uses Helmet security headers and a same-origin
Content Security Policy. Inline style attributes are allowed for existing
page-specific styling; scripts and other resources are restricted to the
same origin. HSTS is enabled only in production, so local HTTP development is
not forced to HTTPS. Gzip compression is enabled, static assets use a
one-day cache with stale-while-revalidate. Content-hashed production bundles
are cached as immutable for one year, and HTML pages are revalidated.

API CORS responses are restricted to `SITE_URL` and any exact origins
explicitly listed in the comma-separated `CORS_ORIGINS` environment variable.
The API has a general rate limit of 120 requests per 15 minutes; inquiry
submissions are additionally limited to 5 per 15 minutes per client IP. The
built-in rate-limit store is per process; use a shared store if deploying
multiple app replicas. If running behind a trusted reverse proxy, set
`TRUST_PROXY_HOPS` to the exact number of trusted proxy hops; leave it at `0`
for direct connections. HSTS is sent only on HTTPS requests in production.
Set the proxy-hop value correctly when TLS is terminated by a trusted proxy.

HTML is revalidated after five minutes, and static assets are cached for one
day with stale-while-revalidate. Gzip compression is enabled; configure Brotli
at the HTTPS reverse proxy/CDN if available. The reusable mobile and keyboard
accessibility rules are in `public/css/a11y-responsive.css`; HTML responses add
a skip link and normalize image alternative text and loading hints.

Inquiry input is type-checked, trimmed, length-limited, and inserted using
parameterized SQL. Stored values are plain text; encode them for the output
context if they are ever rendered in an HTML admin interface. The API does
not expose stack traces or database details to clients. Fatal process-level
errors trigger graceful HTTP/database shutdown rather than continuing in an
unknown state.

## npm scripts

| Command | Purpose |
| --- | --- |
| `npm.cmd run dev` | Run the development server with Nodemon |
| `npm.cmd start` | Run the server without Nodemon |
| `npm.cmd run build:images` | Generate optimized WebP copies, responsive variants, and image dimensions |
| `npm.cmd run build:css` | Build the Tailwind stylesheet |
| `npm.cmd run build:assets` | Bundle and minify page-specific CSS and JavaScript |
| `npm.cmd run build` | Run the complete production asset build |
| `npm.cmd run watch:css` | Rebuild the Tailwind stylesheet when source files change |

Run `npm.cmd run build` after changing frontend assets. Sharp creates WebP
variants at widths up to the source image's size, records intrinsic dimensions,
and writes the generated image manifest. The server renders responsive
`<picture>` sources with width-descriptor `srcset` candidates, retains the
original image as a fallback, and adds intrinsic `width` and `height` values.
Below-the-fold images are lazy-loaded and decoded asynchronously; the
responsive hero image is preloaded with matching `imagesrcset` and `imagesizes`
to improve Largest Contentful Paint without fetching a redundant desktop image.

Tailwind CSS 3.4 bundles its Browserslist compatibility snapshot inside its CLI,
so `update-browserslist-db` cannot refresh that snapshot. The CSS build suppresses
only the bundled stale-data notice; it does not hide other build errors.

esbuild produces page-specific, minified CSS and JavaScript bundles with
content-hashed filenames. The Docker image runs this production build in a
builder stage, then copies only the generated site and production Node
dependencies into the runtime image. `npm.cmd start` in production mode also
requires the generated manifests; run `npm.cmd run build` first. The development
server can continue to serve the unbundled source assets.

Tailwind's content scanning removes unused utility classes from the generated
stylesheet. The legacy site CSS is retained because page styles and
JavaScript-controlled state classes are not all statically discoverable.

### Run a Lighthouse audit

1. Build and start the same production assets used by Docker:

   ```powershell
   npm.cmd run build
   docker compose up --build -d
   ```

2. Open `http://localhost:3000` in a current Chrome window. Open DevTools
   (**F12**), select **Lighthouse**, choose **Navigation**, **Mobile**, and all
   four categories: **Performance**, **Accessibility**, **Best Practices**, and
   **SEO**. Select **Analyze page load**.
3. Repeat for `/pages/services.html`, `/pages/contact.html`, and
   `/pages/coverage.html`; the home page alone cannot measure all page layouts
   or interactions. Use a clean browser profile and let each run finish without
   interacting with the page.
4. For a request waterfall, open **Network**, enable **Disable cache**, reload,
   and inspect the **Waterfall**, **Size**, and **Time** columns. Confirm the
   first hero request selects a suitably sized WebP, CSS/JS requests point to
   `/build/` hashed bundles, and no original plus optimized copy of the same
   hero image is downloaded. Long gaps before the first byte indicate server or
   hosting latency; long blocking CSS requests affect first paint; long
   JavaScript tasks increase Total Blocking Time.
5. Prioritize field metrics: Largest Contentful Paint (LCP) at or below 2.5 s,
   Cumulative Layout Shift (CLS) at or below 0.1, and Interaction to Next Paint
   (INP) at or below 200 ms. Lighthouse's lab run reports Total Blocking Time
   (TBT), a diagnostic proxy for INP, rather than field INP. Re-test on the
   actual hosting domain and representative mobile hardware/network; local
   scores are not a guarantee of hosted Core Web Vitals or a fixed 90+ score.

## Dependency security audit

Run an audit that fails the command only for high or critical findings, apply
non-breaking fixes, then audit again:

```powershell
npm.cmd audit --audit-level=high
npm.cmd audit fix
npm.cmd audit
```

Review the audit report and lockfile before applying updates. Avoid
`npm.cmd audit fix --force` unless you have reviewed and accepted its breaking
dependency changes. The current audit reports two moderate findings in
Nodemon's development-only `minimatch` dependency and no high-severity findings;
the suggested forced fix would downgrade Nodemon across a breaking major
version.

## Project structure

```text
database/
  schema.sql
scripts/
  build-assets.js
  convert-images.js
public/
  assets/
    images/
      site/                  # Source and generated WebP assets
  build/                     # Generated hashed production bundles (ignored by Git)
  css/
  js/
  pages/
  index.html
src/
  config/
    database.js
  generated/                 # Build-generated image/asset manifests (ignored by Git)
  middleware/
    errorHandler.js
    seo.js
  routes/
    health.routes.js
    inquiry.routes.js
  styles/
    tailwind.css
  app.js
  server.js
.env.example
package.json
tailwind.config.js
```

## Image assets

Website images are served locally from `public/assets/images/`; pages should
not load image files from external websites. The provided gallery and service
images (including `a8.png` and `ambulace.png`) are kept in that folder, and
other company-site images used by the homepage are stored under
`public/assets/images/site/`. Keep new images in this local image folder and
reference them with paths such as `/assets/images/a8.png`. The production build
creates modern WebP versions and width-specific responsive derivatives; these
generated files and manifests are excluded from Git and recreated by
`npm.cmd run build` or the Docker builder stage.
