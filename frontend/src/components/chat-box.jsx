import { Card, Avatar, Input, Button, Form } from "antd";
import moment from "moment";
import { CloseOutlined } from "@ant-design/icons";

export default function ChatBox({ loading, ticket, conversation,handleClose }) {
    console.log(conversation, "ChatBox Conversation");

    const CardTitle = () => {
        return (
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Avatar
                        src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${ticket?.id}`}
                    />
                    <h2 className="text-lg font-semibold">{ticket?.ticketCode}</h2>
                </div>
                <Button onClick={handleClose}  icon={<CloseOutlined />}/>
             </div>

        );
            }
    return (
        <Card className="p-4 flex flex-col justify-between">
            <Card.Meta
                title={<CardTitle />}
                description={
                    <p className="text-gray-600">
                        {ticket?.description}
                    </p>
                }
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
                            avatar={
                                <Avatar
                                    src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${msg.sender.name}`}
                                />
                            }
                            title={msg.sender.name}
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
            </div>

            {/* Input Section */}
            <Form className="flex items-center mt-4">
                <Input
                    className="flex-1 mr-2 !rounded-sm !rounded-e-none"
                    placeholder="Type your message"
                    size="large"
                />
                <Button className="!rounded-sm !rounded-s-none" type="primary" size="large">
                    Send
                </Button>
            </Form>
        </Card>
    );
}