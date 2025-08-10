#!/bin/sh

LOG_DIR="/var/log/earlyearn/tracking"
LOG_FILE="$LOG_DIR/clicks.csv"

mkdir -p "$LOG_DIR"
chown nginx:nginx "$LOG_DIR"
chmod 755 "$LOG_DIR"

touch "$LOG_FILE"
chown nginx:nginx "$LOG_FILE"

cat <<EOF > /etc/logrotate.d/nginx_click_tracking
$LOG_FILE {
    size 1
    rotate 288
    missingok
    notifempty
    copytruncate
    create 0644 nginx nginx
    su nginx nginx
}
EOF

echo "* * * * * /usr/sbin/logrotate -f /etc/logrotate.d/nginx_click_tracking >> /var/log/cron_output.log 2>&1" >> /etc/crontabs/root

crond
tail -F /var/log/cron_output.log &

# Start Node.js app using npm
npm run start &

# Start nginx
nginx -g 'daemon off;'
