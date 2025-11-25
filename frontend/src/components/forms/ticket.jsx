import { Modal, Form, Input, Select, Button, Row, Col } from "antd";
import { useEffect } from "react";

export default function TicketForm({
    handleClose, handleSubmit, currentData
}) {
    const [antdForm] = Form.useForm();

    const handleFormSubmit = () => {
        antdForm.validateFields().then((values) => {
            const formData = new FormData();
            formData.append("picture", values.picture[0]); // Append file separately
            // Append all fields (including file)
            Object.keys(values).forEach((key) => {
                if (values[key] !== undefined) {
                    formData.append(key, values[key]);
                }
            });
            handleSubmit(formData);
        });
    };

    useEffect(() => {
        if (currentData) {
            antdForm.setFieldsValue({
                ticketCode: currentData.ticketCode,
                customerName: currentData.customerName,
                controllerNo: currentData.controllerNo,
                head: currentData.head,
                imei: currentData.imei,
                hp: currentData.hp,
                motorType: currentData.motorType,
                state: currentData.state,
                district: currentData.district,
                village: currentData.village,
                block: currentData.block,
                complaintType: currentData.complaintType,
                faultCode: currentData.faultCode,
                description: currentData.description,
            });
        } else {
            antdForm.setFieldsValue({
                ticketCode: `TID-${Math.floor(Math.random() * 1000000)}`,
            });
        }
    }, [currentData, antdForm]);

    return (

        <Form
            className="!p-10 !bg-white !rounded-lg !shadow-md"
            form={antdForm}
            onSubmitCapture={handleFormSubmit}
            layout="vertical"
            initialValues={currentData}
            onValuesChange={(changedValues, allValues) => antdForm.setFieldsValue(allValues)}
        >
            <Row gutter={[16, 16]} justify={"start"}>
                <Col span={6}>
                    <Form.Item
                        label="Ticket Code"
                        name="ticketCode"
                        rules={[{ required: true, message: "Ticket Code is required" }]}
                    >
                        <Input disabled placeholder="Enter Ticket Code" />
                    </Form.Item>
                </Col>
                <Col span={6} >
                    <Form.Item
                        label="Customer Name"
                        name="customerName"
                        rules={[{ required: true, message: "Customer Name is required" }]}
                    >
                        <Input placeholder="Enter Customer Name" />
                    </Form.Item>
                </Col>
                <Col span={6} >
                    <Form.Item
                        label="Controller No"
                        name="controllerNo"
                        rules={[{ required: true, message: "Controller No is required" }]}
                    >
                        <Input placeholder="Enter Controller No" />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item label="Head" name="head">
                        <Input placeholder="Enter Head No" />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item label="IMEI" name="imei">
                        <Input placeholder="Enter IMEI No" />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item label="HP" name="hp">
                        <Input placeholder="Enter HP Name" />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item label="Motor Type" name="motorType">
                        <Select placeholder="Select Motor Type">
                            <Select.Option value="AC">AC</Select.Option>
                            <Select.Option value="DC">DC</Select.Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item
                        label="State"
                        name="state"
                        rules={[{ required: true, message: "State is required" }]}
                    >
                        <Input placeholder="Enter State" />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item
                        label="District"
                        name="district"
                        rules={[{ required: true, message: "District is required" }]}
                    >
                        <Input placeholder="Enter District" />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item label="Village" name="village">
                        <Input placeholder="Enter Village" />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item label="Block" name="block">
                        <Input placeholder="Enter Block" />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item
                        label="Complaint Type"
                        name="complaintType"
                        rules={[{ required: true, message: "Complaint Type is required" }]}
                    >
                        <Select placeholder="Select Complaint Type">
                            <Select.Option value="motor-not-running">Motor Not Running</Select.Option>
                            <Select.Option value="low-water-discharge">Low Water Discharge</Select.Option>
                            <Select.Option value="external-system-damage">
                                External System Damage
                            </Select.Option>
                            <Select.Option value="controller-not-on">Controller Not ON</Select.Option>
                            <Select.Option value="others">Others</Select.Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item
                        label="Fault Code"
                        name="faultCode"
                        rules={[{ required: true, message: "Fault Code is required" }]}
                    >
                        <Input placeholder="Enter Fault Code" />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item label="Description" name="description">
                        <Input.TextArea placeholder="Enter details about the issue" rows={3} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Attachment" name="picture">
                        <Input type="file" accept="image/*" />
                    </Form.Item>
                </Col>
            </Row>
           
            <Button key="cancel" onClick={handleClose}>
                Close
            </Button>,
            <Button key="submit" type="primary" onClick={handleFormSubmit}>
                {currentData ? "Update" : "Submit"}
            </Button>,
        </Form>
    );
}