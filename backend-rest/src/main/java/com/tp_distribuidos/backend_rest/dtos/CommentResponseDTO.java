package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.models.entities.Comment;

import java.time.LocalDateTime;

public record CommentResponseDTO(
        Long id,
        Long workId,
        Long userId,
        String authorName,
        String text,
        LocalDateTime date
) {

    public static CommentResponseDTO fromEntity(Comment comment) {
        String author = null;
        if (comment.getUser() != null) {
            String first = comment.getUser().getFirstName() != null ? comment.getUser().getFirstName() : "";
            String last = comment.getUser().getLastName() != null ? comment.getUser().getLastName() : "";
            author = (first + " " + last).trim();
            if (author.isEmpty()) {
                author = comment.getUser().getEmail();
            }
        }

        return new CommentResponseDTO(
                comment.getId(),
                comment.getWork() != null ? comment.getWork().getId() : null,
                comment.getUser() != null ? comment.getUser().getId() : null,
                author,
                comment.getText(),
                comment.getDate());
    }
}
