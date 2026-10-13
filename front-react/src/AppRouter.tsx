import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/shared/components/Layout";
import { EventsListView } from "@/features/events/views/EventsListView";
import { EventDetailView } from "@/features/events/views/EventDetailView";
import { EventFormView } from "@/features/events/views/EventFormView";
import { SavedFiltersView } from "@/features/events/views/SavedFiltersView";

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<h1>Bienvenido al Museo Virtual Interactivo</h1>} />

                    {/* Feature: Eventos e Inscripciones */}
                    <Route path="eventos" element={<EventsListView />} />
                    <Route path="eventos/nuevo" element={<EventFormView />} />
                    <Route path="eventos/mis-filtros" element={<SavedFiltersView />} />
                    <Route path="eventos/:id" element={<EventDetailView />} />
                    <Route path="eventos/:id/editar" element={<EventFormView />} />
                </Route>
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    )
}
