# Etapa de construcción
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copiar archivos de configuración de Maven
COPY backend/pom.xml .

# Descargar dependencias (esto permite mejor caching)
RUN mvn dependency:go-offline -B

# Copiar código fuente
COPY backend/src ./src

# Compilar la aplicación
RUN mvn clean package -DskipTests -B

# Etapa de ejecución
FROM eclipse-temurin:21-jre-jammy

# Instalar curl para health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root para seguridad
RUN groupadd -r spring && useradd -r -g spring spring

WORKDIR /app

# Copiar el JAR compilado desde la etapa de construcción
COPY --from=build /app/target/*.jar app.jar

# Cambiar ownership a usuario spring
RUN chown spring:spring app.jar

# Cambiar a usuario no-root
USER spring

# Configurar JVM para contenedores
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Punto de entrada con configuración JVM optimizada
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"] 