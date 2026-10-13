import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
<<<<<<< HEAD
import { Layout } from "@/shared/components/Layout";
import { EventsView } from "@/features/events/views/EventsView";
=======
import { Layout } from "../src/shared/components/Layout";
import { EventsView } from "../src/features/events/views/EventsView";
>>>>>>> 69e50b02f4e43671dee13fe29cee57f695ca7d4a

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<h1>Bienvenido al Museo Virtual Interactivo</h1>} />
                    <Route path="eventos" element={<EventsView />} />

                </Route>
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    )
}