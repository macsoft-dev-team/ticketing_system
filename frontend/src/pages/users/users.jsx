import { Table, Button, Pagination, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import useCrud from "../../lib/hooks/useCrud";

export default function Users() {

    const { data, currentData, show, setCurrentData, setModal } = useCrud("user");
    const { Search } = Input;
    const onSearch = (value) => {
        console.log(value);
    }

    const onShowSizeChange = (current, pageSize) => {
        console.log(current, pageSize);
    };
    return (
        <section>
            <Table
                columns={[
                    {
                        title: "Name",
                        dataIndex: "name",
                        key: "name",
                    },
                    {
                        title: "Phone",
                        dataIndex: "phone",
                        key: "phone",
                    },
                    {
                        title: "Role",
                        dataIndex: "role",
                        key: "role",
                    },
                ]}
                dataSource={data}
                rowKey="id"
                loading={false}
                size="small"
                className="!rounded-lg !shadow-md !bg-white"
                style={{
                    width: "100%",
                    margin: "0",
                    color: "#001529",
                    textTransform: "uppercase",
                }}
                title={() => (
                    <div className="flex justify-between items-center px-5">
                        <h2 className="text-lg font-semibold tracking-wider">Users</h2>
                        <Search
                            placeholder="Search Users"
                            allowClear
                            onSearch={onSearch}
                            style={{ width: 300 }}
                            className="!rounded-lg  mx-5 !bg-white"
                        />
                        <Button
                            className="!ms-auto"
                            variant="dashed"
                            color="cyan"
                            onClick={() => {
                                // Handle create user action here
                            }}
                        >
                            CREATE USER
                            <PlusOutlined />
                        </Button>
                    </div>
                )}
            />
        </section>
    );
}