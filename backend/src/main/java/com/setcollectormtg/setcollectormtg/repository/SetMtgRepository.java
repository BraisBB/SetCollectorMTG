package com.setcollectormtg.setcollectormtg.repository;

import com.setcollectormtg.setcollectormtg.model.SetMtg;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SetMtgRepository extends JpaRepository<SetMtg, Long> {
    Optional<SetMtg> findBySetCode(String setCode);
    boolean existsBySetCode(String setCode);
}
