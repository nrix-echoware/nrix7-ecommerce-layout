#!/bin/sh

# Ensure data directory exists
mkdir -p /app/data

# Fix permissions for data directory and all files
echo "Fixing permissions for data directory..."
chown -R appuser:appuser /app/data
chmod -R 775 /app/data

# Fix permissions on database file if it exists
if [ -f "/app/data/contactus.db" ]; then
    chown appuser:appuser /app/data/contactus.db
    chmod 664 /app/data/contactus.db
fi

echo "Starting main server..."
exec su -s /bin/sh appuser -c "cd /app && ./main"


