package com.eternalbond.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "family_members", schema = "public", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "guardian_email"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FamilyMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Profile user;

    @Column(name = "guardian_email", nullable = false)
    private String guardianEmail;

    @Column(name = "guardian_phone")
    private String guardianPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GuardianRole relationship;

    @Column(name = "is_approved", nullable = false)
    private boolean isApproved = false;

    @Column(name = "can_veto_matches", nullable = false)
    private boolean canVetoMatches = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum GuardianRole { father, mother, sibling, uncle, aunt, other }
}
