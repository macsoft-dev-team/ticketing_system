import React, { useState } from "react";
import { Form, Input, Button, Card, message, Spin,} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { register } from "../../lib/features/authSlice";
import { useNavigate } from "react-router-dom";
import { LoadingOutlined } from "@ant-design/icons";

export default function RegisterUser() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [error, setError] = useState({});
    const dispatch = useDispatch();
    const { user, isAuthenticated,loading ,error: dataError} = useSelector((state) => state.auth);

    const handleSubmit = async (values) => {
        try {
            console.log("Form Submitted:", values);

            const result = await dispatch(register(values)).unwrap(); // .unwrap() for Redux Toolkit
            console.log("Registration Result:", result);
            
            message.success(result.message || "Registration successful. Please login.");
            navigate("/login"); 
            form.resetFields();
        } catch (error) {
            message.error(`${error?.code} - ${error?.message}` || "Registration failed. Please try again.");
        }
    };
    

    return (
        <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh"}}>
             <Card style={{
                maxWidth: 400,
                minWidth: 400,
            }} title="Register" size="md" className="rounded shadow p-5 bg-light">
                 <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    onFinishFailed={(errorInfo) => {
                        setError(errorInfo.errorFields.reduce((acc, field) => {
                            acc[field.name[0]] = field.errors[0];
                            return acc;
                        }, {}));
                    }}
                >
                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[{ required: true, message: "Name is required" }]}
                    >
                        <Input placeholder="Enter Full Name" />
                    </Form.Item>
                    {error.name && <div className="text-danger"><small>{error.name}</small></div>}

                    <Form.Item
                        label="Phone No"
                        name="phone"
                        rules={[{ required: true, message: "Phone No is required" }]}
                    >
                        <Input placeholder="Enter Phone No" />
                    </Form.Item>
                    {error.phoneNo && <div className="text-danger"><small>{error.phoneNo}</small></div>}

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[{ required: true, message: "Password is required" }]}
                    >
                        <Input.Password placeholder="Enter Password" />
                    </Form.Item>
                    {error.password && <div className="text-danger"><small>{error.password}</small></div>}

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="w-full">
                            Register
                            {loading && <Spin style={{
                                color: 'white',
                                marginLeft: '10px',
                            }} indicator={<LoadingOutlined spin />} size="small" />}

                        </Button>
                        <Button type="link" href="/login" className="w-100 mt-2">
                            Already have an account? Login
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
         </div>
    );
}