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
                log.info("Local user record created successfully with default USER role for Keycloak ID: {}", keycloakUserId);
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
            
            // Guardar el usuario (esto también guardará la colección debido a CascadeType.ALL)
            return userRepository.save(userToSave);
        }
        
        return existingUserOpt.get();
    }

    @Override
    public List<UserDto> getAllUsers() {
        // Tu lógica existente...
        return userRepository.findAll().stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<UserDto> getAllUsersPaged(Pageable pageable) {
        return userRepository.findAll(pageable).map(userMapper::toDto);
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