import { Button, Space, Table } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";

export default function SpareRequest() {

    return (
        <Table
            title={() => (
                <div className="flex items-center justify-between border-none tracking-wider uppercase text-slate-700">
                    <h2 className="text-lg font-bold">Spare Request</h2>
                </div>)
            }
            columns={[
                {
                    title: 'Request ID',
                    dataIndex: 'requestId',
                    key: 'requestId',
                },
                {
                    title: 'Item Name',
                    dataIndex: 'itemName',
                    key: 'itemName',
                },
                {
                    title: 'Quantity',
                    dataIndex: 'quantity',
                    key: 'quantity',
                },
                {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                },
                {
                    title: 'Action',
                    key: 'action',
                    width: 150,
                    fixed: 'right',
                    render: (text, record) => (
                        <Space.Compact block className="!w-max">
                            <Button disabled={record.status === "Approved"} className="!text-green-500 hover:text-green-700 cursor-pointer">
                                <CheckOutlined />
                            </Button>
                            <Button disabled={record.status === "Approved"} className="!text-red-500 hover:text-red-700 cursor-pointer">
                                <CloseOutlined />
                            </Button>
                        </Space.Compact>
                    ),
                },
            ]}
            dataSource={[
                {
                    key: '1',
                    requestId: 'REQ001',
                    itemName: 'Laptop Battery',
                    quantity: 2,
                    status: 'Pending',
                },
                {
                    key: '2',
                    requestId: 'REQ002',
                    itemName: 'Monitor Stand',
                    quantity: 5,
                    status: 'Approved',
                },
            ]}
            pagination
        />
    );
}