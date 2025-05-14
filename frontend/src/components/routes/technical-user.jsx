import { Routes, Route } from "react-router-dom";
import Tickets from "../../pages/tickets/tickets";
import AppLayout from "../layout/layout";
import Ticket from "../../pages/tickets/ticket";
import SpareRequest from "../../pages/spare-request/spare-request";

export default function TechnicalUserRoutes() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route index element={<Tickets />} />
                <Route path="tickets" element={<Tickets />} />
                <Route path="tickets/:ticketId" element={<Ticket />} />
                <Route path="spare-request" element={<SpareRequest />} />
            </Route>
        </Routes>
    );
}
