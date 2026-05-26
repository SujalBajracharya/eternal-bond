package com.eternalbond.api.repository;

import com.eternalbond.api.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {

    List<Message> findAllByMatchIdOrderByCreatedAtAsc(String matchId);
}
