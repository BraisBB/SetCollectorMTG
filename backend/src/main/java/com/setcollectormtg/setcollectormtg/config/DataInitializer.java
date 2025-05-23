package com.setcollectormtg.setcollectormtg.config;

import com.setcollectormtg.setcollectormtg.enums.Role;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Componente que inicializa datos por defecto en la aplicación.
 * Se ejecuta automáticamente al arrancar la aplicación.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        createDefaultAdminUser();
    }

    /**
     * Crea un usuario administrador por defecto si no existe.
     * Los administradores no necesitan colección ya que su rol es administrativo.
     */
    private void createDefaultAdminUser() {
        final String ADMIN_USERNAME = "admin";
        final String ADMIN_PASSWORD = "Admin123";
        final String ADMIN_EMAIL = "admin@setcollector.com";
        final String ADMIN_FIRST_NAME = "Administrador";
        final String ADMIN_LAST_NAME = "SetCollector";

        // Verificar si ya existe el usuario admin
        if (userRepository.findByUsername(ADMIN_USERNAME).isPresent()) {
            log.info("Usuario administrador '{}' ya existe en la base de datos", ADMIN_USERNAME);
            return;
        }

        log.info("Creando usuario administrador por defecto...");

        // Crear el usuario administrador
        User adminUser = new User();
        adminUser.setUsername(ADMIN_USERNAME);
        adminUser.setEmail(ADMIN_EMAIL);
        adminUser.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
        adminUser.setFirstName(ADMIN_FIRST_NAME);
        adminUser.setLastName(ADMIN_LAST_NAME);
        adminUser.setEnabled(true);
        adminUser.setRoles(Set.of(Role.ADMIN, Role.USER)); // ADMIN incluye permisos de USER

        try {
            User savedUser = userRepository.save(adminUser);
            log.info("Usuario administrador creado exitosamente:");
            log.info("Username: {}", savedUser.getUsername());
            log.info("Email: {}", savedUser.getEmail());
            log.info("Password: {} (encriptada)", ADMIN_PASSWORD);
            log.info("Roles: {}", savedUser.getRoles());
            log.info("ID: {}", savedUser.getUserId());
            log.info("Los administradores acceden como usuarios públicos (sin colección)");
        } catch (Exception e) {
            log.error("Error al crear usuario administrador: {}", e.getMessage(), e);
        }
    }
}