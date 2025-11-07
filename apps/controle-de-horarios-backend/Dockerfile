# ==========================================
# 🚀 CONTROLE DE HORÁRIOS BACKEND - MULTI-STAGE
# ==========================================

# ---- Build Stage ----
  FROM node:20-alpine AS builder

  WORKDIR /app
  
  # Instalar dependências de build
  RUN apk add --no-cache python3 make g++ git
  
  # Copiar package.json e instalar dependências
  COPY package.json ./
  RUN npm install
  
  # Copiar código fonte e buildar
  COPY src ./src
  COPY tsconfig*.json ./
  COPY nest-cli.json ./
  
  # Build
  RUN npm run build
  
  # ---- Production Stage ----
  FROM node:20-slim AS production
  
  # Instalar dependências de runtime
  RUN apt-get update && apt-get install -y \
      curl bash netcat-openbsd ca-certificates \
      && rm -rf /var/lib/apt/lists/*
  
  # ==========================================
  # 🚀 APLICAÇÃO
  # ==========================================
  WORKDIR /app
  
  # Instalar apenas dependências de produção
  COPY package.json ./
  RUN npm install --only=production
  
  # Copiar build da aplicação
  COPY --from=builder /app/dist ./dist
  
  # Criar diretórios e usuário
  RUN mkdir -p logs uploads \
      && groupadd -g 1001 nodejs \
      && useradd -u 1001 -g nodejs -m nestjs \
      && chown -R nestjs:nodejs /app
  
  # Environment
  ENV NODE_ENV=production
  ENV HOST=0.0.0.0
  ENV PORT=3335
  
  HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
      CMD curl -f http://10.10.100.176:3335/health || exit 1
  
  EXPOSE 3335
  USER nestjs
  
  CMD ["node", "dist/main.js"]