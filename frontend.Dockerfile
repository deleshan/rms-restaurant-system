# ---- Admin ----
FROM node:20-alpine AS admin-build
WORKDIR /app
COPY admin-dashboard/package*.json ./
RUN npm ci
COPY admin-dashboard/ .
ENV VITE_API_URL=/api
ENV VITE_CUSTOMER_URL=http://localhost
RUN npm run build

# ---- Kitchen (KDS) ----
FROM node:20-alpine AS kds-build
WORKDIR /app
COPY cooking-dashboard/package*.json ./
RUN npm ci
COPY cooking-dashboard/ .
ENV VITE_API_URL=/api
RUN npm run build

# ---- Customer QR ----
FROM node:20-alpine AS customer-build
WORKDIR /app
COPY customer-qr-app/package*.json ./
RUN npm ci
COPY customer-qr-app/ .
ENV VITE_API_URL=/api
RUN npm run build

# ---- Final: Nginx serving all three ----
FROM nginx:alpine
COPY --from=admin-build /app/dist /usr/share/nginx/html/admin
COPY --from=kds-build /app/dist /usr/share/nginx/html/kds
COPY --from=customer-build /app/dist /usr/share/nginx/html/customer
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 8081 8082