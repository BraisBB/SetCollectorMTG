package com.setcollectormtg.setcollectormtg.util;

import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Utility to get the current user in any part of the application.
 * Gets the user from Spring Security's security context.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CurrentUserUtil {

    private final UserRepository userRepository;

    /**
     * Gets the current user from security context.
     * 
     * @return The current user or null if no user is authenticated
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() ||
                authentication.getName() == null || "anonymousUser".equals(authentication.getName())) {
            log.debug("No authenticated user found in security context");
            return null;
        }

        try {
            log.debug("Getting current user for username: {}", authentication.getName());
            return userRepository.findByUsername(authentication.getName()).orElse(null);
        } catch (Exception e) {
            log.error("Error getting current user: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Gets the current user's ID.
     * 
     * @return The current user's ID or null if no user is authenticated
     */
    public Long getCurrentUserId() {
        User currentUser = getCurrentUser();
        return currentUser != null ? currentUser.getUserId() : null;
    }

    /**
     * Gets the current username from security context.
     * 
     * @return The current username or null if no user is authenticated
     */
    public String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() ||
                "anonymousUser".equals(authentication.getName())) {
            return null;
        }

        return authentication.getName();
    }

    /**
     * Checks if there's a currently authenticated user.
     * 
     * @return true if user is authenticated, false otherwise
     */
    public boolean isUserAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated() &&
                authentication.getName() != null && !"anonymousUser".equals(authentication.getName());
    }
}