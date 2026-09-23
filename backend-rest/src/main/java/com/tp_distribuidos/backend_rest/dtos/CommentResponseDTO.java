package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.models.entities.Comment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponseDTO {

    private Long id;
    private Long workId;
    private Long userId;
    private String authorName;
    private String text;
    private LocalDateTime date;

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

        return CommentResponseDTO.builder()
                .id(comment.getId())
                .workId(comment.getWork() != null ? comment.getWork().getId() : null)
                .userId(comment.getUser() != null ? comment.getUser().getId() : null)
                .authorName(author)
                .text(comment.getText())
                .date(comment.getDate())
                .build();
    }
}