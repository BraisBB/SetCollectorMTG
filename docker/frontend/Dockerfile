# Etapa de construcción
FROM node:20-alpine AS build

# Instalar dependencias del sistema
RUN apk add --no-cache git

WORKDIR /app

# Copiar archivos de configuración de npm
COPY frontend/package*.json ./

# Instalar dependencias globales y locales
RUN npm install -g typescript vite && \
    npm ci --only=production=false

# Copiar código fuente
COPY frontend/ ./

# Construir la aplicación
RUN npm run build

# Verificar que el build fue exitoso
RUN ls -la dist/

# Etapa de producción
FROM nginx:alpine

# Instalar curl para health checks
RUN apk add --no-cache curl

# Copiar archivos estáticos compilados
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Crear directorios de logs
RUN mkdir -p /var/log/nginx

# Configurar permisos
RUN chown -R nginx:nginx /usr/share/nginx/html /var/log/nginx

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"] 