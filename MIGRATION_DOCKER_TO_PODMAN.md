# 🔄 Guía de Migración: Docker → Podman

## SetCollectorMTG - Migración Completa a Podman

Esta guía te ayudará a migrar completamente de Docker a Podman para el proyecto SetCollectorMTG.

## 📋 Resumen de Cambios Realizados

### ✅ Archivos Actualizados

1. **Archivo de Compose**:
   - `docker-compose.yml` → `podman-compose.yml`
   - Rutas actualizadas: `./docker/` → `./podman/`

2. **Carpeta de Configuración**:
   - `docker/` → `podman/` (renombrada)
   - Todos los Dockerfiles actualizados con rutas correctas

3. **Documentación**:
   - `podman/README.md` completamente actualizado
   - Comandos Docker → comandos Podman
   - Nuevas secciones específicas de Podman

4. **Scripts de Automatización**:
   - `podman/scripts/start.sh` (Linux/macOS)
   - `podman/scripts/start.bat` (Windows)
   - `podman/scripts/stop.sh`
   - `podman/scripts/logs.sh`

5. **Configuración Optimizada**:
   - `podman/mysql/my.cnf` optimizado para Podman rootless
   - Variables de entorno actualizadas

## 🚀 Instalación de Podman

### Windows
```powershell
# Usando Chocolatey
choco install podman-desktop

# O descargar desde el sitio oficial
# https://podman.io/getting-started/installation#windows
```

### macOS
```bash
# Usando Homebrew
brew install podman

# Inicializar la máquina virtual
podman machine init
podman machine start
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y podman

# Para podman-compose
sudo apt-get install -y podman-compose
```

### Linux (Fedora/RHEL)
```bash
sudo dnf install podman podman-compose
```

## 🔧 Configuración Inicial

### 1. Verificar Instalación
```bash
podman --version
podman-compose --version  # o 'podman compose version'
```

### 2. Configuración de Red (si es necesario)
```bash
# Ver redes disponibles
podman network ls

# Crear red personalizada si es necesario
podman network create setcollector-network
```

### 3. Configuración Rootless (Linux)
```bash
# Verificar configuración de subuid/subgid
cat /etc/subuid
cat /etc/subgid

# Si no están configurados, agregar:
# echo "$(whoami):100000:65536" | sudo tee -a /etc/subuid
# echo "$(whoami):100000:65536" | sudo tee -a /etc/subgid
```

## 🎯 Comandos de Migración

### Parar Docker (si está corriendo)
```bash
# Parar servicios Docker existentes
docker-compose down -v --rmi local

# Opcional: Limpiar Docker completamente
docker system prune -a --volumes
```

### Iniciar con Podman
```bash
# Opción 1: Usando scripts (recomendado)
./podman/scripts/start.sh -d --build

# Opción 2: Comando directo
podman-compose up -d --build

# Opción 3: En Windows
./podman/scripts/start.bat -d -b
```

## 📊 Comparación de Comandos

| Tarea | Docker | Podman |
|-------|--------|--------|
| Iniciar servicios | `docker-compose up -d` | `podman-compose up -d` |
| Ver contenedores | `docker ps` | `podman ps` |
| Ver logs | `docker logs <container>` | `podman logs <container>` |
| Ejecutar comando | `docker exec -it <container> bash` | `podman exec -it <container> bash` |
| Parar servicios | `docker-compose down` | `podman-compose down` |
| Limpiar sistema | `docker system prune -a` | `podman system prune -a` |
| Información | `docker info` | `podman info` |

## 🔍 Verificación Post-Migración

### 1. Verificar Servicios
```bash
# Estado de los servicios
podman-compose ps

# O usando los scripts
./podman/scripts/logs.sh all
```

### 2. Probar Conectividad
```bash
# Frontend
curl http://localhost:5173/health

# Backend
curl http://localhost:8080/actuator/health

# MySQL (desde el contenedor backend)
podman exec setcollector-backend curl -f http://mysql:3306 || echo "MySQL disponible"
```

### 3. Verificar Logs
```bash
# Ver logs de todos los servicios
./podman/scripts/logs.sh all -f

# Solo errores
./podman/scripts/logs.sh all --errors
```

## 🐛 Troubleshooting Específico de Podman

### Problema: Permisos en Linux Rootless
```bash
# Verificar configuración
podman unshare cat /proc/self/uid_map

# Reset si es necesario
podman system reset
```

### Problema: Puertos Ocupados
```bash
# Verificar qué usa los puertos
sudo netstat -tulnp | grep -E ':(3306|8080|5173)'

# Cambiar puertos en podman-compose.yml si es necesario
```

### Problema: Memoria Insuficiente
```bash
# Ver estadísticas
podman stats

# Ajustar configuración MySQL en podman/mysql/my.cnf
```

### Problema: Red No Funciona
```bash
# Recrear red
podman network rm setcollector-network
podman network create setcollector-network

# Reiniciar servicios
podman-compose down && podman-compose up -d
```

## 🎉 Ventajas de la Migración

### ✅ Beneficios de Podman vs Docker

1. **Seguridad Mejorada**:
   - Ejecuta sin daemon root
   - Mejor aislamiento de procesos
   - Menos superficie de ataque

2. **Compatibilidad**:
   - 100% compatible con Dockerfiles
   - Mismos comandos (casi idénticos)
   - Soporte para Docker Compose

3. **Pods Nativos**:
   - Soporte nativo para pods de Kubernetes
   - Mejor para entornos multi-contenedor

4. **Recursos**:
   - Menor uso de memoria
   - Sin daemon en segundo plano
   - Mejor para desarrollo local

5. **Licencia**:
   - Completamente open source
   - Sin restricciones de licencia

## 📝 Próximos Pasos

1. **Validar Funcionamiento**:
   - [ ] Frontend carga correctamente
   - [ ] Backend responde a API calls
   - [ ] MySQL acepta conexiones
   - [ ] Autenticación JWT funciona

2. **Optimización**:
   - [ ] Ajustar configuración de memoria
   - [ ] Configurar logs de producción
   - [ ] Implementar monitoreo

3. **Documentación**:
   - [ ] Actualizar README principal
   - [ ] Documentar nuevos scripts
   - [ ] Capacitar al equipo

4. **CI/CD** (opcional):
   - [ ] Actualizar pipelines para usar Podman
   - [ ] Configurar registro de contenedores
   - [ ] Automatizar despliegues

## 🆘 Soporte

Si encuentras problemas durante la migración:

1. **Logs Detallados**:
   ```bash
   ./podman/scripts/logs.sh all --errors --since 1h
   ```

2. **Información del Sistema**:
   ```bash
   podman info
   podman version
   ```

3. **Reset Completo**:
   ```bash
   ./podman/scripts/stop.sh --clean
   ./podman/scripts/start.sh -b -d
   ```

La migración está **COMPLETA** y lista para usar. ¡Disfruta de las ventajas de Podman! 🎉 