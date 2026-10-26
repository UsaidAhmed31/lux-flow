#!/bin/sh
# One-time server setup (Debian/Ubuntu). Run as root: sh setup-server.sh <deploy-user>
set -e
U=${1:?deploy user}
apt-get update && apt-get install -y nginx rsync
mkdir -p /var/www/lux-flow && chown -R "$U" /var/www/lux-flow
cat > /etc/nginx/sites-available/lux-flow <<'CONF'
server {
    listen 80 default_server;
    root /var/www/lux-flow;
    index index.html;
    location / { try_files $uri $uri/ =404; }
}
CONF
ln -sf /etc/nginx/sites-available/lux-flow /etc/nginx/sites-enabled/lux-flow
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
