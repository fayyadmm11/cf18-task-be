# --- Tahap 1: Build ---
FROM node:18-alpine AS builder
WORKDIR /app

# 1. Install pnpm ke dalam sistem Docker
RUN npm install -g pnpm

# 2. Salin package.json DAN pnpm-lock.yaml (jika ada)
COPY package.json pnpm-lock.yaml* ./

# 3. Install semua dependensi menggunakan pnpm
RUN pnpm install

# Salin seluruh kode backend Anda
COPY . .

# 4. Compile kode NestJS menggunakan pnpm
RUN pnpm run build

# --- Tahap 2: Production ---
FROM node:18-alpine
WORKDIR /app

# Install pnpm lagi untuk tahap production
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./

# 5. Install HANYA dependensi production (mengabaikan devDependencies)
RUN pnpm install --prod

# Salin hasil build dari Tahap 1
COPY --from=builder /app/dist ./dist

# Buka port 3000
EXPOSE 3000

# Perintah untuk menjalankan aplikasi
CMD ["node", "dist/main"]