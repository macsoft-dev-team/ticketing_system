import { Navigate, Route, Routes } from "react-router-dom";
 import AppLayout from "../layout/layout";
import Tickets from "../../pages/tickets/tickets";
import Users from "../../pages/users/users";
import Ticket from "../../pages/tickets/ticket";

export default function AdminRoutes() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route index element={<Navigate to="tickets" replace />} />
                <Route path="tickets" element={<Tickets />} />
                <Route path="tickets/:ticketId" element={<Ticket />} />
                <Route path="users" element={<Users />} />
             </Route>
        </Routes>
    );
}
