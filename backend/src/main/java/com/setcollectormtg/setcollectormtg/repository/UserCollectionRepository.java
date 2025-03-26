package com.setcollectormtg.setcollectormtg.repository;

import com.setcollectormtg.setcollectormtg.model.UserCollection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserCollectionRepository extends JpaRepository<UserCollection, Long> {
    Optional<UserCollection> findByUser_UserId(Long userId);
    boolean existsByUser_UserId(Long userId);
}