package com.eternalbond.api.service;

import com.eternalbond.api.dto.MessageDto;
import com.eternalbond.api.exception.ResourceNotFoundException;
import com.eternalbond.api.model.Match;
import com.eternalbond.api.model.Message;
import com.eternalbond.api.model.Profile;
import com.eternalbond.api.repository.MatchRepository;
import com.eternalbond.api.repository.MessageRepository;
import com.eternalbond.api.repository.ProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final MessageRepository messageRepository;
    private final MatchRepository matchRepository;
    private final ProfileRepository profileRepository;
    private final EntitlementService entitlementService;

    public ChatService(MessageRepository messageRepository, MatchRepository matchRepository, ProfileRepository profileRepository, EntitlementService entitlementService) {
        this.messageRepository = messageRepository;
        this.matchRepository = matchRepository;
        this.profileRepository = profileRepository;
        this.entitlementService = entitlementService;
    }

    @Transactional(readOnly = true)
    public List<MessageDto> getMessageHistory(String matchId, String requesterId) {
        // Validate requester is part of the match
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found"));

        if (!match.getUserOne().getId().equals(requesterId) && !match.getUserTwo().getId().equals(requesterId)) {
            throw new IllegalArgumentException("Unauthorized to view this conversation's history");
        }

        List<Message> messages = messageRepository.findAllByMatchIdOrderByCreatedAtAsc(matchId);
        boolean hasReadReceipts = entitlementService.hasActivePremium(requesterId);

        return messages.stream().map(msg -> {
            MessageDto dto = mapToDto(msg);
            if (!hasReadReceipts && msg.getSender().getId().equals(requesterId)) {
                dto.setRead(false);
            }
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public MessageDto saveMessage(String senderId, MessageDto dto) {
        Match match = matchRepository.findById(dto.getMatchId())
                .orElseThrow(() -> new ResourceNotFoundException("Match conversation context not found"));

        if (!match.getUserOne().getId().equals(senderId) && !match.getUserTwo().getId().equals(senderId)) {
            throw new IllegalArgumentException("Unauthorized sender for this conversation");
        }

        Profile sender = profileRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender profile not found"));

        Message message = Message.builder()
                .match(match)
                .sender(sender)
                .content(dto.getContent())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        Message saved = messageRepository.save(message);
        return mapToDto(saved);
    }

    private MessageDto mapToDto(Message msg) {
        return MessageDto.builder()
                .id(msg.getId())
                .matchId(msg.getMatch().getId())
                .senderId(msg.getSender().getId())
                .content(msg.getContent())
                .isRead(msg.isRead())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
