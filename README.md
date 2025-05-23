# 🎮 SetCollectorMTG - Magic: The Gathering Card Collector

Una aplicación web completa para coleccionar y gestionar cartas de Magic: The Gathering, construida con **Spring Boot**, **React**, y **MySQL** usando **Podman** para el despliegue.

## 🏗️ Arquitectura del Sistema

- **Backend**: Spring Boot 3 con autenticación JWT
- **Frontend**: React + TypeScript + Vite
- **Base de datos**: MySQL 8.0
- **Contenedores**: Podman con podman-compose
- **Servidor web**: Nginx (para frontend en producción)

## 🚀 Inicio Rápido

### 1. Instalar Podman

**Windows:**
```powershell
# Instalar Podman Desktop
winget install RedHat.Podman

# Configurar WSL (si es necesario)
wsl --install
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install podman podman-compose
```

### 2. Inicializar y arrancar Podman

```bash
# Solo en Windows/macOS (primera vez)
    podman machine init
    podman machine start

# Verificar instalación
podman --version
podman-compose --version
```

### 3. Ejecutar la aplicación completa

```bash
# Clonar el repositorio
git clone <repository-url>
cd SetCollectorMTG

# Construir y ejecutar todos los servicios
podman-compose up --build

# O en segundo plano
podman-compose up -d --build
```

## 🌐 URLs de Acceso

Una vez iniciada la aplicación:

- **Frontend (App Web)**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **API Documentation (Swagger)**: http://localhost:8080/swagger-ui/index.html
- **Health Check Backend**: http://localhost:8080/actuator/health
- **Health Check Frontend**: http://localhost:5173/health

## 🔐 Sistema de Autenticación

### Registro de Usuario
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario",
    "password": "password123",
    "email": "usuario@example.com",
    "firstName": "Juan",
    "lastName": "Pérez"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario",
    "password": "password123"
  }'
```

## 🛠️ Desarrollo Local

### Ejecutar solo el Backend (desarrollo)

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### Ejecutar solo el Frontend (desarrollo)

```bash
cd frontend
npm install
npm run dev
```

### Base de Datos

La base de datos MySQL se inicializa automáticamente con:
- **Database**: `setcollector`
- **Usuario**: `setcollector`
- **Password**: `password`
- **Puerto**: `3306`

## 📋 Características

- ✅ **Autenticación JWT** (sin Keycloak)
- ✅ **Gestión de usuarios y roles** (USER, ADMIN)
- ✅ **Búsqueda de cartas** de Magic: The Gathering
- ✅ **Colección personal** de cartas
- ✅ **Panel administrativo** para gestión de usuarios
- ✅ **API REST** documentada con Swagger
- ✅ **Frontend responsive** con React
- ✅ **Contenedorización** con Podman
- ✅ **Health checks** y monitoreo

## 🔧 Comandos Útiles

```bash
# Ver estado de servicios
podman-compose ps

# Ver logs en tiempo real
podman-compose logs -f

# Parar servicios
podman-compose down

# Rebuild completo
podman-compose down && podman-compose up --build

# Acceder a MySQL
podman exec -it setcollector-mysql mysql -u setcollector -p

# Backup de base de datos
podman exec setcollector-mysql mysqldump -u root -proot setcollector > backup.sql
```

## 📁 Estructura del Proyecto

```
SetCollectorMTG/
├── backend/                 # Spring Boot API
│   ├── src/main/java/
│   └── pom.xml
├── frontend/                # React App
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── podman/                  # Configuración de contenedores
│   ├── backend/Dockerfile
│   ├── frontend/Dockerfile
│   ├── mysql/
│   └── README.md
├── podman-compose.yml       # Orquestación de servicios
└── README.md
```

## 📚 Documentación Adicional

- [Configuración de Podman](./podman/README.md) - Guía completa de despliegue
- [API Documentation](http://localhost:8080/swagger-ui/index.html) - Swagger UI
- [Spring Boot Actuator](http://localhost:8080/actuator) - Métricas y salud

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

