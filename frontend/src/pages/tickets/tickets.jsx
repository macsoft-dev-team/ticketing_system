import { useState, useEffect } from "react";
import { EditOutlined, EyeOutlined, MessageOutlined, PlusOutlined, } from "@ant-design/icons";
import { Row, Button, Segmented, Splitter, Input, Empty, Typography, Spin, Select } from "antd";
import useCrud from "../../lib/hooks/useCrud";
import TicketForm from "../../components/forms/ticket";
import TicketCard from "../../components/ticket-card";
import ChatBox from "../../components/chat-box";
import useConversation from "../../lib/hooks/conversation";
import socket from "../../lib/socket/socket";
import { useDispatch, useSelector } from "react-redux";
import { fetchConversation } from "../../lib/features/conversationSlice";
import { useNavigate } from "react-router-dom";
import useTicket from "../../lib/hooks/useTicket";
const Tickets = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { data, currentData, loading, error, show, setShow, filter, setCurrentData, createItem, updateItem, setFilter, setData } = useTicket();
    const { Search } = Input;
    const { data: conversation, createItem: createConversation, setData: setConversation, show: chatWindow, setShow: setChatWindow } = useConversation();

    const HandleChat = (data) => {
        return (
            <Button
                key="chat"
                type="text"
                disabled={currentData}
                icon={<MessageOutlined />}
                onClick={() => {
                    setChatWindow(true);
                    setCurrentData(data.data);
                    dispatch(fetchConversation({ ticketId: data?.data?.id }));

                }}>
            </Button>
        )
    }

    const HandleStatus = (data) => {
        return (
            <Select
                className="min-w-26"
                key="status"
                loading={loading}
                defaultValue={data.data.status}
                options={[{ value: 'OPEN', label: 'OPEN' }, { value: 'CLOSED', label: 'CLOSED' }]}
                onChange={(value) => {
                    updateStatus(data.data.id, { status: value });
                }}
            />
        )
    }

    const HandleEdit = (data) => {
        return (
            <Button
                key="edit"
                disabled={chatWindow}
                type="text"
                icon={<EyeOutlined />}
                onClick={() => {
                    navigate(`${user.role.toLowerCase() === "technical_user" ? '/technical-user/tickets/' + data.data?.id : "/"+user.role.toLowerCase() +'/tickets/' + data.data?.id}`);
                    setCurrentData(data.data);
                }}>
            </Button>
        )
    }

    const handleSubmitChat = (values) => {
        const _data = { ...values, ticketId: currentData?.id };
        createConversation({ ticketId: currentData.id, newMessage: _data });
    }

    const handleClose = () => {
        setChatWindow(false);
        setShow(false);
        setCurrentData(null);
    };

    const onSearch = (value) => {
        if (value) {
            setFilter({ ...filter, ...value });
        } else {
            setFilter({});
        }
    };

    useEffect(() => {
        socket.connect();

        socket.on("connect", () => {
            console.log("Connected for conversation:", socket.id);
        });

        socket.on("conversation", (newConversation) => {
            setConversation(prev => [...prev, newConversation]);
            console.log("New conversation:", newConversation);

        });

        return () => {
            socket.disconnect();
            socket.off("conversation");
        };

    }, []);
    useEffect(() => {
        socket.connect();

        socket.on("connect", () => {
            console.log("Connected for tickets:", socket.id);
        });

        socket.on("ticket", (newTicket) => {
            setData(prev => [...prev, newTicket]);
            console.log("New ticket:", newTicket);
        });

        return () => {
            socket.disconnect();
            socket.off("ticket");
        };

    }, []);

    if (error) {
        return <p>Error loading tickets: {error.message}</p>;
    }

    if (show) {
        return (
            <TicketForm
                handleClose={() => setShow(false)}
                handleSubmit={(values) => {
                    if (currentData) {
                        updateItem(currentData.id, values);
                    } else {
                        createItem(values);
                    }
                    setShow(false);
                }}
                currentData={currentData}
            />
        )
    }

    return (
        <section>
            <Row
                className="!px-6 !py-2"
                style={{
                    width: "100%",
                    margin: "0",
                    color: "#001529",
                    textTransform: "uppercase",
                }}
                align={"middle"}
            >
                <h2 className="font-bold tracking-widest text-xl"  >
                    Tickets
                </h2>
                <Segmented
                    style={{
                        marginLeft: "20px",
                    }}
                    defaultValue="OPEN"
                    options={['OPEN', 'CLOSED']}
                    onChange={value => {
                        onSearch({ status: value });
                    }} />
                <Search placeholder="Search by Ticket id/Controller No" allowClear onSearch={onSearch} style={{ width: 300 }} />
                <Button
                    variant="dashed"
                    color="cyan"
                    disabled={loading || currentData}
                    style={{
                        marginLeft: "auto",
                    }}
                    onClick={() => setShow(true)}
                >
                    CREATE TICKET
                    <PlusOutlined />
                </Button>
            </Row>
            <Row>

                {data.length === 0 && !loading ? (
                    <div className="flex items-center justify-center h-[400px] w-full">
                        <Empty description={<Typography.Text type="secondary">No Tickets Found</Typography.Text>} />
                    </div>
                ) : (
                    <Splitter layout="horizontal" style={{ height: "100%", width: "100%" }}>
                        <Splitter.Panel resizable={false}>
                            <div className={`grid gap-2 p-5 ${chatWindow ? "sm:grid-cols-2 " : "sm:grid-cols-4 "}`} wrap="true" gap="small" justify="space-evenly" style={{ margin: 0 }}>
                                {data?.map((ticket) => (
                                    <TicketCard key={ticket.id + "Ticket"} loading={loading} HandleEdit={HandleEdit} HandleChat={HandleChat} HandleStatus={HandleStatus} ticket={ticket} currentData={currentData} />
                                ))}

                            </div >
                        </Splitter.Panel>

                        {chatWindow && (
                            <Splitter.Panel className="!p-2" >
                                <ChatBox handleSubmit={handleSubmitChat} handleClose={handleClose} conversation={currentData?.messages?.length > 0 ? currentData?.messages : []} ticket={currentData} />
                            </Splitter.Panel>
                        )}

                    </Splitter>
                )}
            </Row>


        </section>
    );
};

export default Tickets;