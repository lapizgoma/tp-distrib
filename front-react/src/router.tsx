import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/shared/components/Layout";
import { RequireRole } from "@/shared/components/RequireRole";
import { EventsListView } from "@/features/events/views/EventsListView";
import { EventDetailView } from "@/features/events/views/EventDetailView";
import { EventFormView } from "@/features/events/views/EventFormView";
import { SavedFiltersView } from "@/features/events/views/SavedFiltersView";
import { LoginView } from "@/features/auth/views/LoginView";

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<h1>Bienvenido al Museo Virtual Interactivo</h1>} />

                    {/* Feature: Autenticación */}
                    <Route path="login" element={<LoginView />} />

                    {/* Feature: Eventos e Inscripciones */}
                    <Route path="eventos" element={<EventsListView />} />
                    <Route path="eventos/:id" element={<EventDetailView />} />


                    {/* Cualquier usuario con sesión */}
                    <Route element={<RequireRole />}>
                        <Route path="eventos/mis-filtros" element={<SavedFiltersView />} />
                    </Route>

                    {/* Solo CURADOR y ADMINISTRADOR */}
                    <Route element={<RequireRole roles={['CURADOR', 'ADMINISTRADOR']} />}>
                        <Route path="eventos/nuevo" element={<EventFormView />} />
                        <Route path="eventos/:id/editar" element={<EventFormView />} />
                    </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    )
}