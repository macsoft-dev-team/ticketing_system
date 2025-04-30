import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import logo from "../../assets/macsoft-logo.png";

const Header = ({ handleMessageFilter, newMessage }) => {
  const navigate = useNavigate();
  let { ticketStatus } = useParams();
  const token = sessionStorage.getItem("authtoken");
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (token) {
      const jwttoken = token.split(".")[1];
      const decoded = JSON.parse(atob(jwttoken));
      if (decoded && decoded.role) {
        setUserRole(decoded.role);
      }
    }
  }, [token]);

  
  // useEffect(() => {
  //   if (newMessage.length > 0) {
  //     console.log("New message detected, playing sound");

  //     const audio = new Audio('/notification-22-270130.mp3'); 
  //     audio.play().then(() => {
  //       console.log("Audio played successfully");
  //     }).catch((err) => {
  //       console.error("Error playing audio:", err);
  //     });
  //   }
  // }, [newMessage]);

  const handleLogout = () => {
    sessionStorage.removeItem("authtoken");
    navigate("/");
  };
  return (
    <>
      <nav className="navbar navbar-light bg-light ">
     
        <div className="container-fluid ">
          <div className="d-flex">
            <img
              src={logo}
              alt="Macsoft Logo"
              className="border-0"
              style={{
                width: "25px",
                height: "25px",
                marginRight: "7px",
                marginTop: "3px",
              }}
            />
            <Link
              to="/statusdashboard"
              className="navbar-brand  h1 text-decoration-none fw-bold "
            >
              Macsoft 
              {/* <h6 className="text-muted fw-bold" style={{fontSize:"10px"}}>Support_Hub</h6> */}
            </Link>
            
          </div>



     

          <div className="d-flex justify-content-around  shadow rounded border">
            {userRole === "admin" && (
              <Link to="/userdetails" className="btn btn-outline-none border-0">
                <div className="">
                  <i className="fa-solid fa-users "></i>
                </div>
              </Link>
            )}

            {!token ? (
              ""
            ) : (
              <>
                <div className="d-flex justify-content-around ">
                  {ticketStatus === "open" || ticketStatus === "close" ? (
                    <button className={`btn border-0 `}  onClick={handleMessageFilter} >
                      <div className="d-flex align-items-center justify-content-center ">
                        {newMessage.length > 0 ? (
                          <span className="mx-1 text-danger" style={{ marginTop: "-3px" }} > {newMessage.length} </span>
                        ) : (" " )}
                        {newMessage.length > 0 ? (
                          <i className="fa-regular fa-message text-danger"></i>
                        ) : (
                          <i className="fa-regular fa-message"></i>
                        )}
                      </div>
                    </button>
                  ) : (
                    ""
                  )}

                  <button className="btn border-0 " onClick={handleLogout}>
                    <i className="fa-solid fa-right-from-bracket"></i>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
