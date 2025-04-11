package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.UserCreateDto;
import com.setcollectormtg.setcollectormtg.dto.UserDto;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.UserMapper;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.model.UserCollection;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import jakarta.ws.rs.client.Client;
import jakarta.ws.rs.client.ClientBuilder;
import jakarta.ws.rs.client.Entity;
import jakarta.ws.rs.client.WebTarget;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Muy importante
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
            log.debug("UserRepresentation being sent to Keycloak: {}", userRepresentation);
            response = realmResource.users().create(userRepresentation);

            log.debug("Keycloak response status: {}", response.getStatus());
            if (response.getStatus() == 201) { // 201 Created = Éxito
                String locationHeader = response.getLocation().getPath();
                keycloakUserId = locationHeader.substring(locationHeader.lastIndexOf('/') + 1);
                log.info("User successfully created in Keycloak with ID: {}", keycloakUserId);

                // Asignar roles al usuario
                assignRolesToUser(realmResource, keycloakUserId, List.of("USER"));

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
                log.info("Local user record created successfully for Keycloak ID: {}", keycloakUserId);
                return userMapper.toDto(savedUser);
            } else {
                String errorBody = "";
                if (response.hasEntity()) {
                    errorBody = response.readEntity(String.class);
                }
                log.error("Failed to create user in Keycloak. Status: {}, Info: {}, Body: {}",
                        response.getStatus(), response.getStatusInfo(), errorBody);
                throw new RuntimeException("Keycloak user creation failed. Status: " + response.getStatus() + " - " + errorBody);
            }
        } catch (Exception e) {
            log.error("Exception during user creation process for username {}: {}", userCreateDto.getUsername(), e.getMessage(), e);
            if (keycloakUserId != null && response != null && response.getStatus() == 201) {
                log.warn("Local DB save likely failed after Keycloak user creation. Attempting Keycloak user rollback for ID: {}", keycloakUserId);
                try {
                    realmResource.users().delete(keycloakUserId);
                    log.info("Rollback successful: Keycloak user {} deleted.", keycloakUserId);
                } catch (Exception deleteEx) {
                    log.error("FATAL: Rollback failed! Keycloak user {} exists but local record failed or delete failed. Manual intervention required.", keycloakUserId, deleteEx);
                }
            }
            throw new RuntimeException("Error during user creation process", e);
        } finally {
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
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Ya no necesitamos la verificación de autorización aquí,
        // la anotación @PreAuthorize en el controlador ya la realizó.

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

        userMapper.updateUserFromDto(userDto, user);

        if (user.getFirstName() == null) user.setFirstName("UpdatedFirst");
        if (user.getLastName() == null) user.setLastName("UpdatedLast");

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


    private void assignRolesToUser(RealmResource realmResource, String userId, List<String> roleNames) {
        try {
            // 1. Obtener el ID del cliente (tu aplicación Spring)
            String clientId = null;
            // Puedes inyectar esto como una propiedad @Value("${keycloak.resource}") en la clase
            // o buscar dinámicamente como se muestra a continuación:
            clientId = realmResource.clients().findByClientId("setcollector-app").get(0).getId();

            // 2. Obtener los roles del cliente
            List<RoleRepresentation> rolesToAssign = new ArrayList<>();

            for (String roleName : roleNames) {
                // Intenta buscar primero como rol de reino (realm role)
                try {
                    RoleRepresentation role = realmResource.roles().get(roleName).toRepresentation();
                    if (role != null) {
                        rolesToAssign.add(role);
                        log.debug("Found realm role: {}", roleName);
                        continue;
                    }
                } catch (Exception e) {
                    log.debug("Role {} not found as realm role, trying client role", roleName);
                }

                // Si no es rol de reino, busca como rol de cliente
                try {
                    RoleRepresentation role = realmResource.clients().get(clientId)
                            .roles().get(roleName).toRepresentation();
                    if (role != null) {
                        rolesToAssign.add(role);
                        log.debug("Found client role: {}", roleName);
                    }
                } catch (Exception e) {
                    log.warn("Role {} not found as client role either", roleName);
                }
            }

            // 3. Asignar los roles al usuario
            if (!rolesToAssign.isEmpty()) {
                realmResource.users().get(userId).roles().realmLevel().add(rolesToAssign);
                log.info("Assigned roles {} to user {}", roleNames, userId);
            } else {
                log.warn("No roles found to assign to user {}", userId);
            }
        } catch (Exception e) {
            log.error("Error assigning roles to user {}: {}", userId, e.getMessage(), e);
            // No lanzamos excepción para no interrumpir el flujo principal
        }
    }

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
}