package com.eternalbond.api.controller;

import com.eternalbond.api.dto.MessageDto;
import com.eternalbond.api.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    // REST Endpoint to fetch historical chat logs
    @GetMapping("/api/chats/{matchId}/history")
    public ResponseEntity<List<MessageDto>> getChatHistory(
            @PathVariable String matchId,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(chatService.getMessageHistory(matchId, userId));
    }

    // WebSocket STOMP endpoint to send/broadcast messages real-time
    @MessageMapping("/chat/{matchId}")
    public void handleMessage(@DestinationVariable String matchId, MessageDto message, Principal principal) {
        // Authenticate WebSocket sender using Security Principal
        String senderId = (principal != null) ? principal.getName() : message.getSenderId();

        message.setMatchId(matchId);
        MessageDto savedMessage = chatService.saveMessage(senderId, message);

        // Propagate real-time packet to active match channel subscriber
        messagingTemplate.convertAndSend("/queue/messages/" + matchId, savedMessage);
    }
}
