import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "../src/shared/components/Layout";
import { EventsView } from "../src/features/events/views/EventsView";

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<h1>Bienvenido al Museo Virtual Interactivo</h1>} />
                    <Route path="events" element={<EventsView />} />

                </Route>
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    )
}