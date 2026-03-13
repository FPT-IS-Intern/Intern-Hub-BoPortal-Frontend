#!/bin/sh
# Substitute env vars into env-config.js at container startup
envsubst < /usr/share/nginx/html/env-config.js.template > /usr/share/nginx/html/env-config.js

# Start nginx
exec nginx -g "daemon off;"
