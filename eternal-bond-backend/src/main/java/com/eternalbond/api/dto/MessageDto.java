package com.eternalbond.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDto {

    private String id;

    @NotBlank(message = "Match ID is required")
    private String matchId;

    private String senderId;

    @NotBlank(message = "Content cannot be blank")
    private String content;

    private boolean isRead;

    private LocalDateTime createdAt;
}
