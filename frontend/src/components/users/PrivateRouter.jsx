
import { Navigate } from "react-router-dom";


const PrivateRouter = ({ children}) => {
    const token = sessionStorage.getItem('authtoken');
    
    if (!token) {
        return <Navigate to="/" />;
    }

    // const decodedToken = JSON.parse(atob(token.split('.')[1]));
    // console.log("Decoded Token:", decodedToken); 

    return children;
};

export default PrivateRouter;
