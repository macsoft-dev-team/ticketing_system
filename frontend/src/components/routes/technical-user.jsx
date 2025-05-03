import { Routes, Route } from "react-router-dom";
import Tickets from "../../pages/tickets/tickets";
import AppLayout from "../layout/layout";
import RoleGuard from "../../lib/role-guard";

export default function TechnicalUserRoutes() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route index element={<Tickets />} />
                <Route path="tickets" element={<Tickets />} />
            </Route>
        </Routes>
    );
}
