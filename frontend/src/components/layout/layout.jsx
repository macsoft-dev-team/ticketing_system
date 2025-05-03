import React, { useState } from 'react';
import { Button, Col, Flex, Layout, Menu, Popover, Row, Splitter, Typography } from 'antd';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import logo from "../../assets/macsoft-logo.png";
import { logout } from '../../lib/features/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import useCrud from '../../lib/hooks/useCrud';

const { Header, Content } = Layout;

const AppLayout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { data } = useCrud("notification");
    const items = [
        {
            label: (
                <NavLink
                    to="tickets"
                    className={({ isActive }) =>
                        isActive ? 'menu-link active-link' : 'menu-link'
                    }
                >
                    Tickets
                </NavLink>
            ),
            key: 'tickets',
        },
    ];

    if (user?.role === "ADMIN") {
        items.push({
            label: (
                <NavLink
                    to="users"
                    className={({ isActive }) =>
                        isActive ? 'menu-link active-link' : 'menu-link'
                    }
                >
                    Users
                </NavLink>
            ),
            key: 'users',
        });
    }
    const Desc = props => (
        <Flex justify="center" align="center" style={{
            maxHeight: "100px",
        }} >
            <Typography.Title type="secondary" level={5} style={{ whiteSpace: 'nowrap' }}>
                {props.text}
            </Typography.Title>
        </Flex>
    );
    const content = (
        <Splitter layout="vertical" style={{ height: 200, boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
           {data?.map((notification) => (
                <Splitter.Panel key={notification.id} style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>
                    <Desc text={notification.message} />
                </Splitter.Panel>
            ))}           
        </Splitter>
    );

    return (
        <Layout>
            <Header style={{ position: 'fixed', zIndex: 1, width: '100%', margin: '0', backgroundColor: '#001529', padding: '0 2px' }}>
                <Row>
                    <Col style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', padding: '0 20px' }}>
                        <Row>
                            <Col style={{
                                width: "25px",
                            }}>
                                <img
                                    src={logo}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        marginRight: "10px",
                                    }}
                                    alt="Macsoft Logo"
                                    className="border-0"

                                />
                            </Col>
                            <Col style={{
                                fontSize: "20px",
                                padding: "0 5px",
                            }}>
                                <NavLink to="tickets" className="navbar-brand text-decoration-none fw-bold " style={{ color: 'white' }}>
                                    Macsoft
                                </NavLink>
                            </Col>
                        </Row>
                    </Col>
                    <Col md={16}>
                        <Menu theme='dark' mode="horizontal" items={items} itemactivebg="bg-secondary" />
                    </Col>
                    <Col style={{marginLeft:"auto", color: 'white', fontWeight: 'bold', fontSize: '18px', padding: '0 20px' }}>
                        
                        <Popover placement="bottomRight" title={"Notifications"} content={content}>
                            <Button
                                size='small'
                            >
                                <i className="fa-solid fa-bell"></i>
                            </Button>
                        </Popover>
                        <Button
                            size='small'
                            type='text'
                            style={{
                                color: 'white',
                            }}
                        >{user?.name}</Button>
                        <Button
                            color="white"
                            variant='text'
                            style={{
                                color: 'white',
                            }}
                            onClick={() => {
                                dispatch(logout());
                                navigate("/login");
                            }} >
                            Logout
                        </Button>
                    </Col>
                </Row>
            </Header>
            <Content style={{ marginTop: 64 }}>
                <div className="site-layout-content" style={{ padding: '5px', minHeight: "100vh" }}>
                    <Outlet />
                </div>
            </Content>
        </Layout>
    );
};

export default AppLayout;
