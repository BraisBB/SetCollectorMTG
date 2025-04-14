package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;



@Component("userSecurity")
@RequiredArgsConstructor
@Slf4j
public class UserSecurity {

    private final UserRepository userRepository;

    public boolean isOwner(Authentication authentication, Long userId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String currentUsername = authentication.getName();
        log.debug("Checking ownership for user {} and resource {}", currentUsername, userId);

        return userRepository.findById(userId)
                .map(user -> {
                    boolean owner = user.getUsername().equals(currentUsername);
                    log.debug("User {} is owner: {}", currentUsername, owner);
                    return owner;
                })
                .orElseGet(() -> {
                    log.warn("User with ID {} not found", userId);
                    return false;
                });
    }

    public boolean canAccessUserResource(Authentication authentication, Long userId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> "ADMIN".equals(auth.getAuthority()));

        log.debug("User {} isAdmin: {}", authentication.getName(), isAdmin);

        return isAdmin || isOwner(authentication, userId);
    }
}