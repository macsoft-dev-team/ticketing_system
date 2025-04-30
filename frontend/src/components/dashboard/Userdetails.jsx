import React, { useEffect, useState } from "react";
import Header from "./Header";
import axios from "axios";
import DataTable from "react-data-table-component";

const Userdetails = () => {
  const API_URL = import.meta.env.VITE_APP_URL


  const [data, setdata] = useState([]);
  const [searchTerm, setSearhTerm] = useState("");
  const [filterData, setFilterData] = useState([]);
  const [role, setrole] = useState("");


  const fetchUserDta = async () => {
    try {
    //  const response = await axios.get("http://localhost:8080/api/getuser");
      const response = await axios.get(`${API_URL}/api/getuser`);
      setdata(response.data);
      setFilterData(response.data);
      console.log(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchUserDta();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearhTerm(value);
    const filter = data.filter(
      (item) =>
        item.name.toLowerCase().includes(value.toLowerCase()) ||
        item.phoneNo.toLowerCase().includes(value.toLowerCase()) ||
        item.role.toLowerCase().includes(value.toLowerCase())
    );
    setFilterData(filter);
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(
      //   `http://localhost:8080/api/deleteuser/${id}`
         `${API_URL}/api/deleteuser/${id}`
      );
      console.log(response.data, "is deleted");
      fetchUserDta();
    } catch (error) {
      console.log(error);
    }
  };
  const handleEdit = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setrole(role);
    try {
      const response = await axios.put(
      //   `http://localhost:8080/api/updateuser/${id}`,
          `${API_URL}/api/updateuser/${id}`,
        { role: newRole }
      );
      console.log(response.data);
      fetchUserDta();
    } catch (error) {
      console.log(error);
    }
  };

  const columns = [
    {
      name: <h6 className="fw-bold  ">Name</h6>,
      selector: (row) => row.name,
      className: "column-name",
    },
    {
      name: <h6 className="fw-bold">Number</h6>,
      selector: (row) => row.phoneNo,
      style: { minWidth: "100px", textAlign: "center" },
    },
    {
      name: <h6 className="fw-bold ">Role</h6>,
      selector: (row) => (<p className={`fw-bold ${row.role === "admin" ? "text-primary" : ""}`}>{row.role}</p> ),
      sortable: true,
    },
    {
      name: <h6 className="fw-bold">Ticket</h6>,
        selector: (row) => row.ticketCount, 
        
    },

    {
      name: <h6 className="fw-bold  ">ChangeRole</h6>,
      cell: (row) => (
        <>
          {row.role === "admin" ? (
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => handleEdit(row.id, row.role)}
            >
              User
            </button>
          ) : (
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => handleEdit(row.id, row.role)}
            >
              Admin
            </button>
          )}
        </>
      ),
    },
    {
      name: <h6 className="fw-bold">Action</h6>,
      cell: (row) => (
        <button
          className="btn btn-outline-danger btn-sm "
          onClick={() => handleDelete(row.id)}
        >
          <i className="fa-solid fa-trash"></i>
        </button>
      ),
    },
  ];

  return (
    <>
      <Header />
      <div className="container mt-3">
        <div className="d-flex justify-content-between gap-4">
          <h4 className="fw-bold">User_Details</h4>
          <input
            type="search"
            className="form-control"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search By Name | Number | Role"
          />
        </div>

        <div className="mt-3 ">
          <div className="border rounded p-2">
            <DataTable
              data={filterData}
              columns={columns}
              pagination
              highlightOnHover
              pointerOnHover
              noHeader
            ></DataTable>
          </div>
        </div>
      </div>
    </>
  );
};

export default Userdetails;
