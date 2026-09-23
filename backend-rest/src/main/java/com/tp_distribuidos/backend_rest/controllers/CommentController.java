package com.tp_distribuidos.backend_rest.controllers;

import com.tp_distribuidos.backend_rest.dtos.CommentRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.CommentResponseDTO;
import com.tp_distribuidos.backend_rest.services.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rest/works/{id_work}/comments")
@RequiredArgsConstructor
@Tag(name = "Comentarios", description = "Endpoints para la gestión de comentarios de obras de arte")
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    @Operation(summary = "Obtener comentarios de una obra", description = "Lista los comentarios de la obra de forma cronológica descendente.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista recuperada exitosamente"),
            @ApiResponse(responseCode = "404", description = "Obra no encontrada")
    })
    public ResponseEntity<List<CommentResponseDTO>> getComments(@PathVariable("id_work") Long idWork) {
        return ResponseEntity.ok(commentService.getCommentsByWorkId(idWork));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth") // <--- Candado solo acá
    @Operation(summary = "Crear comentario", description = "Permite a un usuario autenticado agregar un comentario a una obra.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Comentario creado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Obra no encontrada")
    })
    public ResponseEntity<CommentResponseDTO> createComment(
            @PathVariable("id_work") Long idWork,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CommentRequestDTO request) {

        CommentResponseDTO created = commentService.createComment(idWork, userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth") // <--- Candado solo acá
    @Operation(summary = "Eliminar comentario", description = "Permite al autor o a un administrador eliminar un comentario.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Comentario eliminado exitosamente"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "No autorizado para eliminar este comentario"),
            @ApiResponse(responseCode = "404", description = "Comentario u obra no encontrados")
    })
    public ResponseEntity<Void> deleteComment(
            @PathVariable("id_work") Long idWork,
            @PathVariable("id") Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {

        commentService.deleteComment(idWork, commentId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Modificar comentario", description = "Permite al autor o a un administrador editar el texto de un comentario.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Comentario actualizado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "No autorizado para modificar este comentario"),
            @ApiResponse(responseCode = "404", description = "Comentario u obra no encontrados")
    })
    public ResponseEntity<CommentResponseDTO> updateComment(
            @PathVariable("id_work") Long idWork,
            @PathVariable("id") Long commentId,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CommentRequestDTO request) {

        CommentResponseDTO updated = commentService.updateComment(idWork, commentId, userDetails.getUsername(), request);
        return ResponseEntity.ok(updated);
    }
}