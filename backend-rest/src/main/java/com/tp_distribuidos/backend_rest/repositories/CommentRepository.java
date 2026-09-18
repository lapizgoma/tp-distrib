package com.tp_distribuidos.backend_rest.repositories;

import com.tp_distribuidos.backend_rest.models.entities.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByWorkId(Long workId);

    List<Comment> findByUserId(Long userId);

    List<Comment> findByWorkIdOrderByDateDesc(Long workId);
}