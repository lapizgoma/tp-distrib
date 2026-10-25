import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/shared/components/Layout";
import { RequireRole } from "@/shared/components/RequireRole";
import { EventsListView } from "@/features/events/views/EventsListView";
import { EventDetailView } from "@/features/events/views/EventDetailView";
import { EventFormView } from "@/features/events/views/EventFormView";
import { SavedFiltersView } from "@/features/events/views/SavedFiltersView";
import { LoginView } from "@/features/auth/views/LoginView";
import { RegisterView } from "@/features/auth/views/RegisterView";
import { WorksListView } from "@/features/works/views/WorksListView";
import { WorkDetailView } from "@/features/works/views/WorkDetailView";
import { TourPlannerView } from "@/features/tour/views/TourPlannerView";
import { ReportView } from "./features/reports/views/ReportView";
import { CompareWorksView } from "./features/works/components/CompareWorksView";

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<h1>Bienvenido al Museo Virtual Interactivo</h1>} />

                    {/* Feature: Autenticación */}
                    <Route path="login" element={<LoginView />} />
                    <Route path="register" element={<RegisterView />} />

                    {/* Feature: Eventos e Inscripciones */}
                    <Route path="eventos" element={<EventsListView />} />
                    <Route path="eventos/:id" element={<EventDetailView />} />


                    {/* Feature: Obras y Comentarios */}
                    <Route path="catalogo" element={<Navigate to="/obras" replace />} />
                    <Route path="obras" element={<WorksListView />} />
                    <Route path="obras/:id" element={<WorkDetailView />} />

                    {/* Solo VISITANTE */}
                    <Route element={<RequireRole roles={['VISITANTE']} />}>
                        <Route path="recorrido" element={<TourPlannerView />} />
                    </Route>

                    {/* Cualquier usuario con sesión */}
                    <Route element={<RequireRole />}>
                        <Route path="eventos/mis-filtros" element={<SavedFiltersView />} />
                        <Route path="comparar" element={<CompareWorksView />} />
                    </Route>

                    {/* Solo CURADOR y ADMINISTRADOR */}
                    <Route element={<RequireRole roles={['CURADOR', 'ADMINISTRADOR']} />}>
                        <Route path="eventos/nuevo" element={<EventFormView />} />
                        <Route path="eventos/:id/editar" element={<EventFormView />} />
                        <Route path="eventos/reporte" element={<ReportView />} />
                    </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    )
}