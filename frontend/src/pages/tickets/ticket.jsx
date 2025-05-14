import { Button, Space, Typography } from "antd";
import { EditOutlined, MessageOutlined, RollbackOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import useTicket from "../../lib/hooks/useTicket";
import moment from "moment";
import TicketForm from "../../components/forms/ticket";
import ChatBox from "../../components/chat-box";
import useConversation from "../../lib/hooks/conversation";

export default function Ticket() {
    const { currentData, show, fetchTicket, setCurrentData, setShow } = useTicket();
    const { data: conversation, loading, fetchConversation } = useConversation();
    const { ticketId } = useParams();
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(-1);
        setCurrentData(null);

    };

    const handleClose = () => {
        setShow(false);
    };

    useEffect(() => {
        fetchTicket(ticketId);
        fetchConversation(ticketId);
    }, [ticketId]);

    console.log(show, "show ticket form");

    const handleSubmit = (values) => {
        if (currentData) {
            updateItem(currentData.id, values);
        } else {
            createItem(values);
        }
        setShow(false);
    };


    if (show) {
        return (
            <TicketForm
                handleClose={handleClose}
                handleSubmit={handleSubmit}
                currentData={currentData}
            />);
    }
    return (
        <section className="bg-gray-50 min-h-screen p-4">
            <header className="border-b border-gray-300 bg-white shadow-sm text-blue-800 uppercase p-4 flex justify-between items-center">
                <Typography.Title level={4} className="text-xl tracking-wider font-bold flex-1">
                    Ticket (<span className="text-green-600">#{currentData?.ticketCode}</span>)
                </Typography.Title>
                <Space.Compact block className="!w-max !ms-auto">
                   {/*  <Button
                        type="primary"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold"
                        onClick={() => alert("Create Ticket")}
                        icon={<MessageOutlined />}
                    /> */}
                    <Button
                        type="primary"
                        className="!bg-green-700 hover:!bg-green-700/80 text-white font-bold"
                        onClick={() => {
                            setShow(true)
                        }}
                        icon={<EditOutlined />}
                    />
                    <Button
                        type="primary"
                        className="!bg-slate-500 hover:!bg-slate-700 text-white font-bold"
                        onClick={handleBack}
                        icon={<RollbackOutlined />}
                    />
                </Space.Compact>
            </header>
            <section className="bg-white shadow-md rounded-lg mt-2 grid sm:grid-cols-2">
                <div className="grid grid-cols-1 md:grid-cols-2 *:p-4 md:divide-x divide-gray-200 gap-6">
                    <div>
                        <div className="grid grid-cols-2 gap-4">
                            <Typography.Text strong>Ticket Code</Typography.Text>
                            <Typography.Text>{currentData?.ticketCode}</Typography.Text>
                            <Typography.Text strong>Raised Date</Typography.Text>
                            <Typography.Text>{moment(currentData?.createdAt).format("LLL")}</Typography.Text>
                            <Typography.Text strong>Status</Typography.Text>
                            <Typography.Text>{currentData?.status}</Typography.Text>
                        </div>
                        <div className="py-2">
                            <Typography.Title level={5}>Description</Typography.Title>
                            <Typography.Paragraph className="text-gray-500">
                                {currentData?.description}
                            </Typography.Paragraph>
                        </div>
                        <div className="py-2">
                            <Typography.Title level={5}>Attachment</Typography.Title>
                            <div className="flex flex-col space-y-2">
                                {currentData?.attachments?.map((attachment, index) => (
                                    <a
                                        key={index}
                                        href={attachment}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline"
                                    >
                                        {attachment}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="mb-4">
                            <Typography.Title level={5} className="uppercase tracking-wider">
                                Customer Details
                            </Typography.Title>
                            <div className="flex flex-col text-gray-500 space-y-1">
                                <Typography.Text>{currentData?.customerName}</Typography.Text>
                                <Typography.Text>{currentData?.state}</Typography.Text>
                                <Typography.Text>{currentData?.district}</Typography.Text>
                                <Typography.Text>{currentData?.village}</Typography.Text>
                            </div>
                        </div>
                        <div>
                            <Typography.Title level={5} className="uppercase tracking-wider">
                                Controller Details
                            </Typography.Title>
                            <div className="grid *:px-2 *:py-1 border-b-0 border-gray-200 border grid-cols-2 text-gray-500 space-y-1 *:not-odd:border-b *:not-odd:border-gray-200 *:not-odd:m-0 *:not-even:m-0 *:not-even:border-b *:not-even:border-e *:not-even:border-gray-200">
                                <Typography.Text strong >Controller No</Typography.Text>
                                <Typography.Text >{currentData?.controllerNo}</Typography.Text>
                                <Typography.Text strong >Head</Typography.Text>
                                <Typography.Text >{currentData?.head}</Typography.Text>
                                <Typography.Text strong >IMEI</Typography.Text>
                                <Typography.Text >{currentData?.imei}</Typography.Text>
                                <Typography.Text strong >HP</Typography.Text>
                                <Typography.Text >{currentData?.hp}</Typography.Text>
                                <Typography.Text strong >Motor Type</Typography.Text>
                                <Typography.Text >{currentData?.motorType}</Typography.Text>
                                <Typography.Text strong>Fault Code</Typography.Text>
                                <Typography.Text >{currentData?.faultCode}</Typography.Text>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <ChatBox loading={loading} ticket={currentData} conversation={conversation} />
                </div>
            </section>
        </section>
    );
}


