package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.UserCreateDto;
import com.setcollectormtg.setcollectormtg.dto.UserDto;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.UserMapper;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.model.UserCollection;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;

import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;

import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Muy importante
import java.util.Collections;

import java.util.List;

import java.util.ArrayList;
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

    /**
     * Crea un usuario tanto en Keycloak como en la base de datos local, asignando el rol USER por defecto.
     * Realiza rollback en Keycloak si falla la creación local.
     * Lanza excepción si el usuario o email ya existen localmente o si ocurre un error en Keycloak.
     *
     * @param userCreateDto DTO con los datos del usuario a crear
     * @return DTO del usuario creado
     */
    @Override
    @Transactional
    public UserDto createUser(UserCreateDto userCreateDto) {
        log.info("API request to create user: {}", userCreateDto.getUsername());
        if (userRepository.existsByUsername(userCreateDto.getUsername())) {
            log.warn("Username {} already exists locally.", userCreateDto.getUsername());
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(userCreateDto.getEmail())) {
            log.warn("Email {} already exists locally.", userCreateDto.getEmail());
            throw new RuntimeException("Email already in use");
        }

        // Crear un mapa con solo los campos necesarios
        UserRepresentation userRepresentation = new UserRepresentation();
        userRepresentation.setUsername(userCreateDto.getUsername());
        userRepresentation.setEmail(userCreateDto.getEmail());
        userRepresentation.setFirstName(userCreateDto.getFirstName());
        userRepresentation.setLastName(userCreateDto.getLastName());
        userRepresentation.setEnabled(true);
        userRepresentation.setEmailVerified(false);

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(userCreateDto.getPassword());
        credential.setTemporary(false);
        userRepresentation.setCredentials(Collections.singletonList(credential));

        RealmResource realmResource = keycloakAdmin.realms().realm(realm);
        Response response = null;
        String keycloakUserId = null;

        try {
            log.debug("Attempting to create user in Keycloak realm '{}'", realm);
            response = realmResource.users().create(userRepresentation);

            log.debug("Keycloak response status: {}", response.getStatus());
            if (response.getStatus() == 201) { // 201 Created = Éxito
                String locationHeader = response.getLocation().getPath();
                keycloakUserId = locationHeader.substring(locationHeader.lastIndexOf('/') + 1);
                log.info("User successfully created in Keycloak with ID: {}", keycloakUserId);

                // Asignar rol USER por defecto
                assignRolesToUser(realmResource, keycloakUserId, Collections.singletonList("USER"));

                // Crear usuario local
                User appUser = new User();
                appUser.setKeycloakId(keycloakUserId);
                appUser.setUsername(userCreateDto.getUsername());
                appUser.setEmail(userCreateDto.getEmail());
                appUser.setFirstName(userCreateDto.getFirstName());
                appUser.setLastName(userCreateDto.getLastName());

                UserCollection defaultCollection = new UserCollection();
                defaultCollection.setUser(appUser);
                defaultCollection.setTotalCards(0);
                appUser.setUserCollection(defaultCollection);

                User savedUser = userRepository.save(appUser);
                log.info("Local user record created successfully with default USER role for Keycloak ID: {}",
                        keycloakUserId);
                return userMapper.toDto(savedUser);
            } else {
                String errorBody = "";
                if (response.hasEntity()) {
                    errorBody = response.readEntity(String.class);
                }
                log.error("Failed to create user in Keycloak. Status: {}, Info: {}, Body: {}",
                        response.getStatus(), response.getStatusInfo(), errorBody);
                throw new RuntimeException(
                        "Keycloak user creation failed. Status: " + response.getStatus() + " - " + errorBody);
            }
        } catch (Exception e) {
            log.error("Exception during user creation process for username {}: {}", userCreateDto.getUsername(),
                    e.getMessage(), e);
            if (keycloakUserId != null && response != null && response.getStatus() == 201) {
                log.warn(
                        "Local DB save likely failed after Keycloak user creation. Attempting Keycloak user rollback for ID: {}",
                        keycloakUserId);
                try {
                    realmResource.users().delete(keycloakUserId);
                    log.info("Rollback successful: Keycloak user {} deleted.", keycloakUserId);
                } catch (Exception deleteEx) {
                    log.error(
                            "FATAL: Rollback failed! Keycloak user {} exists but local record failed or delete failed. Manual intervention required.",
                            keycloakUserId, deleteEx);
                }
            }
            throw new RuntimeException("Error during user creation process", e);
        } finally {
            if (response != null) {
                response.close();
            }
        }
    }

    /**
     * Sincroniza un usuario local a partir de un JWT de Keycloak. Si no existe localmente, lo crea con los datos del token.
     *
     * @param jwt Token JWT de Keycloak
     * @return Usuario sincronizado o creado
     */
    @Override
    @Transactional
    public User synchronizeUser(Jwt jwt) {
        String keycloakId = jwt.getSubject();
        if (keycloakId == null) {
            log.error("JWT token is missing 'sub' claim (Keycloak ID).");
            throw new IllegalArgumentException("Cannot synchronize user: Keycloak ID missing from token.");
        }

        Optional<User> existingUserOpt = userRepository.findByKeycloakId(keycloakId);

        if (existingUserOpt.isEmpty()) {
            log.info("Creating new local user for Keycloak ID: {}", keycloakId);
            User userToSave = new User();
            userToSave.setKeycloakId(keycloakId);

            String username = jwt.getClaimAsString("preferred_username");
            String email = jwt.getClaimAsString("email");
            String firstName = jwt.getClaimAsString("given_name");
            String lastName = jwt.getClaimAsString("family_name");

            userToSave.setUsername(username != null ? username : "default_username_" + keycloakId);
            userToSave.setEmail(email != null ? email : keycloakId + "@example.com");
            userToSave.setFirstName(firstName != null ? firstName : "DefaultFirst");
            userToSave.setLastName(lastName != null ? lastName : "DefaultLast");

            // Crear y asociar la colección por defecto
            UserCollection defaultCollection = new UserCollection();
            defaultCollection.setUser(userToSave);
            defaultCollection.setTotalCards(0);
            userToSave.setUserCollection(defaultCollection);

            // Guardar el usuario (esto también guardará la colección debido a
            // CascadeType.ALL)
            return userRepository.save(userToSave);
        }

        return existingUserOpt.get();
    }

    /**
     * Obtiene todos los usuarios registrados en la base de datos local.
     *
     * @return Lista de usuarios en formato DTO
     */
    @Override
    public List<UserDto> getAllUsers() {
        // Tu lógica existente...
        return userRepository.findAll().stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todos los usuarios paginados.
     *
     * @param pageable Parámetros de paginación
     * @return Página de usuarios en formato DTO
     */
    @Override
    public Page<UserDto> getAllUsersPaged(Pageable pageable) {
        return userRepository.findAll(pageable).map(userMapper::toDto);
    }

    /**
     * Obtiene un usuario por su ID local.
     *
     * @param id ID del usuario
     * @return DTO del usuario
     */
    @Override
    public UserDto getUserById(Long id) {
        log.info("API request to get user by id: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("User with id {} not found", id);
                    return new ResourceNotFoundException("User not found with id: " + id);
                });
        return userMapper.toDto(user);
    }

    /**
     * Obtiene un usuario por su nombre de usuario.
     *
     * @param username Nombre de usuario
     * @return DTO del usuario
     */
    @Override
    public UserDto getUserByUsername(String username) {
        log.info("API request to get user by username: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("User with username {} not found", username);
                    return new ResourceNotFoundException("User not found with username: " + username);
                });
        return userMapper.toDto(user);
    }

    /**
     * Actualiza los datos de un usuario local, validando que el username y email no estén repetidos en otros usuarios.
     *
     * @param id      ID del usuario a actualizar
     * @param userDto DTO con los nuevos datos
     * @return DTO actualizado del usuario
     */
    @Override
    @Transactional
    public UserDto updateUser(Long id, UserDto userDto) {
        log.info("API request to update user: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("User with id {} not found for update", id);
                    return new ResourceNotFoundException("User not found with id: " + id);
                });

        // Verificar que el username no esté en uso por otro usuario
        if (!user.getUsername().equals(userDto.getUsername()) &&
                userRepository.existsByUsername(userDto.getUsername())) {
            log.warn("Username {} already in use by another user", userDto.getUsername());
            throw new RuntimeException("Username already in use by another user");
        }

        // Verificar que el email no esté en uso por otro usuario
        if (!user.getEmail().equals(userDto.getEmail()) &&
                userRepository.existsByEmail(userDto.getEmail())) {
            log.warn("Email {} already in use by another user", userDto.getEmail());
            throw new RuntimeException("Email already in use by another user");
        }

        // Actualizar campos del usuario
        userMapper.updateUserFromDto(userDto, user);
        User updatedUser = userRepository.save(user);
        return userMapper.toDto(updatedUser);
    }

    /**
     * Actualiza los datos de un usuario local por nombre de usuario, validando que el email no esté repetido en otros usuarios.
     *
     * @param username Nombre de usuario
     * @param userDto  DTO con los nuevos datos
     * @return DTO actualizado del usuario
     */
    @Override
    @Transactional
    public UserDto updateUserByUsername(String username, UserDto userDto) {
        log.info("API request to update user by username: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("User with username {} not found for update", username);
                    return new ResourceNotFoundException("User not found with username: " + username);
                });

        // Verificar que el email no esté en uso por otro usuario
        if (!user.getEmail().equals(userDto.getEmail()) &&
                userRepository.existsByEmail(userDto.getEmail())) {
            log.warn("Email {} already in use by another user", userDto.getEmail());
            throw new RuntimeException("Email already in use by another user");
        }

        // Actualizar campos del usuario (excepto el username)
        user.setEmail(userDto.getEmail());
        user.setFirstName(userDto.getFirstName());
        user.setLastName(userDto.getLastName());

        User updatedUser = userRepository.save(user);
        return userMapper.toDto(updatedUser);
    }

    /**
     * Elimina un usuario tanto de Keycloak como de la base de datos local.
     * Lanza excepción si ocurre un error en Keycloak.
     *
     * @param id ID del usuario a eliminar
     */
    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        String keycloakUserId = user.getKeycloakId();
        if (keycloakUserId != null) {
            try {
                log.info("Attempting to delete user from Keycloak with ID: {}", keycloakUserId);
                RealmResource realmResource = keycloakAdmin.realm(realm);
                realmResource.users().delete(keycloakUserId);
                log.info("Successfully deleted user from Keycloak with ID: {}", keycloakUserId);
            } catch (Exception e) {
                log.error("Error deleting user from Keycloak with ID {}: {}", keycloakUserId, e.getMessage());
                throw new RuntimeException("Failed to delete user from Keycloak", e);
            }
        }

        log.warn("Deleting local user record for id: {}, Keycloak ID: {}, Username: {}",
                id, keycloakUserId, user.getUsername());
        userRepository.deleteById(id);
    }

    /**
     * Asigna una lista de roles a un usuario en Keycloak, creando los roles si no existen.
     *
     * @param id    ID del usuario local
     * @param roles Lista de nombres de roles a asignar
     */
    @Override
    @Transactional
    public void assignRolesToUser(Long id, List<String> roles) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        String keycloakUserId = user.getKeycloakId();
        if (keycloakUserId == null) {
            throw new IllegalStateException("User doesn't have a Keycloak ID");
        }

        RealmResource realmResource = keycloakAdmin.realm(realm);
        assignRolesToUser(realmResource, keycloakUserId, roles);
    }

    /**
     * Elimina un rol (de realm o cliente) de un usuario en Keycloak.
     *
     * @param id       ID del usuario local
     * @param roleName Nombre del rol a eliminar
     */
    @Override
    @Transactional
    public void removeRoleFromUser(Long id, String roleName) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        String keycloakUserId = user.getKeycloakId();
        if (keycloakUserId == null) {
            throw new IllegalStateException("User doesn't have a Keycloak ID");
        }

        try {
            RealmResource realmResource = keycloakAdmin.realm(realm);

            // Intentar como rol de reino primero
            try {
                RoleRepresentation role = realmResource.roles().get(roleName).toRepresentation();
                if (role != null) {
                    realmResource.users().get(keycloakUserId).roles().realmLevel()
                            .remove(Collections.singletonList(role));
                    log.info("Removed realm role {} from user {}", roleName, keycloakUserId);
                    return;
                }
            } catch (Exception e) {
                log.debug("Role {} not found as realm role, trying client role", roleName);
            }

            // Si no es rol de reino, buscar como rol de cliente
            String clientId = realmResource.clients().findByClientId("setcollector-app").get(0).getId();

            RoleRepresentation role = realmResource.clients().get(clientId)
                    .roles().get(roleName).toRepresentation();

            if (role != null) {
                realmResource.users().get(keycloakUserId).roles().clientLevel(clientId)
                        .remove(Collections.singletonList(role));
                log.info("Removed client role {} from user {}", roleName, keycloakUserId);
            }
        } catch (Exception e) {
            log.error("Error removing role {} from user {}: {}", roleName, keycloakUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to remove role from user", e);
        }
    }

    /**
     * Obtiene todos los roles (de realm y cliente) asignados a un usuario en Keycloak.
     *
     * @param id ID del usuario local
     * @return Lista de nombres de roles
     */
    @Override
    public List<String> getUserRoles(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        String keycloakUserId = user.getKeycloakId();
        if (keycloakUserId == null) {
            throw new IllegalStateException("User doesn't have a Keycloak ID");
        }

        try {
            RealmResource realmResource = keycloakAdmin.realm(realm);

            // Obtener roles de reino
            List<String> roles = realmResource.users().get(keycloakUserId).roles().realmLevel().listAll()
                    .stream()
                    .map(RoleRepresentation::getName)
                    .collect(Collectors.toList());

            // Obtener roles de cliente
            String clientId = realmResource.clients().findByClientId("setcollector-app").get(0).getId();

            List<String> clientRoles = realmResource.users().get(keycloakUserId).roles().clientLevel(clientId).listAll()
                    .stream()
                    .map(RoleRepresentation::getName)
                    .collect(Collectors.toList());

            roles.addAll(clientRoles);
            return roles;
        } catch (Exception e) {
            log.error("Error getting roles for user {}: {}", keycloakUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to get user roles", e);
        }
    }

    /**
     * Crea un rol en Keycloak si no existe.
     *
     * @param realmResource Recurso del realm de Keycloak
     * @param roleName      Nombre del rol
     */
    private void createRoleIfNotExists(RealmResource realmResource, String roleName) {
        try {
            // Intentar obtener el rol
            realmResource.roles().get(roleName).toRepresentation();
        } catch (Exception e) {
            // El rol no existe, crearlo
            RoleRepresentation role = new RoleRepresentation();
            role.setName(roleName);
            role.setDescription("Role " + roleName);
            realmResource.roles().create(role);
            log.info("Created new role in realm: {}", roleName);
        }
    }

    /**
     * Asigna una lista de roles de realm a un usuario en Keycloak.
     *
     * @param realmResource Recurso del realm de Keycloak
     * @param userId        ID de usuario en Keycloak
     * @param roleNames     Lista de nombres de roles
     */
    private void assignRolesToUser(RealmResource realmResource, String userId, List<String> roleNames) {
        try {
            // Obtener el usuario
            UserResource userResource = realmResource.users().get(userId);
            List<RoleRepresentation> rolesToAssign = new ArrayList<>();

            for (String roleName : roleNames) {
                // Asegurarse de que el rol existe
                createRoleIfNotExists(realmResource, roleName);

                try {
                    // Obtener el rol del realm
                    RoleRepresentation realmRole = realmResource.roles().get(roleName).toRepresentation();
                    if (realmRole != null) {
                        rolesToAssign.add(realmRole);
                        log.debug("Found realm role: {}", roleName);
                    }
                } catch (Exception e) {
                    log.error("Error getting role {} after creation: {}", roleName, e.getMessage());
                    throw new RuntimeException("Could not assign role " + roleName);
                }
            }

            if (!rolesToAssign.isEmpty()) {
                // Asignar roles de realm
                userResource.roles().realmLevel().add(rolesToAssign);
                log.info("Assigned realm roles {} to user {}", roleNames, userId);
            } else {
                log.error("No roles were found to assign to user {}", userId);
                throw new RuntimeException("No roles found to assign");
            }
        } catch (Exception e) {
            log.error("Error assigning roles to user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to assign roles to user", e);
        }
    }
}