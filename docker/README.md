# 🐳 Docker Setup para SetCollectorMTG

## Sistema de Autenticación JWT Simple

Este proyecto ha sido migrado de Keycloak a un sistema de autenticación JWT simple integrado directamente en Spring Boot.

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │     MySQL       │
│   (Nginx)       │◄──►│  (Spring Boot)   │◄──►│   Database      │
│   Puerto: 5173  │    │   Puerto: 8080   │    │  Puerto: 3306   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Inicio Rápido

### 1. Construir y ejecutar todos los servicios

```bash
# Construir y ejecutar en modo desarrollo
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up -d --build
```

### 2. Verificar servicios

```bash
# Ver estado de los servicios
docker-compose ps

# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### 3. Health Checks

- **Frontend**: http://localhost:5173/health
- **Backend**: http://localhost:8080/actuator/health
- **Base de datos**: Verificado automáticamente via MySQL ping

## 🔐 Autenticación

### Endpoints de Autenticación

- **Login**: `POST /auth/login`
- **Registro**: `POST /auth/register`

### Ejemplo de Login

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Ejemplo de Registro

```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "password123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

## 🔧 Configuración

### Variables de Entorno

#### Backend (Spring Boot)
- `SPRING_DATASOURCE_URL`: URL de la base de datos
- `APP_JWT_SECRET`: Clave secreta para JWT
- `APP_JWT_EXPIRATION`: Tiempo de expiración del token (ms)
- `CORS_ALLOWED_ORIGINS`: Orígenes permitidos para CORS

#### Frontend (Nginx)
- `NGINX_HOST`: Host del servidor nginx
- `NGINX_PORT`: Puerto del servidor nginx

### Perfiles de Spring Boot

- **docker**: Configuración optimizada para contenedores
- **dev**: Configuración para desarrollo local

## 📊 Monitoreo

### Logs

```bash
# Logs en tiempo real de todos los servicios
docker-compose logs -f

# Logs del backend con filtro de nivel
docker-compose logs -f backend | grep ERROR

# Logs de nginx para debugging de API
docker exec setcollector-frontend tail -f /var/log/nginx/api_access.log
```

### Métricas

- **Spring Boot Actuator**: http://localhost:8080/actuator
- **Health Check**: http://localhost:8080/actuator/health

## 🛠️ Desarrollo

### Rebuilds durante desarrollo

```bash
# Rebuild solo el backend
docker-compose up --build backend

# Rebuild solo el frontend
docker-compose up --build frontend

# Rebuild todo
docker-compose up --build
```

### Acceso a contenedores

```bash
# Acceder al contenedor del backend
docker exec -it setcollector-backend bash

# Acceder al contenedor de MySQL
docker exec -it setcollector-mysql mysql -u setcollector -p

# Acceder al contenedor del frontend
docker exec -it setcollector-frontend sh
```

## 🔨 Comandos Útiles

### Gestión de Contenedores

```bash
# Parar todos los servicios
docker-compose down

# Parar y eliminar volúmenes
docker-compose down -v

# Eliminar imágenes construidas
docker-compose down --rmi all

# Limpiar todo (contenedores, redes, volúmenes)
docker system prune -a
```

### Base de Datos

```bash
# Backup de la base de datos
docker exec setcollector-mysql mysqldump -u root -proot setcollector > backup.sql

# Restaurar base de datos
docker exec -i setcollector-mysql mysql -u root -proot setcollector < backup.sql

# Acceder a MySQL CLI
docker exec -it setcollector-mysql mysql -u setcollector -p
```

## 🎯 URLs de Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **MySQL**: localhost:3306
- **Health Checks**: 
  - Frontend: http://localhost:5173/health
  - Backend: http://localhost:8080/actuator/health

## 🚨 Troubleshooting

### Problemas Comunes

1. **Backend no inicia**: Verificar que MySQL esté healthy
   ```bash
   docker-compose logs mysql
   ```

2. **Frontend no puede comunicarse con backend**: Verificar configuración CORS
   ```bash
   docker-compose logs backend | grep CORS
   ```

3. **JWT tokens no funcionan**: Verificar variable `APP_JWT_SECRET`
   ```bash
   docker exec setcollector-backend env | grep JWT
   ```

### Reset Completo

```bash
# Parar todos los contenedores
docker-compose down -v

# Eliminar imágenes locales
docker-compose down --rmi local

# Eliminar volúmenes
docker volume rm setcollectormtg_mysql_data

# Rebuild desde cero
docker-compose up --build
```

## 📝 Notas

- El sistema ya no requiere Keycloak
- Los tokens JWT se almacenan en localStorage del navegador
- Los usuarios se almacenan directamente en MySQL
- Las contraseñas se hashean con BCrypt
- Los roles se manejan como strings simples: "USER", "ADMIN" 