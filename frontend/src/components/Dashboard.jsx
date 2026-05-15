import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Dashboard = () => {
    const navigate = useNavigate();
    const [username] = useState(localStorage.getItem('username') || 'Użytkowniku');
    const [userRole] = useState(localStorage.getItem('role') || 'RESIDENT'); 
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ rooms: '-', devices: '-', automations: '-' });

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            const requests = [api.get('/rooms'), api.get('/devices')];
            if (userRole !== 'RESIDENT') requests.push(api.get('/automation/rules'));

            const results = await Promise.allSettled(requests);
            setStats({
                rooms: results[0].status === 'fulfilled' ? results[0].value.data.length : '0',
                devices: results[1].status === 'fulfilled' ? results[1].value.data.length : '0',
                automations: userRole === 'RESIDENT' ? null : (results[2]?.status === 'fulfilled' ? results[2].value.data.length : '0')
            });
            setLoading(false);
        };
        fetchStats();
    }, [userRole]);

    const navModules = [
        { title: 'Pokoje', desc: 'Zarządzanie strefami', icon: '🚪', path: '/rooms', roles: ['ADMIN', 'BUILDING_MANAGER', 'RESIDENT'] },
        { title: 'Urządzenia', desc: 'Kontrola sprzętu', icon: '🔌', path: '/devices', roles: ['ADMIN', 'BUILDING_MANAGER', 'RESIDENT'] },
        { title: 'Czujniki', desc: 'Podgląd odczytów', icon: '🌡️', path: '/sensors', roles: ['ADMIN', 'BUILDING_MANAGER', 'RESIDENT'] },
        { title: 'Automatyzacje', desc: 'Logika systemu', icon: '⚙️', path: '/automations', roles: ['ADMIN', 'BUILDING_MANAGER'] },
        { title: 'Harmonogramy', desc: 'Planowanie zadań', icon: '📅', path: '/schedules', roles: ['ADMIN', 'BUILDING_MANAGER'] },
        { title: 'Logi', desc: 'Historia zdarzeń', icon: '📋', path: '/logs', roles: ['ADMIN', 'BUILDING_MANAGER'] },
        { title: 'Użytkownicy', desc: 'Uprawnienia', icon: '👥', path: '/users', roles: ['ADMIN'] }
    ].filter(m => m.roles.includes(userRole));

    return (
        <div className="mt-4 container-main-view">
            <div className="main-card-container shadow border-0 p-4">
                
                {/* 1. Powitanie */}
                <div className="mb-5">
                    <h2 className="fw-bold mb-2" style={{ color: 'var(--accent-cyan)' }}>Witaj, {username}</h2>
                </div>

                {/* 2. Nawigacja kafelkowa (Menu) */}
                <h4 className="mb-4 fw-bold" style={{ color: 'var(--text-main)' }}>Menu nawigacyjne</h4>
                <Row className="g-4 mb-5">
                    {navModules.map((m, i) => (
                        <Col key={i} xs={12} sm={6} md={4}>
                            <Card 
                                onClick={() => navigate(m.path)}
                                className="h-100 border-0 nav-tile-card shadow-sm" 
                                style={{ backgroundColor: 'var(--bg-color)', border: '1px solid #334155', borderRadius: '20px', cursor: 'pointer' }}
                            >
                                <Card.Body className="d-flex align-items-center p-4">
                                    <div className="me-4 d-flex justify-content-center align-items-center shadow-sm" style={{ width: '56px', height: '56px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '1.8rem' }}>
                                        {m.icon}
                                    </div>
                                    <div>
                                        <h5 className="fw-bold mb-1" style={{ color: 'var(--accent-cyan)' }}>{m.title}</h5>
                                        <p className="mb-0 small text-muted">{m.desc}</p>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                <hr style={{ borderColor: '#334155', marginBottom: '40px' }} />

                {/* 3. Nagłówek statystyk i Liczniki */}
                <div className="mb-4">
                    <h4 className="fw-bold" style={{ color: 'var(--text-main)' }}>Oto aktualny stan budynku</h4>
                </div>
                <Row className="mb-5 g-4 text-center">
                    <Col md={userRole === 'RESIDENT' ? 6 : 4}>
                        <div className="p-3 shadow-sm h-100" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid #334155', borderRadius: '15px' }}>
                            <h6 className="text-uppercase small fw-bold mb-2" style={{ color: 'var(--text-sub)' }}>Pomieszczenia</h6>
                            <h2 className="display-5 fw-bold" style={{ color: 'var(--accent-hover)' }}>{loading ? <Spinner size="sm" animation="border" /> : stats.rooms}</h2>
                        </div>
                    </Col>
                    <Col md={userRole === 'RESIDENT' ? 6 : 4}>
                        <div className="p-3 shadow-sm h-100" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid #334155', borderRadius: '15px' }}>
                            <h6 className="text-uppercase small fw-bold mb-2" style={{ color: 'var(--text-sub)' }}>Urządzenia</h6>
                            <h2 className="display-5 fw-bold" style={{ color: 'var(--accent-hover)' }}>{loading ? <Spinner size="sm" animation="border" /> : stats.devices}</h2>
                        </div>
                    </Col>
                    {userRole !== 'RESIDENT' && (
                        <Col md={4}>
                            <div className="p-3 shadow-sm h-100" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid #334155', borderRadius: '15px' }}>
                                <h6 className="text-uppercase small fw-bold mb-2" style={{ color: 'var(--text-sub)' }}>Aktywne Reguły</h6>
                                <h2 className="display-5 fw-bold" style={{ color: 'var(--accent-hover)' }}>{loading ? <Spinner size="sm" animation="border" /> : stats.automations}</h2>
                            </div>
                        </Col>
                    )}
                </Row>

                <hr style={{ borderColor: '#334155', marginBottom: '40px' }} />

                {/* 4. Sekcja informacyjna */}
                <h4 className="mb-4 fw-bold" style={{ color: 'var(--text-main)' }}>O systemie</h4>
                <Row className="mb-2 g-4">
                    <Col md={4}>
                        <Card className="h-100 border-0 p-2 shadow-sm" style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)', border: '1px solid #334155' }}>
                            <Card.Body>
                                <Badge bg="primary" className="mb-2">Zarządzanie</Badge>
                                <h5 className="fw-bold text-white">Pokoje i Piętra</h5>
                                <Card.Text className="small text-muted">Monitoruj warunki i steruj oświetleniem w poszczególnych strefach budynku.</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="h-100 border-0 p-2 shadow-sm" style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)', border: '1px solid #334155' }}>
                            <Card.Body>
                                <Badge bg="info" className="mb-2 text-dark">Inteligencja</Badge>
                                <h5 className="fw-bold text-white">Inteligentne Reguły</h5>
                                <Card.Text className="small text-muted">Automatyzuj zachowania urządzeń na podstawie odczytów z Twoich czujników.</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="h-100 border-0 p-2 shadow-sm" style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)', border: '1px solid #334155' }}>
                            <Card.Body>
                                <Badge bg="success" className="mb-2">Planowanie</Badge>
                                <h5 className="fw-bold text-white">Harmonogramy</h5>
                                <Card.Text className="small text-muted">Zaplanuj cykliczne zadania, aby budynek sam dbał o oszczędność energii.</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

            </div>
        </div>
    );
};

export default Dashboard;

// wykresy 