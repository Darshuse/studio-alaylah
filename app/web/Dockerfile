# ===== تثبيت وبناء =====
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# API_URL يُحقن وقت البناء والتشغيل (rewrites)
ARG API_URL=http://localhost:8080
ENV API_URL=$API_URL
RUN npm run build

# ===== التشغيل (standalone) =====
FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 4000
ENV PORT=4000
CMD ["sh","-c","node server.js"]
