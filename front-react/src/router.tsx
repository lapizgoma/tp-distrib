import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/shared/components/Layout";
import { EventsListView } from "@/features/events/views/EventsListView";
import { EventDetailView } from "@/features/events/views/EventDetailView";
import { EventFormView } from "@/features/events/views/EventFormView";
import { SavedFiltersView } from "@/features/events/views/SavedFiltersView";
import { LoginView } from "@/features/auth/views/LoginView";
import { WorksListView } from "@/features/works/views/WorksListView";
import { WorkDetailView } from "@/features/works/views/WorkDetailView";

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
                    <Route path="eventos/nuevo" element={<EventFormView />} />
                    <Route path="eventos/mis-filtros" element={<SavedFiltersView />} />
                    <Route path="eventos/:id" element={<EventDetailView />} />
                    <Route path="eventos/:id/editar" element={<EventFormView />} />

                    {/* Feature: Obras y Comentarios */}
                    <Route path="catalogo" element={<WorksListView />} />
                    <Route path="obras" element={<WorksListView />} />
                    <Route path="obras/:id" element={<WorkDetailView />} />
                </Route>
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    )
}
