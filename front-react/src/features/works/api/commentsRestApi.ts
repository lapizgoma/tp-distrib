// src/features/works/api/commentsRestApi.ts
import { apiRequest } from '@/shared/api/rest';
import type { Comment, CommentRequestDTO } from '../types/works.types';

/** POST /api/rest/works/{workId}/comments — Publicar un nuevo comentario */
export function addComment(workId: string | number, payload: CommentRequestDTO) {
  return apiRequest<Comment>(`/works/${workId}/comments`, {
    method: 'POST',
    body: payload,
  });
}

/** DELETE /api/rest/works/{workId}/comments/{commentId} — Eliminar un comentario */
export function deleteComment(workId: string | number, commentId: string | number) {
  return apiRequest<void>(`/works/${workId}/comments/${commentId}`, {
    method: 'DELETE',
  });
}