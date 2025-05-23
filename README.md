# SetCollectorMTG - Magic: The Gathering 

Una aplicación web para visualizar sets de cartas y virtualizar tu colección personal de cartas Magic: The Gathering y creacion de Decks.
Desarrollada con Spring Boot 3, React 19, y MySQL 8.0, desplegada con Docker.

## Tecnologías Utilizadas

### Backend
- **Spring Boot 3.4.3** con Java 21
- **Spring Security** con autenticación JWT
- **Spring Data JPA** con Hibernate
- **MySQL 8.0** como base de datos principal
- **H2** para testeo
- **MapStruct** para mapeo de DTOs
- **SpringDoc OpenAPI 3** (Swagger)
- **Maven** como gestor de dependencias
- **Lombok** para reducir código boilerplate

### Frontend
- **React 19** con TypeScript
- **Vite** como build tool y dev server
- **React Router DOM 7** para enrutamiento
- **Axios** para comunicación HTTP
- **Mana Font** para iconos de MTG
- **ESLint** para análisis de código

### DevOps
- **Docker** y **Docker Compose** para contenedorización
- **Nginx** como servidor web y proxy reverso
- **Multi-stage builds** para optimización de imágenes

## Instalación y Configuración

### Requisitos Previos

- **Docker Desktop** (versión 20.10 o superior)
- **Git** para clonar el repositorio
- Al menos **4GB RAM** disponible

#### Instalar Docker

**Windows:**
```powershell
# Instalar Docker Desktop
winget install Docker.DockerDesktop
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin
sudo usermod -aG docker $USER
```

**Linux (Fedora/RHEL):**
```bash
sudo dnf install docker docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

**macOS:**
```bash
# Con Homebrew
brew install --cask docker
```

#### Verificar instalación

```bash
docker --version
docker compose version
docker info
```

### Despliegue de la Aplicación

```bash
# Clonar el repositorio
git clone <repository-url>
cd SetCollectorMTG

# Primero construir las imagenes
docker compose build

# Levantar los contenedores en segundo plano (recomendado)
docker compose up -d 
```

### Verificar el despliegue

```bash
# Verificar estado de servicios
docker compose ps

# Ver logs de inicialización
docker compose logs -f
```

## Acceso a la Aplicación

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:5173 | Aplicación web principal |
| **API Backend** | http://localhost:8080 | API REST |
| **Swagger UI** | http://localhost:8080/swagger-ui/index.html | Documentación interactiva |
| **Health Check Backend** | http://localhost:8080/actuator/health | Estado del backend |
| **Health Check Frontend** | http://localhost:5173/health | Estado del frontend |

## Funcionalidades Principales

- **Autenticación JWT** con roles de usuario (USER, ADMIN)
- **Búsqueda avanzada** de cartas de Magic: The Gathering
- **Gestión de colección personal**
- **Panel administrativo** para gestión de usuarios
- **API REST** con documentación Swagger
- **Interfaz responsive** optimizada para dispositivos móviles
- **Health checks** y monitoreo de servicios

## API REST - Endpoints Principales

### Autenticación
```bash
# Registro de usuario
POST /auth/register
Content-Type: application/json
{
  "username": "usuario",
  "password": "password123",
  "email": "usuario@example.com",
  "firstName": "Juan",
  "lastName": "Pérez"
}

# Login
POST /auth/login
Content-Type: application/json
{
  "username": "usuario",
  "password": "password123"
}
```

### Cartas
```bash
# Buscar cartas
GET /cards/search?name=Lightning&pageSize=20&page=0

# Obtener carta por ID
GET /cards/{id}

# Cartas por set
GET /cards/set/{setCode}
```

### Colección de Usuario
```bash
# Obtener colección personal
GET /users/me/collection
Authorization: Bearer {jwt_token}

# Agregar carta a colección
POST /users/me/collection/{cardId}
Authorization: Bearer {jwt_token}
```


### Base de Datos MySQL

**Configuración por defecto:**
- **Host**: localhost
- **Puerto**: 3306
- **Base de datos**: setcollector
- **Usuario**: setcollector
- **Password**: password
- **Charset**: utf8mb4

**Uso de la Base de Datos (para comprobaciones)**
- Abrimos terminal de Docker (puede abrirse desde Docker Desktop)
mysql -u setcollector -p
- Entrar con la contraseña 
- Ver Base de Datos
SHOW DATABASES;
- Cambiar a la base de setcollector
USE setcollector;
- Ver nombre de las tablas para realizar las consultas que se consideren
SHOW TABLES;

## Comandos de Administración Docker

### Gestión de Servicios

```bash
# Ver estado detallado
docker compose ps -a

# Logs en tiempo real
docker compose logs -f

# Logs por servicio
docker compose logs -f mysql
docker compose logs -f backend
docker compose logs -f frontend

# Reiniciar servicio específico
docker compose restart backend

# Parar servicios
docker compose down

# Parar y eliminar volúmenes (PRECAUCIÓN: borra datos)
docker compose down -v

# Rebuild completo
docker compose down ; docker compose up --build -d
```

### Gestión de Base de Datos

```bash
# Acceder a MySQL
docker compose exec mysql mysql -u setcollector -p

# Acceder como root
docker compose exec mysql mysql -u root -proot

# Backup completo
docker compose exec mysql mysqldump -u root -proot setcollector > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker compose exec -T mysql mysql -u root -proot setcollector < backup.sql

# Ver logs de MySQL
docker compose logs mysql | grep ERROR
```

### Monitoreo y Depuración

```bash
# Recursos del sistema
docker stats

# Información detallada de contenedores
docker compose exec backend ps aux
docker compose exec backend df -h

