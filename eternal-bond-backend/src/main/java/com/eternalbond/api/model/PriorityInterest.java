package com.eternalbond.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "priority_interests",
        schema = "public",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_priority_interest_entitlement", columnNames = "entitlement_id"),
                @UniqueConstraint(name = "uq_priority_interest_sender_target", columnNames = {"sender_id", "target_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriorityInterest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "entitlement_id", nullable = false, columnDefinition = "uuid")
    private UUID entitlementId;

    @Column(name = "sender_id", nullable = false, length = 64)
    private String senderId;

    @Column(name = "target_id", nullable = false, length = 64)
    private String targetId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @jakarta.persistence.PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
