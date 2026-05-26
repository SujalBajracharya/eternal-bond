package com.eternalbond.api.repository;

import com.eternalbond.api.model.FamilyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FamilyMemberRepository extends JpaRepository<FamilyMember, String> {

    List<FamilyMember> findAllByUserId(String userId);

    List<FamilyMember> findAllByGuardianEmail(String email);

    Optional<FamilyMember> findByUserIdAndGuardianEmail(String userId, String guardianEmail);
}
