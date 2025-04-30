import React, { useState, useEffect } from "react";
import Header from "./Header";
import axios from "axios";

import {
  differenceInDays,
  differenceInMinutes,
  format,
  formatRelative,
} from "date-fns";
import { useParams } from "react-router-dom";

const Dashboard = () => {
  const API_URL = import.meta.env.VITE_APP_URL;

  const [playsound, setplaySound] = useState(false);
  const [unreadmessage, setunreadmessage] = useState([]);
  const [unreadmessageTime, setunreadmessageTime] = useState({});

  let { ticketStatus } = useParams();
  const [data, setdata] = useState([]);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterData, setFilterdata] = useState([]);
  const [message, setMessage] = useState("");
  const [conversation, setCoversation] = useState([]);
  const [form, setform] = useState({
    customername: "",
    controllerno: "",
    head: "",
    imei: "",
    hp: "",
    motortype: "",
    state: "",
    district: "",
    village: "",
    block: "",
    faultcode: "",
    complainttype: "",
    details: "",
    picture: null,
    status: "open",
  });
  const [messageDetails, setMessageDetails] = useState({
    ticketcode: "",
    status: "",
    user_id: " ",
  });
  const [notification, setNotification] = useState([]);
  const [closeTicket, setCloseTicket] = useState("open");

  const [lmsSearch, setLmsSearch] = useState("");
  const [searcherror, setsearcherror] = useState("");
  const fetchSingleData = async (serialnumber) => {
    try {
      if (
        serialnumber.length === 10 ||
        serialnumber.length === 16 ||
        serialnumber.length === 17
      ) {
        const response = await axios.get(
          `http://localhost:4000/api/customers/alldataforts`,
          { params: { serialnumber } }
        );
        const lmsdata = response.data;
        setsearcherror("");
        if (lmsdata) {
          setform((prevForm) => ({
            ...prevForm,
            controllerno: lmsdata.serialnumber,
            hp: lmsdata.powerrating,
            imei: lmsdata.imeinumber,
            motortype: lmsdata.motortype,
          }));
        }
      } else {
        setform((prevForm) => ({
          ...prevForm,
          hp: "",
          imei: "",
          motortype: "",
        }));
        setsearcherror(""); 
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn("No matching serial number found.");
        setsearcherror("Contoller Not Found");
      } else {
        console.error("Error fetching data:", error);
      }
    }
  };

  useEffect(() => {
    if (lmsSearch) {
      fetchSingleData(lmsSearch);
    }
  }, [lmsSearch]);

  const checkduplicate = notification.filter(
    (value, index) => notification.indexOf(value) === index
  );

  // get all message for particular ticket
  const fetchMessage = async () => {
    const ticketcode = messageDetails.ticketcode;
    if (!ticketcode) return;
    try {
      const response = await axios.get(`${API_URL}/api/message`, {
        params: { ticketcode },
      });
      const totalMessage = response.data.length;
      if (totalMessage > 0) {
        const lastMessage = response.data[totalMessage - 1];
        const lastMessageTime = new Date(lastMessage.created_at);
        const currentTime = new Date();
        const lastMessageBy = lastMessage.messageby === "admin";
        const dayDiffernce = differenceInDays(currentTime, lastMessageTime);
        if (lastMessageBy && dayDiffernce > 2) {
          setCloseTicket("closed");
          console.log("closed : ", ticketcode);
          await axios.put(`${API_URL}/api/closeticket/${ticketcode}`);
        }
      }
      setCoversation(response.data);
      setplaySound(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (messageDetails.ticketcode) {
      fetchMessage();
    }
  }, [messageDetails.ticketcode]);

  // ticket details and update message after seen
  const handleMessageDetails = (value) => {
    setMessageDetails(value);
    console.log("message deatils:", value.user_id);
    const role = decodeToken();
    const user_role = role.role === "admin" ? "user" : "admin";
    axios
      .post(`${API_URL}/api/message/markAsRead`, {
        ticketcode: value.ticketcode,
        messageby: user_role,
      })
      .then(() => {
        setNotification((prevNotifications) =>
          prevNotifications.filter((ticket) => ticket !== value.ticketcode)
        );
      })
      .catch((error) => {
        console.error("Error marking message as read:", error);
      });
  };

  //send new message to particular ticket
  const handleMessage = async (e) => {
    e.preventDefault();
    const role = decodeToken();
    const formdata = {
      ticketcode: messageDetails.ticketcode,
      message: message,
      messageby: role.role,
      status: messageDetails.status,
      user_id: messageDetails.user_id,
    };
    console.log("formdata", formdata);
    try {
      const response = await axios.post(`${API_URL}/api/addmessage`, formdata);
      setMessage("");
      fetchMessage();
    } catch (error) {
      console.log(error);
    }
  };

  // filter an ticket with new message
  const handleMessageFilter = (e) => {
    e.preventDefault();
    const ticketsWithNewMessages = records.filter((ticket) =>
      notification.includes(ticket.ticketcode)
    );
    setFilterdata(ticketsWithNewMessages);
    console.log("Tickets with new messages: ", ticketsWithNewMessages);
  };

  //  decode token to Find role (admin or user)
  const decodeToken = () => {
    const token = sessionStorage.getItem("authtoken");
    if (!token && !token.startsWith("Bearer ")) {
      console.log("no token found");
      return null;
    }
    try {
      const jwttoken = token.split(".")[1];
      const decoded = JSON.parse(atob(jwttoken));
      // console.log(decoded);
      return decoded;
    } catch (error) {
      console.log(error);
      return null;
    }
  };
  const role = decodeToken();

  // to fetch all tickets (admin - all ticketdetails,user - their own ticketDetails)
  const fetchData = async () => {
    const token = sessionStorage.getItem("authtoken");
    try {
      const response = await axios.get(`${API_URL}/api/getticket/user`, {
        params: { ticketStatus },
        headers: { Authorization: `Bearer ${token}` },
      });
      setdata(response.data.reverse());

      //  fetch all message and find unread message
      const message = await axios.get(`${API_URL}/api/allmessage`);
      const notSeenMessage = [];
      const newmessageTime = {};
      console.log("Role:", role.role, "ID:", role.id);
      message.data.forEach((msg) => {
        if (
          role.role === "admin" &&
          msg.isread === 0 &&
          msg.messageby === "user"
        ) {
          notSeenMessage.push(msg.tickcode);
          newmessageTime[msg.tickcode] = msg.created_at;
          setplaySound(true);
        } else if (
          role.role === "user" &&
          msg.isread === 0 &&
          msg.messageby === "admin" &&
          msg.user_id === role.id
        ) {
          notSeenMessage.push(msg.tickcode);
        }
      });
      setunreadmessage(notSeenMessage);
      setunreadmessageTime(newmessageTime);
      console.log("NewMessageTime", newmessageTime);
      setNotification(notSeenMessage);
      console.log("NotSeenMessage", notSeenMessage);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (playsound) {
      const audio = new Audio("/notification-22-270130.mp3");
      audio.play();
      console.log("audio playing first");
      setTimeout(() => setplaySound(false), 2 * 60 * 1000); // Stop sound after 2 minutes
    }
  }, [playsound]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();

      Object.keys(unreadmessageTime).forEach((tickcode) => {
        const messageTime = new Date(unreadmessageTime[tickcode]).getTime();
        console.log("message time", messageTime);
        const timeDifference = (currentTime - messageTime) / 60000; // Time difference in minutes

        if (timeDifference > 3 && unreadmessage.includes(tickcode)) {
          setplaySound(true);
          console.log("long audio started");
        }
      });
    }, 30 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval); // Cleanup on unmount
  }, [unreadmessage, unreadmessageTime]);

  useEffect(() => {
    fetchData();
  }, [form]);

  //   edit ticket
  const handleEdit = (value) => {
    setform({
      customername: value.customername,
      controllerno: value.controllerno,
      head: value.head,
      imei: value.imei,
      hp: value.hp,
      motortype: value.motortype,
      state: value.state,
      district: value.district,
      village: value.village,
      block: value.block,
      faultcode: value.faultcode,
      complainttype: value.complainttype,
      details: value.details,
      picture: value.picture,
      status: value.status,
    });
    setEditing(value);
  };

  //   submit an ticket form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const decode = await decodeToken();
    try {
      const endpoint = editing
        ? //   ? `http://localhost:8080/api/updateticket/${editing.ticketcode}`
          // : "http://localhost:8080/api/addticket";
          `${API_URL}/api/updateticket/${editing.ticketcode}`
        : `${API_URL}/api/addticket`;
      const method = editing ? "put" : "post";
      const formData = {
        ...form,
        user_id: decode.id,
      };
      const response = await axios[method](endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log(response.data);
      reset();
    } catch (error) {
      console.log(error);
    }
  };

  //    delete ticket
  const handleDelete = async (ticketcode) => {
    try {
      const response = await axios.delete(
        //     `http://localhost:8080/api/deleteticket/${ticketcode}`
        `${API_URL}/api/deleteticket/${ticketcode}`
      );
      console.log(response.data);
      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.trim();
    setSearch(value);
    const searchTerm = data.filter((item) => {
      return (
        item.ticketcode.toLowerCase().includes(value.toLowerCase()) ||
        item.controllerno.toLowerCase().includes(value.toLowerCase()) ||
        item.status.toLowerCase().includes(value.toLowerCase())
      );
    });
    console.log(searchTerm);
    setFilterdata(searchTerm);
  };

  const reset = () => {
    setform({
      customername: "",
      controllerno: "",
      head: "",
      imei: "",
      hp: "",
      motortype: "",
      state: "",
      district: "",
      village: "",
      block: "",
      faultcode: "",
      complainttype: "",
      details: "",
      picture: null,
      status: "open",
    });
    setEditing(null);
  };

  //    pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordPerPage = 8;
  const datatoPaginate = filterData.length > 0 ? filterData : data;
  const lastIndex = currentPage * recordPerPage;
  const firstIndex = lastIndex - recordPerPage;
  const records = datatoPaginate.slice(firstIndex, lastIndex);
  const nPage = Math.ceil(datatoPaginate.length / recordPerPage);
  const pageLimit = 3;
  const pageStart = Math.floor((currentPage - 1) / pageLimit) * pageLimit + 1;
  const pageEnd = Math.min(pageStart + pageLimit - 1, nPage);

  const pageNumber = [];
  for (let i = pageStart; i <= pageEnd; i++) {
    pageNumber.push(i);
  }
  const prePage = () => {
    if (currentPage !== 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  const changeCurrentPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const nextPage = () => {
    if (currentPage !== nPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <>
      <Header
        handleMessageFilter={handleMessageFilter}
        newMessage={checkduplicate}
      />

      <div className="container mt-3">
        {ticketStatus === "close" ? (
          " "
        ) : (
          <>
            <div className="d-flex justify-content-between">
              <h3 className="fw-bold ">Tickets</h3>
              <button
                type="button"
                class="btn btn-outline-primary btn-sm"
                data-bs-toggle="modal"
                data-bs-target="#exampleModal"
                data-bs-whatever="@mdo"
                onClick={reset}
              >
                Add Ticket
              </button>
            </div>
          </>
        )}

        <div className="mt-3 container">
          <div className="rounded border shadow-sm bg-light">
            <div className="d-flex flex-wrap justify-content-between p-3 align-items-center gap-3">
              <div className="d-flex gap-3 align-items-center">
                <input
                  type="search"
                  className="form-control "
                  style={{ width: "280px" }}
                  placeholder="Search by TicketCode|Controller"
                  onChange={handleSearch}
                />
              </div>

              <div>
                <small>
                  <nav aria-label="Page navigation example">
                    <ul className="pagination justify-content-center">
                      <li className="page-item">
                        <a
                          className="page-link"
                          href="#"
                          aria-label="Previous"
                          onClick={(e) => {
                            e.preventDefault(), prePage();
                          }}
                        >
                          <span aria-hidden="true">&laquo;</span>
                        </a>
                      </li>
                      {pageNumber.map((n, i) => (
                        <li
                          key={i}
                          className={`page-item ${
                            currentPage === n ? "active" : ""
                          }`}
                        >
                          <a
                            href=""
                            onClick={(e) => {
                              e.preventDefault(), changeCurrentPage(n);
                            }}
                            className="page-link"
                          >
                            {n}{" "}
                          </a>
                        </li>
                      ))}
                      <li className="page-item">
                        <a
                          className="page-link"
                          href="#"
                          aria-label="Next"
                          onClick={(e) => {
                            e.preventDefault(), nextPage();
                          }}
                        >
                          <span aria-hidden="true">&raquo;</span>
                        </a>
                      </li>
                    </ul>
                  </nav>
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 container">
          <div className="row justify-content-start">
            {filterData.length === 0 && search !== "" ? (
              <div className="col-12 text-center">
                <h4>No tickets found</h4>
              </div>
            ) : (
              records.map((value, id) => (
                <div
                  key={id}
                  className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4 "
                >
                  <div className="card  h-100 rounded-2 bg-light hover-shadow-md">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="card-title text-primary fw-bold">
                          {value.ticketcode}
                        </h5>

                        <button
                          type="button"
                          className="btn btn-outline-primary border-0"
                          data-bs-toggle="modal"
                          data-bs-target="#model1"
                          onClick={() => handleMessageDetails(value)}
                        >
                          <i className="fa-regular fa-comment-dots"></i>
                        </button>

                        <span
                          className={`badge ${
                            value.status === "open" ? "bg-success" : "bg-danger"
                          } text-white`}
                        >
                          {value.status}
                        </span>
                      </div>

                      {notification.includes(value.ticketcode) && (
                        <div className="badge bg-danger text-white mb-3 py-1 px-3 rounded">
                          New Message
                        </div>
                      )}

                      <p className="card-text">
                        <strong>Customer:</strong> {value.customername}
                      </p>
                      <p className="card-text">
                        <strong>Controller No:</strong> {value.controllerno}
                      </p>
                      <p className="card-text">
                        <strong>Fault Code:</strong> {value.faultcode}
                      </p>
                      <p className="card-text">
                        <strong>State:</strong> {value.state}
                      </p>
                      <p className="card-text">
                        <strong className="">Complaint:</strong>{" "}
                        {value.complainttype}
                      </p>
                      <p className="card-text">
                        <strong className="text-dark ">Details:</strong>{" "}
                        {value.details}
                      </p>
                      <small>
                        <p className="card-text">
                          <strong className="text-danger">DateTime:</strong>{" "}
                          {new Date(value.created_at).toLocaleDateString()}{" "}
                          {new Date(value.created_at).toLocaleTimeString(
                            "en-US",
                            { hour: "2-digit", minute: "2-digit", hour12: true }
                          )}
                        </p>
                      </small>
                    </div>

                    <div className="card-footer bg-light border-top-0">
                      <div className="btn-group w-100" role="group">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm w-100 mb-2"
                          data-bs-toggle="modal"
                          data-bs-target="#staticBackdrop"
                          onClick={() => handleEdit(value)}
                        >
                          <i className="fa-regular fa-eye"></i> View
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm w-100 mb-2"
                          data-bs-toggle="modal"
                          data-bs-target="#exampleModal"
                          onClick={() => handleEdit(value)}
                        >
                          <i className="fa-regular fa-edit"></i> Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm w-100 mb-2"
                          onClick={() => handleDelete(value.ticketcode)}
                        >
                          <i className="fa-solid fa-trash"></i> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="exampleModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog  modal-dialog-scrollable modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title fw-bold " id="exampleModalLabel">
                {editing ? (
                  <>
                    {" "}
                    Update Ticket :
                    <span className="text-primary mx-1">
                      {editing.ticketcode}
                    </span>
                  </>
                ) : (
                  "Raise Ticket"
                )}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} enctype="multipart/form-data">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="customername" className="form-label">
                      Customer Name: <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="customername"
                      placeholder="Enter Customer Name"
                      onChange={(e) =>
                        setform({ ...form, customername: e.target.value })
                      }
                      required
                      value={form.customername}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="controllerno" className="form-label">
                      Controller No: <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control"
                      value={form.controllerno}
                      placeholder="Enter Controller No"
                      onInput={(e) => {
                        setform({ ...form, controllerno: e.target.value });
                        setLmsSearch(e.target.value);
                      }}
                    />
                    {searcherror && (
                      <small>
                        <div className="text-danger mt-1 text-sm">{searcherror}</div>
                      </small>
                    )}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="head" className="form-label">
                      Head:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="head"
                      placeholder="Enter Head No"
                      onChange={(e) =>
                        setform({ ...form, head: e.target.value })
                      }
                      value={form.head}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="imei" className="form-label">
                      IMEI :
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="imei"
                      placeholder="Enter IMEI No"
                      onChange={(e) =>
                        setform({ ...form, imei: e.target.value })
                      }
                      value={form.imei}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="hp" className="form-label">
                      HP:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter HP Name"
                      onChange={(e) => setform({ ...form, hp: e.target.value })}
                      value={form.hp}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="motortype" className="form-label">
                      Motor Type:
                    </label>
                    <select
                      name=""
                      id=""
                      className="form-select"
                      value={form.motortype}
                      onChange={(e) =>
                        setform({ ...form, motortype: e.target.value })
                      }
                    >
                      <option value="">Select Motor Type</option>
                      <option value="AC">AC</option>
                      <option value="DC">DC</option>
                    </select>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="state" className="form-label">
                      State: <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="state"
                      required
                      onChange={(e) =>
                        setform({ ...form, state: e.target.value })
                      }
                      placeholder="Enter State"
                      value={form.state}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="district" className="form-label">
                      District: <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="district"
                      required
                      onChange={(e) =>
                        setform({ ...form, district: e.target.value })
                      }
                      placeholder="Enter District"
                      value={form.district}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="village" className="form-label">
                      Village:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="village"
                      onChange={(e) =>
                        setform({ ...form, village: e.target.value })
                      }
                      placeholder="Enter Village"
                      value={form.village}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="block" className="form-label">
                      Block:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="block"
                      placeholder="Enter Block"
                      value={form.block}
                      onChange={(e) =>
                        setform({ ...form, block: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="complainttype" className="form-label">
                      Complaint Type: <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="complainttype"
                      value={form.complainttype}
                      required
                      onChange={(e) =>
                        setform({ ...form, complainttype: e.target.value })
                      }
                    >
                      <option value="">Select Complaint Type</option>
                      <option value="motor-not-running">
                        Motor Not Running
                      </option>
                      <option value="how-water-discharge">
                        Low Water Discharge
                      </option>
                      <option value="external-system-damage">
                        External System Damage
                      </option>
                      <option value="controller-not-on">
                        Controller Not ON
                      </option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="faultcode" className="form-label">
                      Fault Code: <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="faultcode"
                      required
                      onChange={(e) =>
                        setform({ ...form, faultcode: e.target.value })
                      }
                      placeholder="Enter Fault Code"
                      value={form.faultcode}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-12 mb-3">
                    <label htmlFor="details" className="form-label">
                      Details:
                    </label>
                    <textarea
                      className="form-control"
                      id="details"
                      placeholder="Enter details about the issue"
                      onChange={(e) =>
                        setform({ ...form, details: e.target.value })
                      }
                      value={form.details}
                      rows="3"
                    ></textarea>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12 mb-3">
                    <label htmlFor="picture" className="form-label">
                      Picture:
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      id="picture"
                      accept="image/*"
                      onChange={(e) =>
                        setform({ ...form, picture: e.target.files[0] })
                      }
                    />
                  </div>
                </div>
                {role.role === "admin" ? (
                  <>
                    <div className="row">
                      <div className="col-12 mb-3">
                        <label htmlFor="status" className="form-label">
                          Status :
                        </label>
                        <select
                          id="status"
                          className="form-select"
                          value={form.status}
                          onChange={(e) =>
                            setform({ ...form, status: e.target.value })
                          }
                        >
                          <option value="open">open</option>
                          <option value="close">close</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  ""
                )}

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    Close
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editing ? "Update" : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="staticBackdrop"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
        tabIndex="-1"
        aria-labelledby="staticBackdropLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-scrollable  modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="staticBackdropLabel">
                {editing ? (
                  <>
                    <span className="text-primary fw-bold">
                      {editing.ticketcode}
                    </span>
                    <span>
                      <small>
                        {"   "}
                        <span>
                          {" "}
                     <small>   ({new Date(editing.created_at).toLocaleString()})</small>  
                        </span>
                      </small>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-primary mx-1">{form.ticketcode}</span>
                  </>
                )}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="card-body">
                <div className="row ">
                  <div className="col-md-6 mb-3">
                    <p className="card-text">
                      <strong>Customer Name:</strong>{" "}
                      {editing ? editing.customername : form.customername}
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="card-text">
                      <strong>Controller No:</strong>{" "}
                      {editing ? editing.controllerno : form.controllerno}
                    </p>
                  </div>
                </div>
                <div className="row ">
                  <div className="col-md-6 mb-3">
                    <strong>Head:</strong> {form.head}
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>IMEI:</strong> {form.imei}
                  </div>
                </div>
                <div className="row ">
                  <div className="col-md-6 mb-3">
                    <strong>HP:</strong> {form.hp}
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>MotorType:</strong> {form.motortype}
                  </div>
                </div>

                <div className="row ">
                  <div className="col-md-6 mb-3">
                    <p className="card-text">
                      <strong>Fault Code:</strong>{" "}
                      {editing ? editing.faultcode : form.faultcode}
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="card-text">
                      <strong>State:</strong>{" "}
                      {editing ? editing.state : form.state}
                    </p>
                  </div>
                </div>

                <div className="row ">
                  <div className="col-md-6 mb-3">
                    <p className="card-text">
                      <strong>District:</strong>{" "}
                      {editing ? editing.district : form.district}
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="card-text">
                      <strong>Village:</strong>{" "}
                      {editing ? editing.village : form.village}
                    </p>
                  </div>
                </div>

                <div className="row ">
                  <div className="col-md-6 mb-3">
                    <p className="card-text">
                      <strong>Block:</strong>{" "}
                      {editing ? editing.block : form.block}
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="card-text">
                      <strong>Complaint Type:</strong>{" "}
                      {editing ? editing.complainttype : form.complainttype}
                    </p>
                  </div>
                </div>

                <p className="card-text">
                  <strong>Details:</strong>{" "}
                  {editing ? editing.details : form.details}
                </p>

                <div className="mt-2">
                  <strong>Picture:</strong>
                  <div
                    className="border rounded p-3 rounded-lg shadow-sm mx-auto"
                    style={{ maxWidth: "400px" }}
                  >
                    <img
                      src={`http://localhost:8080/${form.picture}`}
                      alt="  No image"
                      className="img-fluid mt-2"
                      style={{
                        maxHeight: "300px",
                        objectFit: "contain",
                        borderRadius: "12px",
                        boxShadow: "0 3px 6px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        class="modal fade"
        id="model1"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
        tabindex="-1"
        aria-labelledby="staticBackdropLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 className="fw-bold " id="staticBackdropLabel">
                Send Message :{" "}
                <span className="text-primary">
                  {messageDetails.ticketcode}
                </span>
              </h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div
              style={{
                maxHeight: "500px",
                overflowY: "scroll",
                padding: "10px",
              }}
            >
              {conversation.map((value, id) => (
                <div
                  key={id}
                  style={{
                    display: "flex",
                    flexDirection:
                      value.messageby === "admin" ? "row-reverse" : "row",
                    marginBottom: "10px",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      backgroundColor:
                        value.messageby === "admin" ? "#CFD8DC" : "#009688",
                      color: value.messageby === "admin" ? "#000" : "#fff",
                      padding: "10px",
                      borderRadius: "15px",
                      maxWidth: "70%",
                      wordWrap: "break-word",
                    }}
                  >
                    <p style={{ margin: "0", fontSize: "14px" }}>
                      {" "}
                      {value.message} <br />
                      <small>
                        {format(new Date(value.created_at), "hh:mm")}{" "}
                        {format(new Date(value.created_at), "a")}
                      </small>
                    </p>
                  </div>
                </div>
              ))}

              {closeTicket === "closed" && (
                <div className=" text-center p-2 border rounded shadow-lg bg-light">
                  <h4 className="text-danger fw-bold mb-3">
                    <i className="bi bi-x-circle"></i> Ticket Closed
                  </h4>
                  <p className="text-muted mb-4">
                    This ticket has been closed due to inactivity. Please
                    contact support if you need further assistance.
                  </p>
                </div>
              )}
            </div>

            <div class="modal-footer ">
              <div className="d-flex gap-3 justify-content-end w-100 ">
                <input
                  type="text"
                  className="form-control"
                  id="message"
                  placeholder="Send Message"
                  name="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={closeTicket === "closed"}
                />
                <button
                  className="btn btn-success"
                  type="button"
                  onClick={handleMessage}
                  disabled={closeTicket === "closed"}
                >
                  <i class="fa-solid fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
