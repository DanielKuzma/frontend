import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Outlet, Link } from 'react-router-dom';

const Layout = ({ handleLogout }) => {
    return (
        <>
            {/* Górny pasek nawigacji dopasowany do Twojego ciemnego motywu */}
            <Navbar style={{ backgroundColor: 'var(--card-bg)' }} variant="dark" expand="lg" className="shadow mb-4">
                <Container>
                    <Navbar.Brand as={Link} to="/" style={{ color: 'var(--accent-hover)', fontWeight: 'bold' }}>
                        Smart Building 
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                            <Nav className="me-auto">
                                <Nav.Link as={Link} to="/rooms">Pokoje</Nav.Link>
                                <Nav.Link as={Link} to="/devices">Wszystkie Urządzenia</Nav.Link> {/* <--- NOWY LINK */}
                                <Nav.Link as={Link} to="/users/me">Mój Profil</Nav.Link>
                                <Nav.Link as={Link} to="/sensors">Czujniki</Nav.Link>
                                <Nav.Link as={Link} to="/users">Zarządzanie Użytkownikami</Nav.Link>
                            </Nav>
                        <Button variant="outline-danger" onClick={handleLogout}>Wyloguj</Button>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            
            {/* Główny kontener, w którym będą się ładować poszczególne podstrony */}
            <Container>
                <Outlet />
            </Container>
        </>
    );
};

export default Layout;