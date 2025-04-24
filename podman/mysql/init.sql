-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS setcollector CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE setcollector;

-- Crear usuario si no existe y darle permisos
CREATE USER IF NOT EXISTS 'setcollector'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON setcollector.* TO 'setcollector'@'%';
FLUSH PRIVILEGES;

-- Aquí se pueden agregar todas las tablas si se desea pre-crearlas
-- No es necesario si se usa JPA con hibernate.ddl-auto=update 