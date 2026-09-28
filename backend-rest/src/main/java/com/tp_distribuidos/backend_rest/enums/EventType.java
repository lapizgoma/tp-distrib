package com.tp_distribuidos.backend_rest.enums;

public enum EventType {
    VISITA_GUIADA("VISITAS GUIADAS"),
    TALLER("TALLERES"),
    CHARLA("CHARLAS"),
    EXPOSICION("EXPOSICIONES");

    private final String displayName;

    EventType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
