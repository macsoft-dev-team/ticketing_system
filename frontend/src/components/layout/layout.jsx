import { useEffect } from 'react';
import { Button, Col, Layout, Menu, Popover, Row, Typography } from 'antd';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
const logo = "/macsoft-logo.png";
import { logout } from '../../lib/features/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import useCrud from '../../lib/hooks/useCrud';
import socket from "../../lib/socket/socket";
import moment from 'moment';
import useNotification from '../../lib/hooks/useNotification';
const { Header, Content } = Layout;

const AppLayout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { notifications, updateNotificationStatus } = useNotification();
   
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

    if (user?.role === "TECHNICAL_USER") {
        items.push({
            label: (
                <NavLink
                    to="spare-request"
                    className={({ isActive }) =>
                        isActive ? 'menu-link active-link' : 'menu-link'
                    }
                >
                    Spare Request
                </NavLink>
            ),
            key: 'spare-request',
        });
    }


    const markAsRead = (id) => {
        updateNotificationStatus(id, { seen: true });
    };


    const content = (
        <div className='w-96 max-h-96 overflow-y-auto *:p-2 *:max-h-20 flex flex-col divide-y divide-gray-200'>
            {notifications.length > 0 ? notifications?.map((notification) => (
                <div className={`grid grid-flow-row ${notification.seen ? "bg-inherit" : " bg-gray-100"} `} key={notification?.notification?.id}>
                    <h1 className='uppercase text-cyan-800'>{notification?.notification?.title}</h1>
                    <h2>{notification?.notification?.description}</h2>
                    <footer>
                        <div className='flex justify-between items-center'>
                            <small className='text-gray-500'>{moment(notification?.notification?.createdAt).format(moment.HTML5_FMT.DATETIME_LOCAL_SECONDS)}</small>
                            {notification?.seen ? <small className='text-gray-500'>Seen</small> :
                             <Button rootClassName='!uppercase !text-xs !text-gray-500' type="text" size="small" onClick={() => markAsRead(notification.id)}>
                                <small>Mark as Read</small>
                            </Button>}
                        </div>
                    </footer>
                </div>
            )) : (
                <div className='flex items-center justify-center p-2'>
                    <Typography.Text type="secondary">No Notifications</Typography.Text>
                </div>
            )}
        </div>
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
                    <Col md={10}>
                        <Menu theme='dark' mode="horizontal" items={items} itemactivebg="bg-secondary" />
                    </Col>
                    <Col style={{ marginLeft: "auto", color: 'white', fontWeight: 'bold', fontSize: '18px', padding: '0 20px' }}>
                        <Popover placement="bottomRight" title={
                            <div className='flex items-center justify-between border-b border-gray-200'>
                                <Typography.Text strong>Notifications</Typography.Text>
                                <Button type="text"  size="small">Clear All</Button>
                            </div>
                        } content={content}>
                            <Button
                                size='small'
                                className='relative'
                            >
                                <i className="fa-solid fa-bell"></i>
                                <span className='h-5 w-5 rounded-full bg-stone-800 text-white absolute -top-2 -start-4 flex justify-center items-center'>
                                    {notifications.filter(notification => !notification.seen).length}
                                </span>
                            </Button>
                        </Popover>
                        <Button
                            size='small'
                            type='text'
                            style={{
                                color: 'white',
                            }}
                        >
                            {user?.name}
                            <span className="text-xs text-gray-400">({user?.role})</span>
                        </Button>
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
            <Content>
                <div className="site-layout-content !overflow-hidden mt-16 fixed w-full" style={{ padding: '5px', minHeight: "100vh" }}>
                    <Outlet />
                </div>
            </Content>
        </Layout>
    );
};

export default AppLayout;
