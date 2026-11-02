package com.tp_distribuidos.backend_rest.enums;

/**
 * Estado de un mensaje pendiente en la tabla outbox.
 */
public enum OutboxStatus {
    PENDING,
    SENT
}
