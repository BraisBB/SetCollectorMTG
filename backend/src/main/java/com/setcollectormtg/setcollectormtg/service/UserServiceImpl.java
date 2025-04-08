package com.setcollectormtg.setcollectormtg.service;

// --- Asegúrate de tener TODAS estas importaciones ---
import com.setcollectormtg.setcollectormtg.dto.UserCreateDto;
import com.setcollectormtg.setcollectormtg.dto.UserDto;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.UserMapper;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.model.UserCollection;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import jakarta.ws.rs.core.Response; // De jakarta.ws.rs-api
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Muy importante

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final Keycloak keycloakAdmin; // Inyectado desde KeycloakAdminConfig
    private final String realm; // Inyectado desde application.properties

    // Constructor para inyección (Asegúrate que todos los final se inicializan)
    public UserServiceImpl(UserRepository userRepository, UserMapper userMapper,
                           Keycloak keycloakAdmin, @Value("${keycloak.realm}") String realm) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.keycloakAdmin = keycloakAdmin;
        this.realm = realm;
    }

    @Override
    @Transactional // Aunque Keycloak no es transaccional con JPA, ayuda si hay lógica local adicional
    public UserDto createUser(UserCreateDto userCreateDto) {
        log.info("API request to create user: {}", userCreateDto.getUsername());

        // --- VALIDACIONES LOCALES (Opcional, Keycloak también valida) ---
        // Estas validaciones ahora podrían ser problemáticas si permites que Keycloak sea la fuente de verdad
        // Quizás quieras quitarlas o ajustar la lógica si Keycloak debe permitir duplicados que tu BD no.
        // Por ahora, las mantenemos como ejemplo.
        if (userRepository.existsByUsername(userCreateDto.getUsername())) {
            log.warn("Username {} already exists locally.", userCreateDto.getUsername());
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(userCreateDto.getEmail())) {
            log.warn("Email {} already exists locally.", userCreateDto.getEmail());
            throw new RuntimeException("Email already in use");
        }

        // --- PASO 1: Crear usuario en Keycloak ---
        UserRepresentation keycloakUser = new UserRepresentation();
        keycloakUser.setUsername(userCreateDto.getUsername());
        keycloakUser.setEmail(userCreateDto.getEmail());
        keycloakUser.setFirstName(userCreateDto.getFirstName());
        keycloakUser.setLastName(userCreateDto.getLastName());
        keycloakUser.setEnabled(true); // Habilitado por defecto
        keycloakUser.setEmailVerified(false); // Puedes cambiar esto o configurar acciones en Keycloak

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(userCreateDto.getPassword());
        credential.setTemporary(false); // Contraseña permanente
        keycloakUser.setCredentials(Collections.singletonList(credential));

        RealmResource realmResource = keycloakAdmin.realm(realm);
        UsersResource usersResource = realmResource.users();
        Response response = null;
        String keycloakUserId = null;

        try {
            log.debug("Attempting to create user in Keycloak realm '{}'", realm);
            response = usersResource.create(keycloakUser);
            log.debug("Keycloak response status: {}", response.getStatus());

            // --- PASO 2: Procesar respuesta de Keycloak ---
            if (response.getStatus() == 201) { // 201 Created = Éxito
                // Extraer el ID de Keycloak de la cabecera Location
                String locationHeader = response.getLocation().getPath();
                keycloakUserId = locationHeader.substring(locationHeader.lastIndexOf('/') + 1);
                log.info("User successfully created in Keycloak with ID: {}", keycloakUserId);

                // --- PASO 3: Crear usuario en la BD local ---
                User appUser = new User();
                appUser.setKeycloakId(keycloakUserId); // <-- Vinculación Clave
                appUser.setUsername(userCreateDto.getUsername());
                appUser.setEmail(userCreateDto.getEmail());
                appUser.setFirstName(userCreateDto.getFirstName());
                appUser.setLastName(userCreateDto.getLastName());
                // joinDate es @CreationTimestamp

                // Crear colección por defecto
                UserCollection defaultCollection = new UserCollection();
                defaultCollection.setUser(appUser);
                defaultCollection.setTotalCards(0);
                appUser.setUserCollection(defaultCollection);

                User savedUser = userRepository.save(appUser);
                log.info("Local user record created successfully for Keycloak ID: {}", keycloakUserId);
                return userMapper.toDto(savedUser);

            } else {
                // Error al crear en Keycloak
                String errorBody = "";
                if (response.hasEntity()) {
                    errorBody = response.readEntity(String.class);
                }
                log.error("Failed to create user in Keycloak. Status: {}, Info: {}, Body: {}",
                        response.getStatus(), response.getStatusInfo(), errorBody);
                // Lanza una excepción basada en el error de Keycloak
                throw new RuntimeException("Keycloak user creation failed. Status: " + response.getStatus() + " - " + errorBody);
            }

        } catch (Exception e) {
            log.error("Exception during user creation process for username {}: {}", userCreateDto.getUsername(), e.getMessage(), e);

            // --- PASO 4: Intentar Rollback en Keycloak si aplica ---
            if (keycloakUserId != null && response != null && response.getStatus() == 201) {
                // Se creó en Keycloak (status 201) pero falló después (probablemente al guardar en BD local)
                log.warn("Local DB save likely failed after Keycloak user creation. Attempting Keycloak user rollback for ID: {}", keycloakUserId);
                try {
                    usersResource.delete(keycloakUserId);
                    log.info("Rollback successful: Keycloak user {} deleted.", keycloakUserId);
                } catch (Exception deleteEx) {
                    // ¡¡ERROR CRÍTICO!! El usuario existe en Keycloak pero no localmente. Requiere intervención manual.
                    log.error("FATAL: Rollback failed! Keycloak user {} exists but local record failed or delete failed. Manual intervention required.", keycloakUserId, deleteEx);
                    // Considera lanzar una excepción específica para este estado inconsistente
                }
            }
            // Relanzar la excepción original o una nueva excepción más específica
            throw new RuntimeException("Error during user creation process", e);

        } finally {
            // Cerrar la respuesta de Keycloak para liberar recursos
            if (response != null) {
                response.close();
            }
        }
    }


    @Override
    @Transactional
    public User synchronizeUser(Jwt jwt) {
        // Tu lógica de sincronización (la que tenías antes) va aquí...
        String keycloakId = jwt.getSubject();
        if (keycloakId == null) {
            log.error("JWT token is missing 'sub' claim (Keycloak ID).");
            throw new IllegalArgumentException("Cannot synchronize user: Keycloak ID missing from token.");
        }

        Optional<User> existingUserOpt = userRepository.findByKeycloakId(keycloakId);
        User userToSave;
        boolean isNewUser = false;

        if (existingUserOpt.isEmpty()) {
            log.info("Creating new local user for Keycloak ID: {}", keycloakId);
            isNewUser = true;
            userToSave = new User();
            userToSave.setKeycloakId(keycloakId);
            // @CreationTimestamp se encarga de joinDate si está bien configurado,
            // pero establecerlo aquí es seguro si la anotación no funcionara por alguna razón.
            // userToSave.setJoinDate(LocalDate.now());

            UserCollection defaultCollection = new UserCollection();
            defaultCollection.setUser(userToSave);
            defaultCollection.setTotalCards(0);
            userToSave.setUserCollection(defaultCollection);

        } else {
            log.debug("Found existing local user for Keycloak ID: {}. Checking for updates.", keycloakId);
            userToSave = existingUserOpt.get();
        }

        boolean updated = false;
        String username = jwt.getClaimAsString("preferred_username");
        String email = jwt.getClaimAsString("email");
        String firstName = jwt.getClaimAsString("given_name");
        String lastName = jwt.getClaimAsString("family_name");

        if (username != null && !username.equals(userToSave.getUsername())) {
            // Considera si quieres permitir que el username local difiera del de Keycloak
            // o si quieres forzar la sincronización. Aquí forzamos sincronización.
            if (userRepository.existsByUsernameAndKeycloakIdNot(username, keycloakId)) {
                log.warn("Username '{}' already exists for a different Keycloak user. Skipping username update for Keycloak ID: {}", username, keycloakId);
            } else {
                userToSave.setUsername(username);
                updated = true;
            }
        }
        if (email != null && !email.equals(userToSave.getEmail())) {
            if (userRepository.existsByEmailAndKeycloakIdNot(email, keycloakId)) {
                log.warn("Email '{}' already exists for a different Keycloak user. Skipping email update for Keycloak ID: {}", email, keycloakId);
            } else {
                userToSave.setEmail(email);
                updated = true;
            }
        }
        if (firstName != null && !firstName.equals(userToSave.getFirstName())) {
            userToSave.setFirstName(firstName);
            updated = true;
        }
        if (lastName != null && !lastName.equals(userToSave.getLastName())) {
            userToSave.setLastName(lastName);
            updated = true;
        }

        if (isNewUser || updated) {
            log.info("Saving {} user data for Keycloak ID: {}", isNewUser ? "new" : "updated", keycloakId);
            // Verifica si falta algún campo NOT NULL antes de guardar si es nuevo
            if (isNewUser) {
                // Asegúrate de que los campos NOT NULL (username, email, firstName, lastName)
                // tengan valores (obtenidos del JWT o valores por defecto si el JWT no los trae)
                if (userToSave.getUsername() == null) userToSave.setUsername("default_username_" + keycloakId); // Placeholder
                if (userToSave.getEmail() == null) userToSave.setEmail(keycloakId + "@example.com"); // Placeholder
                if (userToSave.getFirstName() == null) userToSave.setFirstName("DefaultFirst"); // Placeholder
                if (userToSave.getLastName() == null) userToSave.setLastName("DefaultLast"); // Placeholder
                log.warn("User created with placeholder data for missing JWT claims. Keycloak ID: {}", keycloakId);
            }
            return userRepository.save(userToSave);
        } else {
            log.debug("No data changes detected for user with Keycloak ID: {}", keycloakId);
            return userToSave;
        }
    }

    @Override
    public List<UserDto> getAllUsers() {
        // Tu lógica existente...
        return userRepository.findAll().stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public UserDto getUserById(Long id) {
        // Tu lógica existente...
        return userRepository.findById(id)
                .map(userMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Override
    @Transactional
    public UserDto updateUser(Long id, UserDto userDto) {
        // Tu lógica existente... (Asegúrate de que NO intenta actualizar contraseña o keycloakId)
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Validaciones de unicidad (username/email) si cambian
        if (userDto.getUsername() != null && !user.getUsername().equals(userDto.getUsername())) {
            if (userRepository.existsByUsernameAndKeycloakIdNot(userDto.getUsername(), user.getKeycloakId())) {
                throw new RuntimeException("Username already exists for a different user.");
            }
        }
        if (userDto.getEmail() != null && !user.getEmail().equals(userDto.getEmail())) {
            if (userRepository.existsByEmailAndKeycloakIdNot(userDto.getEmail(), user.getKeycloakId())) {
                throw new RuntimeException("Email already exists for a different user.");
            }
        }

        // Actualiza campos desde DTO usando el mapper
        userMapper.updateUserFromDto(userDto, user);

        // Asegúrate de que los campos NOT NULL no queden nulos después del mapeo si el DTO los permite nulos
        if (user.getFirstName() == null) user.setFirstName("UpdatedFirst"); // O manejar en el mapper/DTO
        if (user.getLastName() == null) user.setLastName("UpdatedLast");   // O manejar en el mapper/DTO


        return userMapper.toDto(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        // Tu lógica existente... (Solo borra localmente)
        User user = userRepository.findById(id) // Carga el usuario para loggear info útil si es necesario
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        log.warn("Deleting local user record for id: {}, Keycloak ID: {}, Username: {}",
                id, user.getKeycloakId(), user.getUsername());
        // Considera si deberías llamar a Keycloak Admin API aquí para borrar también el usuario de Keycloak
        // usersResource.delete(user.getKeycloakId()); // <-- Requeriría inyectar UsersResource o Keycloak admin
        userRepository.deleteById(id);
    }
}