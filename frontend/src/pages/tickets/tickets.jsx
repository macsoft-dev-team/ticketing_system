import React, { useState } from "react";
import { EditOutlined, EllipsisOutlined, MessageOutlined, PlusOutlined, SettingOutlined } from "@ant-design/icons";
import { Avatar, Card, Switch, Row, Col, Button, Segmented, Flex, Splitter } from "antd";
import useCrud from "../../lib/hooks/useCrud";
import TicketForm from "../../components/forms/ticket";
import moment from "moment";
import TicketCard from "../../components/ticket-card";
import ChatBox from "../../components/chat-box";
const Tickets = () => {
    const { data, currentData, loading, error, show, setModal, setCurrentData, createItem, updateItem } = useCrud("ticket");
    const [chatWindow, setChatWindow] = useState(false);

    const HandleChat = (data) => {
        console.log("Chat Data:", data);
        return (
        <Button
            key="chat"
            type="text"
            icon={<MessageOutlined />}
            onClick={() => {
                setChatWindow(true);
                setCurrentData(data.data);
            }}>
        </Button>
        )
    }

    const handleClose = () => {
        setChatWindow(false);
        setCurrentData(null);
    };

    if (error) {
        return <p>Error loading tickets: {error.message}</p>;
    }
    console.log("Tickets Data:", data);

    return (
        <section>
            <Row
                style={{
                    width: "100%",
                    margin: "0",
                    color: "#001529",
                    padding: "0 20px",
                    textTransform: "uppercase",
                }}
                align={"middle"}
            >
                <h2 style={{ fontWeight: "bold", fontSize: "18px", }}>
                    Tickets
                </h2>
                <Segmented
                    style={{
                        marginLeft: "20px",
                    }}
                    options={['Open', 'Closed']}
                    onChange={value => {
                        console.log(value);  
                    }} />

                <Button
                    variant="dashed"
                    color="cyan"
                    disabled={loading || currentData}
                    style={{
                        marginLeft: "auto",
                    }}
                    onClick={() => setModal(true)}
                >
                    CREATE TICKET
                    <PlusOutlined />
                </Button>

            </Row>
            <Row>
                <Splitter layout="horizontal" style={{ height: "100%", width: "100%" }}>
                    <Splitter.Panel resizable={false}>
                        <div className={`grid gap-2 p-5 ${chatWindow ? "grid-cols-2 " : "grid-cols-4 "}`} wrap gap="small" justify="space-evenly" style={{ margin: 0 }}>
                            {data?.map((ticket) => (
                                <TicketCard loading={loading} HandleChat={HandleChat} ticket={ticket} />
                            ))}
                        </div >
                    </Splitter.Panel>
                    {chatWindow && (
                        <Splitter.Panel className="!p-2" >
                            <ChatBox handleClose={handleClose} conversation={currentData.messages} ticket={currentData} />
                        </Splitter.Panel>
                    )}

                </Splitter>
            </Row>
            <TicketForm
                open={show}
                handleClose={() => setModal(false)}
                handleSubmit={(values) => {
                    if (currentData) {
                        updateItem(currentData.id, values);
                    } else {
                        createItem(values);
                    }
                    setModal(false);
                }}
                currentData={currentData}
            />
        </section>
    );
};

export default Tickets;