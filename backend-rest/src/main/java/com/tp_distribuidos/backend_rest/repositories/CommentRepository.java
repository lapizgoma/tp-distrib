package com.tp_distribuidos.backend_rest.repositories;

import com.tp_distribuidos.backend_rest.models.entities.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByWorkId(Long workId);

    List<Comment> findByUserId(Long userId);

    @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.work.id = :workId ORDER BY c.date DESC")
    List<Comment> findByWorkIdOrderByDateDesc(@Param("workId") Long workId);
}