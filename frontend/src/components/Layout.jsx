import React, { useState, useEffect } from 'react';
import { Navbar, Container, Nav, Button, Spinner } from 'react-bootstrap';
import { Outlet, Link, useLocation } from 'react-router-dom';
import api from '../api';
import { useNotification } from '../NotificationContext';

const Layout = ({ handleLogout }) => {
    const [userRole, setUserRole] = useState(null);
    const location = useLocation();
    const { showNotification } = useNotification();

    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const response = await api.get('/users/me');
                setUserRole(response.data.role);
                localStorage.setItem('role', response.data.role);
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    handleLogout();
                } else {
                    showNotification('Błąd połączenia z serwerem.', 'danger');
                }
            }
        };
        fetchUserRole();
    }, [handleLogout, showNotification]);

    if (!userRole) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} />
            </div>
        );
    }

    return (
        <>
            <Navbar style={{ backgroundColor: 'var(--card-bg)' }} variant="dark" expand="md" className="shadow mb-4">
                <Container fluid className="px-4 px-xxl-5">
                    <Navbar.Brand as={Link} to="/" className="ms-1" style={{ color: 'var(--accent-hover)', fontWeight: 'bold', fontSize: '1.4rem' }}>
                        🏠 Smart Building 
                    </Navbar.Brand>
                    
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    
                    <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
                        <div className="d-flex align-items-center mt-3 mt-md-0">
                            <Nav.Link as={Link} to="/users/me" className={`me-4 ${location.pathname === '/users/me' ? 'active fw-bold text-info' : 'text-light'}`}>
                                Profil
                            </Nav.Link>
                            <span className="me-4 text-muted d-none d-lg-block" style={{ fontSize: '0.9rem' }}>
                                Rola: <strong className="text-white">{userRole}</strong>
                            </span>
                            <Button variant="outline-danger" size="sm" onClick={handleLogout}>Wyloguj</Button>
                        </div>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            
            <Container fluid className="px-4 px-md-5 pb-5" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <Outlet />
            </Container>
        </>
    );
};

export default Layout;