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
        return userRepository.findByKeycloakId(authentication.getName())
                .map(user -> user.getUserId().equals(userId))
                .orElse(false);
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