import { Avatar, Button, Card } from "antd";
import moment from "moment";
import { EditOutlined, SettingOutlined, MessageOutlined } from "@ant-design/icons";


export default function TicketCard({ loading, actions, ticket, HandleChat }) {
    return (
        <Card
            loading={loading}
            actions={[
                <EditOutlined key="edit" />,
                <SettingOutlined key="setting" />,
                <HandleChat data={ticket} />
            ] }
            style={{ minWidth: "100%", maxWidth: "100%" }}
            key={ticket.id}
        >
            <Card.Meta
                avatar={<Avatar src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${ticket.id}`} />}
                title={`${ticket.ticketCode}-(${ticket.customerName})`}
                description={
                    <div>
                        <p>
                            <strong>Controller No:</strong> {ticket?.controllerNo}
                        </p>
                        <p>
                            <strong>Fault Code:</strong> {ticket?.faultCode}
                        </p>
                        <p>
                            <strong>State:</strong> {ticket?.state}
                        </p>
                        <p>
                            <strong className="">Complaint:</strong>
                            {ticket?.complaintType}
                        </p>
                        <p>
                            <strong className="text-dark ">Details:</strong>
                            {ticket?.description}
                        </p>
                        <p>
                            {ticket?.createdAt && (
                                <small className="text-muted">
                                    Created At: {moment(ticket?.createdAt).format("DD/MM/YYYY")}
                                </small>
                            )}
                        </p>
                    </div>
                }
            />
        </Card>
    );
}