import React, { useState } from 'react';
import { login } from '../../lib/features/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Input, Button, Typography, Alert, Card, Spin } from 'antd';
import { Navigate, NavLink } from 'react-router-dom';
import { LoadingOutlined } from '@ant-design/icons';
const { Title } = Typography;

const LoginPage = () => {
    const dispatch = useDispatch();
    const { user, isAuthenticated,loading } = useSelector((state) => state.auth);
    const [form] = Form.useForm();
    const [error, setError] = useState('');

    const handleSubmit = async (values) => {
        try {
 
            dispatch(login(values));
            // Redirect or handle successful login
        } catch (err) {
            setError('Invalid phone or password');
        }
    };
 if(isAuthenticated && user) {
    switch (user?.role) {
        case "ADMIN":
            return <Navigate to="/admin" />;
        case "USER":
            return <Navigate to="/user" />;
        case "TECHNICAL_USER":
            return <Navigate to="/technical-user" />;
        default:
            return <div>Invalid role</div>;
    }
}
    
    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
            <Card style={{
                maxWidth: 400,
                minWidth: 400,
            }} title="Login" size="md" className="rounded shadow p-5 bg-light">
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{ phone: '', password: '' }}
            >
                <Form.Item
                    label="Phone"
                    name="phone"
                    rules={[
                        { required: true, message: 'Please input your phone!' },
                        { type: 'phone', message: 'Please enter a valid phone!' },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Password"
                    name="password"
                    rules={[{ required: true, message: 'Please input your password!' }]}
                >
                    <Input.Password />
                </Form.Item>
                {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
                <Form.Item>
                    <Button type="primary" htmlType="submit" >
                        Login
                            {loading && <Spin style={{
                                color: 'white',
                                marginLeft: '10px',
                            }} indicator={<LoadingOutlined spin />} size="small" />}
                    </Button>
                    <Button style={{ marginLeft: '10px' }} type="link" >
                        <NavLink to="/register" >
                            Register
                        </NavLink>
                    </Button>
                </Form.Item>
            </Form>
            </Card>
        </div>
    );
};

export default LoginPage;
