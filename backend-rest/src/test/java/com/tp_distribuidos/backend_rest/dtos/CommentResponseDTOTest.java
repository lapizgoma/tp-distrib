package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.enums.WorkAvailability;
import com.tp_distribuidos.backend_rest.models.entities.Comment;
import com.tp_distribuidos.backend_rest.models.entities.User;
import com.tp_distribuidos.backend_rest.models.entities.Work;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class CommentResponseDTOTest {

    private static final Long COMMENT_ID = 30L;
    private static final Long WORK_ID = 20L;
    private static final Long USER_ID = 5L;
    private static final String EMAIL = "ana@museo.com";
    private static final LocalDateTime DATE = LocalDateTime.of(2026, 5, 1, 10, 0);

    @Test
    void mapsCoreFieldsFromEntity() {
        User author = buildUser(USER_ID, "Ana", "Gomez");
        Comment comment = buildComment(author, buildWork(WORK_ID), "Buenisima");

        CommentResponseDTO dto = CommentResponseDTO.fromEntity(comment);

        assertThat(dto.id()).isEqualTo(COMMENT_ID);
        assertThat(dto.workId()).isEqualTo(WORK_ID);
        assertThat(dto.userId()).isEqualTo(USER_ID);
        assertThat(dto.text()).isEqualTo("Buenisima");
        assertThat(dto.date()).isEqualTo(DATE);
    }

    @Test
    void buildsAuthorNameFromFirstAndLastName() {
        Comment comment = buildComment(buildUser(USER_ID, "Ana", "Gomez"), buildWork(WORK_ID), "Buenisima");

        CommentResponseDTO dto = CommentResponseDTO.fromEntity(comment);

        assertThat(dto.authorName()).isEqualTo("Ana Gomez");
    }

    @Test
    void buildsAuthorNameFromFirstNameWhenLastNameIsNull() {
        Comment comment = buildComment(buildUser(USER_ID, "Ana", null), buildWork(WORK_ID), "Buenisima");

        CommentResponseDTO dto = CommentResponseDTO.fromEntity(comment);

        assertThat(dto.authorName()).isEqualTo("Ana");
    }

    @Test
    void fallsBackToEmailWhenFirstAndLastNameAreNull() {
        Comment comment = buildComment(buildUser(USER_ID, null, null), buildWork(WORK_ID), "Buenisima");

        CommentResponseDTO dto = CommentResponseDTO.fromEntity(comment);

        assertThat(dto.authorName()).isEqualTo(EMAIL);
    }

    @Test
    void fallsBackToEmailWhenFirstAndLastNameAreBlank() {
        Comment comment = buildComment(buildUser(USER_ID, "", ""), buildWork(WORK_ID), "Buenisima");

        CommentResponseDTO dto = CommentResponseDTO.fromEntity(comment);

        assertThat(dto.authorName()).isEqualTo(EMAIL);
    }

    @Test
    void returnsNullWorkIdWhenWorkIsNull() {
        Comment comment = buildComment(buildUser(USER_ID, "Ana", "Gomez"), null, "Buenisima");

        CommentResponseDTO dto = CommentResponseDTO.fromEntity(comment);

        assertThat(dto.workId()).isNull();
    }

    @Test
    void returnsNullUserIdAndAuthorNameWhenUserIsNull() {
        Comment comment = buildComment(null, buildWork(WORK_ID), "Buenisima");

        CommentResponseDTO dto = CommentResponseDTO.fromEntity(comment);

        assertThat(dto.userId()).isNull();
        assertThat(dto.authorName()).isNull();
    }

    private User buildUser(Long id, String firstName, String lastName) {
        User user = User.of(EMAIL, "secret", UserRole.VISITANTE, firstName, lastName);
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

    private Comment buildComment(User user, Work work, String text) {
        Comment comment = Comment.of(user, work, text, DATE);
        ReflectionTestUtils.setField(comment, "id", COMMENT_ID);
        return comment;
    }
}
