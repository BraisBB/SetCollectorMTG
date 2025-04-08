package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.UserCreateDto;
import com.setcollectormtg.setcollectormtg.dto.UserDto;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.UserMapper;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.model.UserCollection;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public User synchronizeUser(Jwt jwt) {
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
    @Transactional
    public UserDto createUser(UserCreateDto userCreateDto) {
        // Este método es para crear un registro de usuario localmente,
        // por ejemplo, por un administrador. Este usuario NO podrá iniciar sesión
        // a menos que también exista un usuario correspondiente en Keycloak
        // Y el keycloakId se establezca manualmente después o mediante otro proceso.
        log.warn("Creating local user record manually (NOT for Keycloak login): {}", userCreateDto.getUsername());
        if (userRepository.existsByUsername(userCreateDto.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(userCreateDto.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = userMapper.toEntity(userCreateDto);

        // --- NO HAY MANEJO DE CONTRASEÑA ---
        // La autenticación es manejada por Keycloak.

        // Se necesita un keycloakId para la restricción NOT NULL unique=true.
        // Si este método es realmente necesario, debes decidir cómo generar/obtener este ID.
        // Podría ser un UUID temporal, o quizás este método no debería existir
        // si todos los usuarios DEBEN venir de Keycloak.
        // Vamos a lanzar una excepción por ahora para indicar que falta lógica.
        if (user.getKeycloakId() == null || user.getKeycloakId().isBlank()) {
            // user.setKeycloakId("manual_" + UUID.randomUUID().toString()); // Opción 1: UUID temporal
            // log.warn("Assigning temporary KeycloakID for manually created user: {}", user.getUsername());
            throw new IllegalStateException("Cannot manually create user without providing a Keycloak ID."); // Opción 2: Requerir ID
        }


        UserCollection defaultCollection = new UserCollection();
        defaultCollection.setUser(user);
        defaultCollection.setTotalCards(0);
        user.setUserCollection(defaultCollection);

        // Asegúrate de que todos los campos NOT NULL tengan valor antes de guardar
        if (user.getFirstName() == null) user.setFirstName("ManualFirst");
        if (user.getLastName() == null) user.setLastName("ManualLast");
        // joinDate debería ser manejado por @CreationTimestamp

        User savedUser = userRepository.save(user);
        return userMapper.toDto(savedUser);
    }

    @Override
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public UserDto getUserById(Long id) {
        return userRepository.findById(id)
                .map(userMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Override
    @Transactional
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Validaciones de unicidad (username/email) si cambian
        if (!user.getUsername().equals(userDto.getUsername())) {
            if (userRepository.existsByUsernameAndKeycloakIdNot(userDto.getUsername(), user.getKeycloakId())) {
                throw new RuntimeException("Username already exists for a different user.");
            }
        }
        if (!user.getEmail().equals(userDto.getEmail())) {
            if (userRepository.existsByEmailAndKeycloakIdNot(userDto.getEmail(), user.getKeycloakId())) {
                throw new RuntimeException("Email already exists for a different user.");
            }
        }

        // Actualiza campos desde DTO (sin contraseña)
        userMapper.updateUserFromDto(userDto, user);

        // Asegúrate de que los campos NOT NULL no queden nulos después del mapeo
        if (user.getFirstName() == null) user.setFirstName("UpdatedFirst"); // O manejar en el mapper/DTO
        if (user.getLastName() == null) user.setLastName("UpdatedLast");   // O manejar en el mapper/DTO


        return userMapper.toDto(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }
        log.warn("Deleting user record with id: {}", id);
        userRepository.deleteById(id); // Borra el registro local. No afecta a Keycloak.
    }

    // --- Métodos auxiliares para validación de unicidad ---
    // Necesitas añadirlos a tu UserRepository
     /*
     // En UserRepository.java:
     boolean existsByUsernameAndKeycloakIdNot(String username, String keycloakId);
     boolean existsByEmailAndKeycloakIdNot(String email, String keycloakId);
     */
}