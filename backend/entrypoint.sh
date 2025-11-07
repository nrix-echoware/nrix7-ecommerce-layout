#!/bin/sh

# Ensure data directories exist
mkdir -p /app/data
mkdir -p /app/data/audio_contacts

# Fix permissions for data directory and all files
echo "Fixing permissions for data directory..."
chown -R appuser:appuser /app/data
chmod -R 775 /app/data

echo "Starting main server..."
exec su -s /bin/sh appuser -c "cd /app && ./main"


