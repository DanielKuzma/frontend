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
                // Zapisujemy rolę do localStorage, żeby Dashboard też ją widział
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

    const isAdmin = userRole === 'ADMIN';
    const isManager = userRole === 'BUILDING_MANAGER';
    // Resident to każdy, kto nie jest adminem ani managerem (lub po prostu sprawdzenie roli)
    const isResident = userRole === 'RESIDENT';

    return (
        <>
            <Navbar style={{ backgroundColor: 'var(--card-bg)' }} variant="dark" expand="xl" className="shadow mb-4">
                <Container fluid className="px-4 px-xxl-5">
                    
                    <Navbar.Brand as={Link} to="/" className="ms-3" style={{ color: 'var(--accent-hover)', fontWeight: 'bold', fontSize: '1.4rem' }}>
                        Smart Building 
                    </Navbar.Brand>
                    
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="mx-auto" style={{ gap: '1rem' }}>
                            {/* Linki widoczne dla KAŻDEGO */}
                            <Nav.Link as={Link} to="/rooms" className={location.pathname.includes('/rooms') ? 'active fw-bold text-info' : ''}>Pokoje</Nav.Link>
                            <Nav.Link as={Link} to="/devices" className={location.pathname === '/devices' ? 'active fw-bold text-info' : ''}>Urządzenia</Nav.Link>
                            <Nav.Link as={Link} to="/sensors" className={location.pathname === '/sensors' ? 'active fw-bold text-info' : ''}>Czujniki</Nav.Link>
                            
                            {/* Automatyzacje - Ukryte dla Residenta */}
                            {(isAdmin || isManager) && (
                                <Nav.Link as={Link} to="/automations" className={location.pathname === '/automations' ? 'active fw-bold text-info' : ''}>Automatyzacje</Nav.Link>
                            )}
                            
                            {/* Harmonogramy i Logi - Tylko dla wyższych ról */}
                            {(isAdmin || isManager) && (
                                <>
                                    <Nav.Link as={Link} to="/schedules" className={location.pathname === '/schedules' ? 'active fw-bold text-info' : ''}>Harmonogramy</Nav.Link>
                                    <Nav.Link as={Link} to="/logs" className={location.pathname === '/logs' ? 'active fw-bold text-info' : ''}>Logi</Nav.Link>
                                </>
                            )}

                            {/* Użytkownicy - Tylko dla Admina */}
                            {isAdmin && (
                                <Nav.Link as={Link} to="/users" className={location.pathname === '/users' ? 'active fw-bold text-info' : ''}>Użytkownicy</Nav.Link>
                            )}
                        </Nav>
                        
                        <div className="d-flex align-items-center mt-3 mt-xl-0 me-3">
                            <Nav.Link as={Link} to="/users/me" className={`me-3 ${location.pathname === '/users/me' ? 'active fw-bold text-info' : 'text-light'}`}>
                                Profil
                            </Nav.Link>
                            <span className="me-3 text-muted d-none d-lg-block" style={{ fontSize: '0.85rem' }}>
                                Rola: <strong className="text-white">{userRole}</strong>
                            </span>
                            <Button variant="outline-danger" size="sm" onClick={handleLogout}>Wyloguj</Button>
                        </div>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            
            <Container fluid className="px-4 px-md-5" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <Outlet />
            </Container>
        </>
    );
};

export default Layout;