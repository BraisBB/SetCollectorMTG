-- =================================================================
-- Script de inicialización de MySQL para SetCollectorMTG
-- Optimizado para contenedores Docker con autenticación JWT
-- =================================================================

-- Crear la base de datos principal con configuración UTF8MB4
CREATE DATABASE IF NOT EXISTS setcollector 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE setcollector;

-- Crear usuario de aplicación con permisos específicos
CREATE USER IF NOT EXISTS 'setcollector'@'%' IDENTIFIED BY 'password';

-- Otorgar permisos necesarios para la aplicación Spring Boot
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX ON setcollector.* TO 'setcollector'@'%';

-- Permisos adicionales para JPA/Hibernate
GRANT CREATE TEMPORARY TABLES ON setcollector.* TO 'setcollector'@'%';
GRANT LOCK TABLES ON setcollector.* TO 'setcollector'@'%';

-- Refrescar privilegios
FLUSH PRIVILEGES;

-- Configurar variables de sesión optimizadas para Docker
SET GLOBAL innodb_file_per_table = 1;
SET GLOBAL innodb_flush_log_at_trx_commit = 2;

-- Verificar configuración de timezone (debe ser UTC para Docker)
SELECT @@global.time_zone AS global_timezone, @@session.time_zone AS session_timezone;

-- Mostrar información de inicialización
SELECT 'SetCollectorMTG - Inicialización Docker completada' AS status;
SELECT 'Base de datos: setcollector (UTF8MB4)' AS database_info;
SELECT 'Usuario: setcollector con permisos JPA' AS user_info;
SELECT 'Contenedor: MySQL 8.0 en Docker' AS container_info;
SELECT 'Endpoints disponibles:' AS endpoints_title;
SELECT '  - Frontend: http://localhost:5173' AS frontend_url;
SELECT '  - Backend API: http://localhost:8080' AS backend_url;
SELECT '  - Swagger UI: http://localhost:8080/swagger-ui/index.html' AS swagger_url;
SELECT '  - Health Check: http://localhost:8080/actuator/health' AS health_url;
SELECT '  - Registro: http://localhost:8080/auth/register' AS register_url;

-- Mostrar configuración de la base de datos
SHOW VARIABLES LIKE 'character_set_database';
SHOW VARIABLES LIKE 'collation_database';

-- =================================================================
-- Fin del script de inicialización
-- Las tablas de entidades se crearán automáticamente por JPA
-- ================================================================= 