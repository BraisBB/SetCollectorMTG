FROM quay.io/keycloak/keycloak:24.0.1

# Copiar el archivo de configuración del realm
COPY realm-export.json /opt/keycloak/data/import/

# Configurar variables de entorno
ENV KEYCLOAK_ADMIN=ADMIN
ENV KEYCLOAK_ADMIN_PASSWORD=admin

# Configurar el comando de inicio
CMD ["start-dev", "--import-realm"] 