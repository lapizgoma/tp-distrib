package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.CommentRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.CommentResponseDTO;
import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.enums.WorkAvailability;
import com.tp_distribuidos.backend_rest.exceptions.ApiException;
import com.tp_distribuidos.backend_rest.models.entities.Comment;
import com.tp_distribuidos.backend_rest.models.entities.User;
import com.tp_distribuidos.backend_rest.models.entities.Work;
import com.tp_distribuidos.backend_rest.repositories.CommentRepository;
import com.tp_distribuidos.backend_rest.repositories.UserRepository;
import com.tp_distribuidos.backend_rest.repositories.WorkRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    private static final Long WORK_ID = 20L;
    private static final Long OTHER_WORK_ID = 21L;
    private static final Long COMMENT_ID = 30L;
    private static final Long USER_ID = 5L;
    private static final Long OTHER_USER_ID = 99L;
    private static final String EMAIL = "ana@museo.com";
    private static final LocalDateTime DATE = LocalDateTime.of(2026, 5, 1, 10, 0);

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private WorkRepository workRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CommentService commentService;

    @Test
    void getCommentsByWorkIdReturnsEmptyListWhenWorkHasNoComments() {
        when(workRepository.existsById(WORK_ID)).thenReturn(true);
        when(commentRepository.findByWorkIdOrderByDateDesc(WORK_ID)).thenReturn(List.of());

        List<CommentResponseDTO> result = commentService.getCommentsByWorkId(WORK_ID);

        assertThat(result).isEmpty();
        verify(commentRepository).findByWorkIdOrderByDateDesc(WORK_ID);
    }

    @Test
    void getCommentsByWorkIdMapsEveryComment() {
        User author = buildUser(USER_ID, UserRole.VISITANTE, "Ana", "Gomez");
        Comment comment = buildComment(COMMENT_ID, author, buildWork(WORK_ID), "Buenisima");
        when(workRepository.existsById(WORK_ID)).thenReturn(true);
        when(commentRepository.findByWorkIdOrderByDateDesc(WORK_ID)).thenReturn(List.of(comment));

        List<CommentResponseDTO> result = commentService.getCommentsByWorkId(WORK_ID);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(COMMENT_ID);
        assertThat(result.get(0).workId()).isEqualTo(WORK_ID);
        assertThat(result.get(0).userId()).isEqualTo(USER_ID);
        assertThat(result.get(0).text()).isEqualTo("Buenisima");
        assertThat(result.get(0).date()).isEqualTo(DATE);
    }

    @Test
    void getCommentsByWorkIdThrowsNotFoundAndDoesNotQueryCommentsWhenWorkDoesNotExist() {
        when(workRepository.existsById(WORK_ID)).thenReturn(false);

        assertThatThrownBy(() -> commentService.getCommentsByWorkId(WORK_ID))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Obra no encontrada con id: " + WORK_ID);
                });
        verify(commentRepository, never()).findByWorkIdOrderByDateDesc(any());
    }

    @Test
    void createCommentSavesCommentAndReturnsDetailWhenWorkAndUserExist() {
        User author = buildUser(USER_ID, UserRole.VISITANTE, "Ana", "Gomez");
        when(workRepository.findById(WORK_ID)).thenReturn(Optional.of(buildWork(WORK_ID)));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(author));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", COMMENT_ID);
            return saved;
        });

        CommentResponseDTO result = commentService.createComment(WORK_ID, EMAIL, new CommentRequestDTO("Buenisima"));

        assertThat(result.id()).isEqualTo(COMMENT_ID);
        assertThat(result.workId()).isEqualTo(WORK_ID);
        assertThat(result.userId()).isEqualTo(USER_ID);
        assertThat(result.text()).isEqualTo("Buenisima");
        assertThat(result.authorName()).isEqualTo("Ana Gomez");
        verify(commentRepository).save(any(Comment.class));
    }

    @Test
    void createCommentThrowsNotFoundAndDoesNotLookUpUserWhenWorkDoesNotExist() {
        when(workRepository.findById(WORK_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.createComment(WORK_ID, EMAIL, new CommentRequestDTO("Buenisima")))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Obra no encontrada con id: " + WORK_ID);
                });
        verifyNoInteractions(userRepository);
        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    void createCommentThrowsForbiddenAndDoesNotSaveWhenUserDoesNotExist() {
        when(workRepository.findById(WORK_ID)).thenReturn(Optional.of(buildWork(WORK_ID)));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.createComment(WORK_ID, EMAIL, new CommentRequestDTO("Buenisima")))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(ex.getMessage()).isEqualTo("Usuario no autenticado");
                });
        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    void deleteCommentThrowsNotFoundAndDoesNotLookUpUserWhenCommentDoesNotExist() {
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.deleteComment(WORK_ID, COMMENT_ID, EMAIL))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Comentario no encontrado");
                });
        verifyNoInteractions(userRepository);
        verify(commentRepository, never()).delete(any(Comment.class));
    }

    @Test
    void deleteCommentThrowsBadRequestAndDoesNotLookUpUserWhenCommentBelongsToAnotherWork() {
        User author = buildUser(USER_ID, UserRole.VISITANTE, "Ana", "Gomez");
        Comment comment = buildComment(COMMENT_ID, author, buildWork(OTHER_WORK_ID), "Buenisima");
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));

        assertThatThrownBy(() -> commentService.deleteComment(WORK_ID, COMMENT_ID, EMAIL))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessage()).isEqualTo("El comentario no pertenece a la obra indicada");
                });
        verifyNoInteractions(userRepository);
        verify(commentRepository, never()).delete(any(Comment.class));
    }

    @Test
    void deleteCommentThrowsForbiddenWhenUserDoesNotExist() {
        User author = buildUser(USER_ID, UserRole.VISITANTE, "Ana", "Gomez");
        Comment comment = buildComment(COMMENT_ID, author, buildWork(WORK_ID), "Buenisima");
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.deleteComment(WORK_ID, COMMENT_ID, EMAIL))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(ex.getMessage()).isEqualTo("Usuario no autenticado");
                });
        verify(commentRepository, never()).delete(any(Comment.class));
    }

    @Test
    void deleteCommentDeletesWhenRequesterIsAuthor() {
        User author = buildUser(USER_ID, UserRole.VISITANTE, "Ana", "Gomez");
        Comment comment = buildComment(COMMENT_ID, author, buildWork(WORK_ID), "Buenisima");
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(author));

        commentService.deleteComment(WORK_ID, COMMENT_ID, EMAIL);

        verify(commentRepository).delete(comment);
    }

    @Test
    void deleteCommentDeletesWhenRequesterIsAdminAndNotAuthor() {
        User author = buildUser(OTHER_USER_ID, UserRole.VISITANTE, "Ana", "Gomez");
        User admin = buildUser(USER_ID, UserRole.ADMINISTRADOR, "Admin", "Root");
        Comment comment = buildComment(COMMENT_ID, author, buildWork(WORK_ID), "Buenisima");
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(admin));

        commentService.deleteComment(WORK_ID, COMMENT_ID, EMAIL);

        verify(commentRepository).delete(comment);
    }

    @Test
    void deleteCommentThrowsForbiddenAndDoesNotDeleteWhenRequesterIsNeitherAuthorNorAdmin() {
        User author = buildUser(OTHER_USER_ID, UserRole.VISITANTE, "Ana", "Gomez");
        User other = buildUser(USER_ID, UserRole.VISITANTE, "Pepe", "Lopez");
        Comment comment = buildComment(COMMENT_ID, author, buildWork(WORK_ID), "Buenisima");
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> commentService.deleteComment(WORK_ID, COMMENT_ID, EMAIL))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(ex.getMessage()).isEqualTo("No tienes permiso para eliminar este comentario");
                });
        verify(commentRepository, never()).delete(any(Comment.class));
    }

    @Test
    void updateCommentThrowsNotFoundWhenCommentDoesNotExist() {
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.updateComment(WORK_ID, COMMENT_ID, EMAIL, new CommentRequestDTO("Editado")))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Comentario no encontrado");
                });
        verifyNoInteractions(userRepository);
        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    void updateCommentThrowsBadRequestWhenCommentBelongsToAnotherWork() {
        User author = buildUser(USER_ID, UserRole.VISITANTE, "Ana", "Gomez");
        Comment comment = buildComment(COMMENT_ID, author, buildWork(OTHER_WORK_ID), "Buenisima");
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));

        assertThatThrownBy(() -> commentService.updateComment(WORK_ID, COMMENT_ID, EMAIL, new CommentRequestDTO("Editado")))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessage()).isEqualTo("El comentario no pertenece a la obra indicada");
                });
        verifyNoInteractions(userRepository);
        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    void updateCommentThrowsForbiddenWhenUserDoesNotExist() {
        User author = buildUser(USER_ID, UserRole.VISITANTE, "Ana", "Gomez");
        Comment comment = buildComment(COMMENT_ID, author, buildWork(WORK_ID), "Buenisima");
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.updateComment(WORK_ID, COMMENT_ID, EMAIL, new CommentRequestDTO("Editado")))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(ex.getMessage()).isEqualTo("Usuario no autenticado");
                });
        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    void updateCommentThrowsForbiddenAndDoesNotSaveWhenRequesterIsNeitherAuthorNorAdmin() {
        User author = buildUser(OTHER_USER_ID, UserRole.VISITANTE, "Ana", "Gomez");
        User other = buildUser(USER_ID, UserRole.VISITANTE, "Pepe", "Lopez");
        Comment comment = buildComment(COMMENT_ID, author, buildWork(WORK_ID), "Buenisima");
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> commentService.updateComment(WORK_ID, COMMENT_ID, EMAIL, new CommentRequestDTO("Editado")))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(ex.getMessage()).isEqualTo("No tienes permiso para modificar este comentario");
                });
        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    void updateCommentUpdatesTextAndSavesWhenRequesterIsAuthor() {
        User author = buildUser(USER_ID, UserRole.VISITANTE, "Ana", "Gomez");
        Comment comment = buildComment(COMMENT_ID, author, buildWork(WORK_ID), "Buenisima");
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(author));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CommentResponseDTO result = commentService.updateComment(WORK_ID, COMMENT_ID, EMAIL, new CommentRequestDTO("Editado"));

        assertThat(result.text()).isEqualTo("Editado");
        assertThat(comment.getText()).isEqualTo("Editado");
        verify(commentRepository).save(comment);
    }

    @Test
    void updateCommentUpdatesTextAndSavesWhenRequesterIsAdminAndNotAuthor() {
        User author = buildUser(OTHER_USER_ID, UserRole.VISITANTE, "Ana", "Gomez");
        User admin = buildUser(USER_ID, UserRole.ADMINISTRADOR, "Admin", "Root");
        Comment comment = buildComment(COMMENT_ID, author, buildWork(WORK_ID), "Buenisima");
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(admin));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CommentResponseDTO result = commentService.updateComment(WORK_ID, COMMENT_ID, EMAIL, new CommentRequestDTO("Editado"));

        assertThat(result.text()).isEqualTo("Editado");
        verify(commentRepository).save(comment);
    }

    private User buildUser(Long id, UserRole role, String firstName, String lastName) {
        User user = User.of(EMAIL, "secret", role, firstName, lastName);
        if (id != null) {
            ReflectionTestUtils.setField(user, "id", id);
        }
        return user;
    }

    private Work buildWork(Long id) {
        Work work = Work.of(
                "La noche estrellada",
                null,
                "https://museo.org/obras/noche-estrellada.jpg",
                1889,
                null,
                null,
                null,
                null,
                null,
                WorkAvailability.EN_EXHIBICION);
        if (id != null) {
            ReflectionTestUtils.setField(work, "id", id);
        }
        return work;
    }

    private Comment buildComment(Long id, User user, Work work, String text) {
        Comment comment = Comment.of(user, work, text, DATE);
        if (id != null) {
            ReflectionTestUtils.setField(comment, "id", id);
        }
        return comment;
    }
}
