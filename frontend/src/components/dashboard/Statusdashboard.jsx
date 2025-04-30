import React, { useEffect, useState } from "react";
import Header from "./Header";
import { Link } from "react-router-dom";
import axios from "axios";

const Statusdashboard = () => {
  const [openCount, setOpenCount] = useState("0");
  const [closeCount, SetCloseCount] = useState("0");
const API_URL = import.meta.env.VITE_APP_URL


  const fetchStatusCount = async () => {
    const token = sessionStorage.getItem("authtoken");
    try {
      const response = await axios.get(
   //  "http://localhost:8080/api/getticket/user",
       `${API_URL}/api/getticket/user`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(response.data);

      const openstatusCount = response.data.filter(
        (ticket) => ticket.status === "open"
      ).length;
      setOpenCount(openstatusCount);
      const closeStatusCount = response.data.filter(
        (ticket) => ticket.status === "close"
      ).length;
      SetCloseCount(closeStatusCount);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchStatusCount();
  }, []);

  return (
    <>
      <Header  />
      <div className="container mt-4">
        <h3 className="fw-bold">Ticket-Status</h3>
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 gap-4 mt-4">
          <div className="col">
            <Link to="/tickets/open" style={{ textDecoration: "none" }}>
              <div className="card border rounded bg-light ">
                <div className="card-body d-flex flex-column align-items-center">
                  <i className="fa-solid fa-ticket fa-2x text-danger mb-3"></i>
                  <h5 className="card-title fw-bold text-center">
                    {" "}
                    <span className="text-danger">{openCount}</span> Open Ticket{" "}
                  </h5>
                  <p className="text-center text-muted small">
                    Manage and view open tickets
                  </p>
                </div>
              </div>
            </Link>
          </div>
          <div className="col">
            <Link to="/tickets/close" style={{ textDecoration: "none" }}>
              <div className="card border  rounded bg-light ">
                <div className="card-body d-flex flex-column align-items-center">
                  <i className="fa-solid fa-check-circle fa-2x text-success mb-3"></i>
                  <h5 className="card-title fw-bold text-center">
                    {" "}
                    <span className="text-success">{closeCount}</span> Close
                    Ticket
                  </h5>
                  <p className="text-center text-muted small ">
                    Close resolved tickets
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Statusdashboard;