# Variables de entorno
docker compose exec backend env | grep SPRING

# Acceso a shell de contenedores
docker compose exec backend bash
docker compose exec frontend sh
docker compose exec mysql bash

# Inspeccionar redes
docker network ls
docker network inspect setcollectormtg_setcollector-network
```

### Limpieza del Sistema

```bash
# Limpiar imágenes no utilizadas
docker image prune

# Limpiar todo el sistema Docker
docker system prune -a

# Limpiar volúmenes no utilizados
docker volume prune

# Ver uso de espacio
docker system df
```

## Estructura del Proyecto

```
SetCollectorMTG/
├── backend/                      # API Spring Boot
│   ├── src/main/java/
│   │   └── com/setcollectormtg/
│   │       ├── config/           # Configuración (Security, CORS, etc.)
│   │       ├── controller/       # Controladores REST
│   │       ├── dto/             # Data Transfer Objects
│   │       ├── entity/          # Entidades JPA
│   │       ├── mapper/          # MapStruct mappers
│   │       ├── repository/      # Repositorios JPA
│   │       ├── service/         # Lógica de negocio
│   │       └── util/           # Utilidades
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── application-docker.properties
│   └── pom.xml                  # Dependencias Maven
├── frontend/                    # Aplicación React
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   ├── pages/             # Páginas de la aplicación
│   │   ├── services/          # Servicios API
│   │   ├── types/             # Tipos TypeScript
│   │   └── utils/             # Utilidades
│   ├── public/                # Archivos estáticos
│   ├── package.json           # Dependencias npm
│   └── vite.config.ts         # Configuración Vite
├── docker/                    # Configuración Docker
│   ├── backend/Dockerfile     # Imagen backend multi-stage
│   ├── frontend/
│   │   ├── Dockerfile         # Imagen frontend con Nginx
│   │   └── nginx.conf         # Configuración Nginx
│   └── mysql/
│       ├── init.sql          # Script inicialización DB
│       └── my.cnf            # Configuración MySQL
├── docker-compose.yml        # Orquestación servicios
├── .dockerignore            # Archivos excluidos Docker
├── .gitignore              # Archivos excluidos Git
└── README.md               # Documentación proyecto
```

## Configuración Docker

### Servicios Definidos

1. **mysql**: Base de datos MySQL 8.0 con configuración optimizada
2. **backend**: API Spring Boot con build multi-stage Java 21
3. **frontend**: Aplicación React servida por Nginx Alpine

### Volúmenes Persistentes

- `mysql_data`: Datos de MySQL para persistencia entre reinicios

### Red de Contenedores

- `setcollector-network`: Red bridge para comunicación interna

### Variables de Entorno

Las variables se configuran en `docker-compose.yml`:

```yaml
# Backend
MYSQL_HOST: mysql
SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/setcollector
APP_JWT_SECRET: [configurado]
LOGGING_LEVEL_ROOT: INFO

# Frontend
NGINX_HOST: localhost
NGINX_PORT: 80
```

## Solución de Problemas Comunes

### Error: Puerto ya en uso
```bash
# Verificar procesos usando puertos
netstat -tulpn | grep :5173
netstat -tulpn | grep :8080
netstat -tulpn | grep :3306

# Parar servicios Docker
docker compose down

# En Windows, verificar procesos
Get-Process -Name "*docker*" | Stop-Process
```

### Error: Falta de memoria
```bash
# Verificar uso de memoria
docker stats --no-stream

# Limpiar sistema Docker
docker system prune -a
docker volume prune

# Aumentar memoria Docker Desktop (Settings > Resources)
```

### Error: Base de datos no conecta
```bash
# Verificar logs MySQL
docker compose logs mysql

# Verificar conectividad
docker compose exec backend ping mysql

# Reiniciar solo MySQL
docker compose restart mysql

# Verificar variables de entorno
docker compose exec backend env | grep MYSQL
```

### Error: Build falla
```bash
# Limpiar cache Docker
docker builder prune

# Build sin cache
docker compose build --no-cache

# Verificar espacio en disco
df -h
docker system df
```

## Seguridad y Configuración de Producción

### Variables de Entorno Recomendadas

Para producción, crear archivo `.env`:

```env
# JWT
APP_JWT_SECRET=tu_clave_secreta_super_segura_minimo_256_bits
APP_JWT_EXPIRATION=86400000

# MySQL
MYSQL_ROOT_PASSWORD=password_root_seguro
MYSQL_PASSWORD=password_usuario_seguro

# Logging
LOGGING_LEVEL_ROOT=WARN
LOGGING_LEVEL_COM_SETCOLLECTORMTG=INFO
```

### SSL/HTTPS

Para habilitar HTTPS en producción, modificar `nginx.conf`:

```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    # ... resto de configuración
}
```

## Testing

### Backend Tests
```bash
cd backend

# Tests unitarios
mvn test

# Tests de integración
mvn verify

# Coverage report
mvn jacoco:report
```

### Frontend Tests
```bash
cd frontend


# Build test
npm run build
```

## Documentación Adicional

- [Docker Documentation](https://docs.docker.com/)
- [Spring Boot Reference](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev/)
- [API Documentation](http://localhost:8080/swagger-ui/index.html) (cuando esté ejecutándose)
- [MySQL 8.0 Reference](https://dev.mysql.com/doc/refman/8.0/en/)

## Soporte

Para problemas o preguntas:

1. Revisar esta documentación
2. Consultar logs: `docker compose logs`
3. Verificar [Issues existentes](link-to-issues)
4. Crear nuevo Issue con información detallada

---

**Versión**: 1.0.0  
**Java**: 21 | **Spring Boot**: 3.4.3 | **React**: 19 | **MySQL**: 8.0

