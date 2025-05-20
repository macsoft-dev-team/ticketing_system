import { Card, Avatar, Input, Button, Form } from "antd";
import moment from "moment";
import useConversation from "../lib/hooks/conversation";
import { useEffect, useRef } from "react";

export default function ChatBox({ loading, ticket, conversation, handleClose }) {
    const messageEndRef = useRef(null);
    const { data,createItem: createConversation, setData: setConversation, show: chatWindow, setShow: setChatWindow } = useConversation();
    const CardTitle = () => {
        return (
            <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                    {/* <Avatar
                        src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${ticket?.id}`}
                    /> */}
                    <h2 className="text-lg font-semibold">{ticket?.ticketCode}</h2>
                </div>
                {/*                 <Button onClick={handleClose}  icon={<CloseOutlined />}/>
 */}             </div>

        );
    }
    const handleSubmit = (values) => {
        const _data = { ...values, ticketId: ticket?.id };
        createConversation({ ticketId: ticket.id, newMessage: _data });
    }    
    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [conversation]);
    
    return (
        <Card className="p-4 flex flex-col justify-between">
            <Card.Meta
                title={<CardTitle />}

            />
            <div className="overflow-y-auto p-2 flex flex-col gap-1 flex-1 min-h-[25rem] max-h-[25rem]">
                {/* Render conversation messages */}
                {conversation.map((msg) => (
                    <Card
                        key={msg.id}
                        loading={loading}
                        className={`flex ${msg.sender.role === "TECHNICAL_USER"
                            ? "items-start !bg-gray-50"
                            : msg.sender.role === "ADMIN"
                                ? "items-start !bg-green-50"
                                : "flex-row-reverse items-start !bg-blue-50"
                            }`}
                    >
                        <Card.Meta
                           /*  avatar={
                                <Avatar
                                    src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${msg.sender.name}`}
                                />
                            } */
                            title={<div className="flex gap-1 items-center justify-between w-full">
                                <h2 className="uppercase font-semibold tracking-wider">{msg.sender.name}</h2>
                                <small className="text-emerald-500 !text-[10px]">{msg.sender.role}</small>
                            </div>}
                            description={
                                <>
                                    <p className="text-gray-600">{msg.content}</p>
                                    <time
                                        className="text-gray-500 text-xs text-end"
                                        dateTime={msg.createdAt}
                                    >
                                        {moment(msg.createdAt).format("DD/MM/YYYY HH:mm")}
                                    </time>
                                </>
                            }
                        />
                    </Card>
                ))}
                <div ref={messageEndRef} />
            </div>

            {/* Input Section */}
            <Form
                onFinish={handleSubmit}
                layout="inline"
                autoComplete="off"
                initialValues={{ message: "" }}
                className="flex items-center mt-4"
            >  <Form.Item
                name="message"
                rules={[{ required: true, message: "Please type a message!" }]}
                className="!flex-1 !m-0"
            >
                    <Input
                        className="!w-full mr-2 !rounded-sm !rounded-e-none"
                        placeholder="Type your message"
                        size="large"
                    />
                </Form.Item>
                <Form.Item>
                    <Button className="!rounded-sm !rounded-s-none" htmlType="submit" type="primary" size="large">
                        Send
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
}