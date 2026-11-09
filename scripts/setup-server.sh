#!/usr/bin/env bash
# setup-server.sh — Run once on a fresh Ubuntu 22.04 / 24.04 Spaceship VPS.
# Usage: sudo bash scripts/setup-server.sh
set -euo pipefail

REPO_URL="https://github.com/evathoma/evathomatrixsecurity.com.git"
APP_DIR="/opt/evatho"
DOMAIN="www.evathomatrixsecurity.com"
EMAIL="info@evathomatrixsecurity.com"

echo "==> Updating system packages"
apt-get update -y
apt-get upgrade -y

echo "==> Installing prerequisites"
apt-get install -y ca-certificates curl gnupg lsb-release ufw git

# ── Docker ──────────────────────────────────────────────────────────────────
echo "==> Installing Docker Engine + Compose plugin"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

# ── Nginx ────────────────────────────────────────────────────────────────────
echo "==> Installing Nginx"
apt-get install -y nginx
systemctl enable nginx

# ── Certbot ──────────────────────────────────────────────────────────────────
echo "==> Installing Certbot (snap)"
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

# ── Firewall ─────────────────────────────────────────────────────────────────
echo "==> Configuring UFW firewall"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22022/tcp
ufw allow 'Nginx Full'
ufw --force enable
ufw status

# ── Clone repository ─────────────────────────────────────────────────────────
echo "==> Cloning repository to ${APP_DIR}"
if [ -d "${APP_DIR}/.git" ]; then
  echo "    Repository already cloned — skipping."
else
  git clone "${REPO_URL}" "${APP_DIR}"
fi
cd "${APP_DIR}"

# ── Environment file ─────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "==> Creating .env from template"
  cp .env.example .env
  echo ""
  echo "  !! IMPORTANT: Edit ${APP_DIR}/.env before continuing."
  echo "     Set a strong DB_PASSWORD, correct SITE_URL, and"
  echo "     set TRUST_PROXY_HOPS=1 (nginx is one hop)."
  echo ""
  echo "  Run:  nano ${APP_DIR}/.env"
  echo "  Then: bash ${APP_DIR}/scripts/deploy.sh"
  echo ""
  exit 0
fi

# ── Nginx site config ────────────────────────────────────────────────────────
echo "==> Installing Nginx site configuration"
cp nginx/evathomatrixsecurity.conf /etc/nginx/sites-available/evathomatrixsecurity.conf
ln -sf /etc/nginx/sites-available/evathomatrixsecurity.conf \
       /etc/nginx/sites-enabled/evathomatrixsecurity.conf
rm -f /etc/nginx/sites-enabled/default

# Temporarily serve HTTP only so certbot can issue the certificate
sed -i '/ssl_certificate/d;/include.*options-ssl/d;/ssl_dhparam/d' \
  /etc/nginx/sites-available/evathomatrixsecurity.conf
sed -i 's/listen 443 ssl;/listen 443;/g' \
  /etc/nginx/sites-available/evathomatrixsecurity.conf

nginx -t && systemctl reload nginx

# ── SSL certificate ───────────────────────────────────────────────────────────
echo "==> Obtaining Let's Encrypt certificate for ${DOMAIN}"
certbot --nginx -d "${DOMAIN}" -d "evathomatrixsecurity.com" \
  --non-interactive --agree-tos -m "${EMAIL}" --redirect

# Restore the full SSL config (certbot rewrites it; verify it looks correct)
cp nginx/evathomatrixsecurity.conf /etc/nginx/sites-available/evathomatrixsecurity.conf
nginx -t && systemctl reload nginx

# ── Start application ────────────────────────────────────────────────────────
echo "==> Starting Docker Compose stack"
docker compose up --build -d

echo ""
echo "✓ Setup complete. Site should be live at https://${DOMAIN}"
echo "  Logs: docker compose -f ${APP_DIR}/docker-compose.yml logs -f"
