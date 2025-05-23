-- =================================================================
-- Script de inicialización de MySQL para SetCollectorMTG
-- Sistema de autenticación JWT simple (sin Keycloak)
-- =================================================================

-- Crear la base de datos principal si no existe
CREATE DATABASE IF NOT EXISTS setcollector CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE setcollector;

-- Crear usuario si no existe y darle permisos
CREATE USER IF NOT EXISTS 'setcollector'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON setcollector.* TO 'setcollector'@'%';
FLUSH PRIVILEGES;

-- Mostrar información de configuración
SELECT 'Inicialización completada exitosamente' AS status;
SELECT 'Base de datos: setcollector' AS database_name;
SELECT 'Usuario creado: setcollector' AS database_user;
SELECT 'Las tablas se crearán automáticamente por JPA' AS jpa_note;
SELECT 'Registro disponible en: /auth/register' AS authentication_note; 