# syntax=docker/dockerfile:1.4
# Pushify repoda Dockerfile görürse kendi şablonu yerine bunu kullanır.
# Kendi şablonundan farkı: next.config.ts imaja giriyor (görsel ayarları çalışma
# anında buradan okunur) ve yüklenen görseller için yazılabilir bir klasör var.

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps --ignore-scripts
COPY . .
RUN npm rebuild 2>/dev/null || true
# Tailwind v4'ün yerel derleyicisi için Linux ikilisi
RUN if [ -d node_modules/lightningcss ]; then \
      LC_VER=$(node -p "require('lightningcss/package.json').version"); \
      npm install --no-save --no-audit --no-fund "lightningcss-linux-x64-gnu@${LC_VER}" || true; \
    fi

# Pushify tüm ortam değişkenlerini build-arg olarak geçirir. Ana sayfa derlemede
# veritabanından üretildiği için DATABASE_URL burada da gerekli. Bu değerler
# yalnızca derleme aşamasında kalır, son imaja girmez.
ARG DATABASE_URL
ARG NEXT_PUBLIC_SITE_URL
ENV DATABASE_URL=$DATABASE_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=cache,target=/app/.next/cache npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Yüklenen görseller /app/storage altında tutulur; pushify.yaml buraya kalıcı bir
# volume bağlar. Klasör nextjs kullanıcısına ait olmalı: Docker yeni volume'u ilk
# bağlarken bu sahipliği devralır, böylece uygulama klasöre yazabilir.
RUN mkdir -p /app/storage/uploads && chown -R nextjs:nodejs /app/storage

USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
