import { DeleteOutlined, EyeOutlined, MessageOutlined, PlusOutlined, } from "@ant-design/icons";
import { Row, Button, Segmented, Splitter, Input, Empty, Typography, Spin, Select, Popconfirm, message } from "antd";
import TicketForm from "../../components/forms/ticket";
import TicketCard from "../../components/ticket-card";
import useConversation from "../../lib/hooks/conversation";
import { useDispatch, useSelector } from "react-redux";
import { fetchConversation } from "../../lib/features/conversationSlice";
import { useNavigate } from "react-router-dom";
import useTicket from "../../lib/hooks/useTicket";
const Tickets = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { data, currentData, loading, error, show, setShow, filter, setCurrentData, createItem, updateItem, deleteItem,setFilter, setData, updateStatus } = useTicket();
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
        if (user.role.toLowerCase() ==="user") return null;
        return (
            <Select
                className="min-w-26"
                key="status"
                disabled={data.data.status === "CLOSED"}
                loading={loading}
                defaultValue={data.data.status}
                options={[{ value: 'OPEN', label: 'OPEN' }, { value: 'CLOSED', label: 'CLOSED' }]}
                onChange={(value) => {
                    updateStatus(data.data.id, value);
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
                    navigate(`${user.role.toLowerCase() === "technical_user" ? '/technical-user/tickets/' + data.data?.id : "/" + user.role.toLowerCase() + '/tickets/' + data.data?.id}`);
                    setCurrentData(data.data);
                }}>
            </Button>
        )
    }

    const HandleDelete = (data) => {
        const confirm = e => {
                deleteItem(data.data.id);
            message.success('Ticket deleted successfully');
        };
        const cancel = e => {
             message.error('Ticket deletion cancelled');
          };

        if(user.role.toLowerCase() !== "admin") return null;

        return (
            <Popconfirm
                placement="topRight"
                title="Delete the ticket"
                description="Are you sure to delete this ticket?"
                onConfirm={confirm}
                onCancel={cancel}
                okText="Yes"
                cancelText="No"
            >
                <Button
                    key="delete"
                    disabled={chatWindow}
                
                type="text"
                icon={<DeleteOutlined />}
             >
            </Button>
            </Popconfirm>
        )
    }


    const onSearch = (value = {}) => {
        const updatedFilter = { ...filter };
             
        // Update status
        if (value.status) {            
            if (value.status) updatedFilter.status = value.status;
            else delete updatedFilter.status;
            
        }

        // Update search
        if (value.search) {
            if (value.search) updatedFilter.search = value.search;
            else delete updatedFilter.search;
         }

        setFilter(updatedFilter);
    };


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
        <section className="overflow-y-auto max-h-screen pb-20">
            <Row
                className="!px-6 !py-2 sticky top-0 z-50 bg-white flex flex-wrap items-center gap-2 shadow-sm"
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
                <Search placeholder="Search by Ticket id/Controller No" allowClear onSearch={(value) => onSearch({ search: value })} style={{ width: 300 }} />
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
                {data?.length === 0 && !loading ? (
                    <div className="flex items-center justify-center h-[400px] w-full">
                        <Empty description={<Typography.Text type="secondary">No Tickets Found</Typography.Text>} />
                    </div>
                ) : (
                    <Splitter layout="horizontal" style={{ height: "100%", width: "100%" }}>
                        <Splitter.Panel resizable={false}>
                            <div className={`grid gap-2 p-5 ${chatWindow ? "sm:grid-cols-2 " : "sm:grid-cols-4 "}`} wrap="true" gap="small" justify="space-evenly" style={{ margin: 0 }}>
                                {data?.map((ticket) => (
                                    <TicketCard key={ticket.id + "Ticket"} loading={loading} HandleEdit={HandleEdit} HandleChat={HandleChat} HandleDelete={HandleDelete} HandleStatus={HandleStatus} ticket={ticket} currentData={currentData} />
                                ))}

                            </div >
                        </Splitter.Panel>
                    </Splitter>
                )}
            </Row>


        </section>
    );
};

export default Tickets;