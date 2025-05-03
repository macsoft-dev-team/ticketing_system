
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getCurrentUserRole } from "./lib/auth";
import axios from "axios";
import AdminRoutes from "./components/routes/admin";
import UserRoutes from "./components/routes/user";
import TechnicalUserRoutes from "./components/routes/technical-user";
import LoginPage from "./pages/login/login";
import "./App.css";
import RegisterUser from "./pages/register/register";

function App() {
  const userToken = sessionStorage.getItem('authToken')
  if (userToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`
  }
  
  return (
    <BrowserRouter>
      <Routes>
         <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/user/*" element={<UserRoutes />} />
        <Route path="/technical-user/*" element={<TechnicalUserRoutes />} />
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/register" element={<RegisterUser />} />
        <Route path="*" element={<div>404 - Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
