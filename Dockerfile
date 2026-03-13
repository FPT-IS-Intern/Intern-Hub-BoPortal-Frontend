FROM node:22-alpine AS build-stage
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build --configuration=production

FROM nginx:stable-alpine

COPY --from=build-stage /app/dist/intern-hub-boportal-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Runtime env injection
COPY env-config.js.template /usr/share/nginx/html/env-config.js.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
