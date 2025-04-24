FROM quay.io/keycloak/keycloak:21.1.1

# Copiar el archivo de configuración del realm
COPY ../realm-export.json /opt/keycloak/data/import/

# Configurar variables de entorno
ENV KEYCLOAK_ADMIN=ADMIN
ENV KEYCLOAK_ADMIN_PASSWORD=admin
ENV KC_IMPORT_REALM=setcollector-realm

# Configurar el comando de inicio
CMD ["start-dev", "--import-realm"] 