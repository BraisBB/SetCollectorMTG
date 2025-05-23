# 🐳 Podman Setup para SetCollectorMTG

## Sistema de Autenticación JWT Simple

Este proyecto ha sido migrado de Keycloak a un sistema de autenticación JWT simple integrado directamente en Spring Boot, y utiliza **Podman** como motor de contenedores.

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │     MySQL       │
│   (Nginx)       │◄──►│  (Spring Boot)   │◄──►│   Database      │
│   Puerto: 5173  │    │   Puerto: 8080   │    │  Puerto: 3306   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📋 Requisitos Previos

### Instalación de Podman

**Windows:**
```powershell
# Usando winget
winget install RedHat.Podman

# O usando Chocolatey
choco install podman-desktop
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install podman podman-compose
```

**macOS:**
```bash
# Usando Homebrew
brew install podman podman-compose
```

### Verificar Instalación
```bash
podman --version
podman-compose --version
```

## 🚀 Inicio Rápido

### 1. Construir y ejecutar todos los servicios

```bash
# Construir y ejecutar en modo desarrollo
podman-compose up --build

# Ejecutar en segundo plano
podman-compose up -d --build

# Solo construir sin ejecutar
podman-compose build
```

### 2. Verificar servicios

```bash
# Ver estado de los servicios
podman-compose ps

# Ver logs en tiempo real
podman-compose logs -f

# Ver logs de un servicio específico
podman-compose logs -f backend
podman-compose logs -f frontend
podman-compose logs -f mysql
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
podman-compose logs -f

# Logs del backend con filtro de nivel
podman-compose logs -f backend | grep ERROR

# Logs de nginx para debugging de API
podman exec setcollector-frontend tail -f /var/log/nginx/api_access.log
```

### Métricas

- **Spring Boot Actuator**: http://localhost:8080/actuator
- **Health Check**: http://localhost:8080/actuator/health

## 🛠️ Desarrollo

### Rebuilds durante desarrollo

```bash
# Rebuild solo el backend
podman-compose up --build backend

# Rebuild solo el frontend
podman-compose up --build frontend

# Rebuild todo
podman-compose up --build

# Forzar rebuild sin cache
podman-compose build --no-cache
```

### Acceso a contenedores

```bash
# Acceder al contenedor del backend
podman exec -it setcollector-backend bash

# Acceder al contenedor de MySQL
podman exec -it setcollector-mysql mysql -u setcollector -p

# Acceder al contenedor del frontend
podman exec -it setcollector-frontend sh
```

## 🔨 Comandos Útiles de Podman

### Gestión de Contenedores

```bash
# Parar todos los servicios
podman-compose down

# Parar y eliminar volúmenes
podman-compose down -v

# Eliminar imágenes construidas
podman-compose down --rmi all

# Ver todos los contenedores
podman ps -a

# Ver imágenes locales
podman images
```

### Limpieza del Sistema

```bash
# Limpiar contenedores parados
podman container prune

# Limpiar imágenes no utilizadas
podman image prune

# Limpiar volúmenes no utilizados
podman volume prune

# Limpiar todo el sistema
podman system prune -a

# Limpiar todo incluyendo volúmenes
podman system prune -a --volumes
```

### Base de Datos

```bash
# Backup de la base de datos
podman exec setcollector-mysql mysqldump -u root -proot setcollector > backup.sql

# Restaurar base de datos
podman exec -i setcollector-mysql mysql -u root -proot setcollector < backup.sql

# Acceder a MySQL CLI
podman exec -it setcollector-mysql mysql -u setcollector -p

# Ver logs de MySQL
podman-compose logs mysql
```

## 🎯 URLs de Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **MySQL**: localhost:3306
- **Health Checks**: 
  - Frontend: http://localhost:5173/health
  - Backend: http://localhost:8080/actuator/health

## ⚙️ Configuraciones Específicas de Podman

### Modo Rootless (Recomendado)

Podman funciona mejor en modo rootless para mayor seguridad:

```bash
# Verificar si Podman está en modo rootless
podman info | grep rootless

# Configurar subuid y subgid (si es necesario)
sudo usermod --add-subuids 10000-75535 $USER
sudo usermod --add-subgids 10000-75535 $USER
```

### Pods en Podman

```bash
# Ver pods creados por podman-compose
podman pod list

# Inspeccionar un pod específico
podman pod inspect setcollectormtg_default

# Ver logs de todo el pod
podman pod logs setcollectormtg_default
```

### Redes en Podman

```bash
# Listar redes
podman network ls

# Inspeccionar la red del proyecto
podman network inspect setcollectormtg_setcollector-network
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Backend no inicia**: Verificar que MySQL esté healthy
   ```bash
   podman-compose logs mysql
   podman exec setcollector-mysql mysqladmin ping -h localhost
   ```

2. **Frontend no puede comunicarse con backend**: Verificar configuración CORS
   ```bash
   podman-compose logs backend | grep CORS
   ```

3. **JWT tokens no funcionan**: Verificar variable `APP_JWT_SECRET`
   ```bash
   podman exec setcollector-backend env | grep JWT
   ```

4. **Problemas de permisos (Linux)**: Verificar configuración de rootless
   ```bash
   podman info | grep -A5 -B5 rootless
   ```

5. **Puertos ocupados**: Verificar qué está usando los puertos
   ```bash
   # Linux/macOS
   netstat -tlnp | grep -E ':(3306|8080|5173)'
   
   # Windows
   netstat -an | findstr "3306 8080 5173"
   ```

### Reset Completo

```bash
# Parar todos los contenedores y pods
podman-compose down -v

# Eliminar pod completo
podman pod rm -f setcollectormtg_default

# Eliminar imágenes locales del proyecto
podman rmi setcollectormtg_backend setcollectormtg_frontend

# Eliminar volúmenes
podman volume rm setcollectormtg_mysql_data

# Rebuild desde cero
podman-compose up --build
```

### Problemas Específicos de Windows

```powershell
# Verificar que el servicio de Podman esté ejecutándose
Get-Service podman

# Reiniciar máquina virtual de Podman
podman machine stop
podman machine start

# Ver información de la máquina virtual
podman machine list
```

## 🔄 Migración desde Docker

Si vienes de Docker, estos son los equivalentes en Podman:

| Docker Command | Podman Equivalent |
|---|---|
| `docker-compose up` | `podman-compose up` |
| `docker ps` | `podman ps` |
| `docker exec -it` | `podman exec -it` |
| `docker logs` | `podman logs` |
| `docker build` | `podman build` |
| `docker images` | `podman images` |
| `docker system prune` | `podman system prune` |

## 📝 Notas Importantes

- **Podman es compatible con Docker**: Usa las mismas imágenes y Dockerfiles
- **Rootless por defecto**: Mayor seguridad sin necesidad de privilegios root
- **Pods nativos**: Podman-compose crea pods automáticamente
- **No hay daemon**: Podman no requiere un daemon ejecutándose
- **Integración con systemd**: Mejor integración con servicios del sistema
- **Compatible con Kubernetes**: Los pods de Podman pueden exportarse como YAML de Kubernetes

## 🔐 Seguridad

- Los usuarios se almacenan directamente en MySQL
- Las contraseñas se hashean con BCrypt
- Los roles se manejan como strings simples: "USER", "ADMIN" 
- JWT tokens se almacenan en localStorage del navegador
- Contenedores ejecutan en modo rootless para mayor seguridad
- Variables de entorno sensibles deben configurarse externamente en producción 