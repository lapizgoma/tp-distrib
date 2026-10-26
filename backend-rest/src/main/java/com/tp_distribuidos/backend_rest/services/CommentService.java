package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.CommentRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.CommentResponseDTO;
import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.exceptions.ApiException;
import com.tp_distribuidos.backend_rest.models.entities.Comment;
import com.tp_distribuidos.backend_rest.models.entities.User;
import com.tp_distribuidos.backend_rest.models.entities.Work;
import com.tp_distribuidos.backend_rest.repositories.CommentRepository;
import com.tp_distribuidos.backend_rest.repositories.UserRepository;
import com.tp_distribuidos.backend_rest.repositories.WorkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final WorkRepository workRepository;
    private final UserRepository userRepository;
    private final UserWorkInteractionService userWorkInteractionService;

    @Transactional(readOnly = true)
    public List<CommentResponseDTO> getCommentsByWorkId(Long workId) {
        if (!workRepository.existsById(workId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Obra no encontrada con id: " + workId);
        }
        return commentRepository.findByWorkIdOrderByDateDesc(workId)
                .stream()
                .map(CommentResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public CommentResponseDTO createComment(Long workId, String userEmail, CommentRequestDTO request) {
        Work work = workRepository.findById(workId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Obra no encontrada con id: " + workId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Usuario no autenticado"));

        Comment comment = Comment.of(user, work, request.getText());
        Comment savedComment = commentRepository.save(comment);

        userWorkInteractionService.recordComment(user, work);

        return CommentResponseDTO.fromEntity(savedComment);
    }

    @Transactional
    public void deleteComment(Long workId, Long commentId, String userEmail) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Comentario no encontrado"));

        if (!comment.getWork().getId().equals(workId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El comentario no pertenece a la obra indicada");
        }

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Usuario no autenticado"));

        boolean isAuthor = comment.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMINISTRADOR;

        if (!isAuthor && !isAdmin) {
            throw new ApiException(HttpStatus.FORBIDDEN, "No tienes permiso para eliminar este comentario");
        }

        commentRepository.delete(comment);
    }

    @Transactional
    public CommentResponseDTO updateComment(Long workId, Long commentId, String userEmail, CommentRequestDTO request) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Comentario no encontrado"));

        if (!comment.getWork().getId().equals(workId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El comentario no pertenece a la obra indicada");
        }

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Usuario no autenticado"));

        boolean isAuthor = comment.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMINISTRADOR;

        if (!isAuthor && !isAdmin) {
            throw new ApiException(HttpStatus.FORBIDDEN, "No tienes permiso para modificar este comentario");
        }

        comment.updateText(request.getText());
        Comment updatedComment = commentRepository.save(comment);

        return CommentResponseDTO.fromEntity(updatedComment);
    }
}