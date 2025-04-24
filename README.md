# Arranque de API SetCollectorMTG

### Instalar Podman:
    https://podman.io/ --> Para descargar desde web.
    Se requiere wsl:   wsl --install  

### Iniciar Podman:
    podman machine init
    podman machine start

### Inicia un contenedor de Keycloak en el puerto 8181 con las credenciales especificadas (ya se especifica la version 21.1.1 para la imagen):
    podman run -d -p 8181:8080 -e KEYCLOAK_ADMIN=ADMIN -e KEYCLOAK_ADMIN_PASSWORD=admin --name keycloak quay.io/keycloak/keycloak:21.1.1 start-dev

### Copia tu archivo realm-export.json al contenedor:
    podman cp C:\ruta\a\tu\realm-export.json keycloak:/tmp/realm-export.json

### Importa el archivo realm en Keycloak:
    podman exec -i keycloak /opt/keycloak/bin/kc.sh import --file /tmp/realm-export.json

- Una vez arrancando el contenedor en Podman. Abriremos una terminal desde el archivo del backend. E realizaremos los siguientes comandos por orden:

    #### mvn clean install
    #### mvn spring-boot:run

### Para consultar:
- Prueba de consultas en Swagger: http://localhost:8080/swagger-ui/index.html#/

- Ver configuracion de Keycloak: http://localhost:8181/realms/master/protocol/openid-connect/auth?client_id=security-admin-console&redirect_uri=http%3A%2F%2Flocalhost%3A8181%2Fadmin%2Fmaster%2Fconsole%2F%23%2Fsetcollector-realm%2Frealm-settings&state=e828d2d7-debd-4b1b-8136-b06e53416588&response_mode=fragment&response_type=code&scope=openid&nonce=cde2e264-21db-46b5-8ed1-35091867bb57&code_challenge=sx05LdIVzeFgzUsXOyCwvQZpdxwC-6FkM7pF8Io4Pis&code_challenge_method=S256

- Ver base de datos (temporal) (buscar en application.properties las credenciales de inici de sesion en h2): http://localhost:8080/h2-console/

