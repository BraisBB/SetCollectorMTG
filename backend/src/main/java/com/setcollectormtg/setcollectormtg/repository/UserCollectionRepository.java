package com.setcollectormtg.setcollectormtg.repository;

import com.setcollectormtg.setcollectormtg.model.UserCollection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserCollectionRepository extends JpaRepository<UserCollection, Long> {
}
