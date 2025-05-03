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
      <Header />
      <div className="container py-2">
        <h6 className="fw-bold d-flex justify-content-between align-items-center">
          <span className="text-uppercase">Ticket-Status</span>
          <button
            type="button"
            class="btn btn-outline-primary btn-sm text-capitalize"
            data-bs-toggle="modal"
            data-bs-target="#exampleModal"
            data-bs-whatever="@mdo"
          >
            create new Ticket
          </button>
        </h6>
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 gap-2">
          <div className="col">
            <Link to="/tickets/open" style={{ textDecoration: "none" }}>
              <div className="card border rounded bg-light ">
                <div className="card-body d-flex flex-column align-items-center">
                  <i className="fa-solid fa-ticket fa-2x text-danger mb-3"></i>
                  <h5 className="card-title fw-bold text-center">
                    <span className="text-danger px-2">{openCount}</span> Open Ticket{" "}
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
                    <span className="text-success px-2">{closeCount}</span>
                    Closed Ticket
                  </h5>
                  <p className="text-center text-muted small ">
                    Closed/Resolved tickets
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
