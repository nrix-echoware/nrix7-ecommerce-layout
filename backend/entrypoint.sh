#!/bin/sh

# Run cleanup once at startup
echo "Running initial token cleanup..."
DB_FILE="${DB_FILE:-/app/data/contactus.db}"
if [ -f "/app/cleanup_tokens" ]; then
    cd /app && DB_FILE="$DB_FILE" /app/cleanup_tokens || echo "Warning: Initial cleanup failed, continuing..."
else
    echo "Warning: cleanup_tokens binary not found"
fi

# Set up cron job for token cleanup (runs every 2 hours)
echo "0 */2 * * * cd /app && DB_FILE=${DB_FILE:-/app/data/contactus.db} /app/cleanup_tokens >> /app/cleanup_tokens.log 2>&1" > /var/spool/cron/crontabs/appuser
chmod 600 /var/spool/cron/crontabs/appuser
chown appuser:appuser /var/spool/cron/crontabs/appuser

# Start cron daemon in background
crond -l 2 -L /dev/stdout -b

echo "Starting main server..."
# Switch to appuser and execute the main command
exec su -s /bin/sh appuser -c "cd /app && ./main"


