package com.eternalbond.api.astrology.profile;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "profile_kundali", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileKundaliEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "profile_id", nullable = false, unique = true)
    private String profileId;

    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    @Column(name = "birth_time", nullable = false)
    private LocalTime birthTime;

    @Column(name = "birth_place", nullable = false)
    private String birthPlace;

    @Column(name = "birth_latitude", nullable = false)
    private Double birthLatitude;

    @Column(name = "birth_longitude", nullable = false)
    private Double birthLongitude;

    @Column(name = "birth_timezone", nullable = false)
    private Double birthTimezone;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false)
    private OffsetDateTime updatedAt;
}
