FROM node:22-alpine AS build-stage
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build --configuration=production

FROM nginx:stable-alpine

COPY --from=build-stage /app/dist/intern-hub-boportal-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
