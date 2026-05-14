import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Dashboard = () => {
    const navigate = useNavigate();
    const [username] = useState(localStorage.getItem('username') || 'Użytkowniku');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        rooms: '-',
        devices: '-',
        automations: '-'
    });

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            // Używamy allSettled, aby błąd w jednej statystyce (np. brak uprawnień) 
            // nie blokował wyświetlania pozostałych
            const results = await Promise.allSettled([
                api.get('/rooms'),
                api.get('/devices'),
                api.get('/automation/rules')
            ]);

            setStats({
                rooms: results[0].status === 'fulfilled' ? results[0].value.data.length : '0',
                devices: results[1].status === 'fulfilled' ? results[1].value.data.length : '0',
                automations: results[2].status === 'fulfilled' ? results[2].value.data.length : 'Niedostępne'
            });
            setLoading(false);
        };
        fetchStats();
    }, []);

    const actionCards = [
        {
            title: 'Pokoje i Piętra',
            desc: 'Monitoruj warunki i steruj oświetleniem w poszczególnych strefach budynku.',
            link: '/rooms',
            badge: 'Zarządzanie',
            variant: 'primary'
        },
        {
            title: 'Inteligentne Reguły',
            desc: 'Automatyzuj zachowania urządzeń na podstawie odczytów z Twoich czujników.',
            link: '/automations',
            badge: 'Logika',
            variant: 'info'
        },
        {
            title: 'Harmonogramy',
            desc: 'Zaplanuj cykliczne zadania, aby budynek sam dbał o oszczędność energii.',
            link: '/schedules',
            badge: 'Planowanie',
            variant: 'success'
        }
    ];

    return (
        <div className="mt-4 container-main-view">
            <div className="main-card-container shadow border-0 p-4">
                
                {/* Górna sekcja: Powitanie */}
                <div className="d-flex justify-content-between align-items-end mb-5">
                    <div>
                        <h1 className="fw-bold mb-1" style={{ color: 'var(--accent-cyan)' }}>Dzień dobry, {username}</h1>
                        <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>
                            Wszystkie systemy budynku są aktywne.
                        </p>
                    </div>
                    <Badge bg="dark" className="border border-secondary px-3 py-2 fw-normal">
                        Status: Online
                    </Badge>
                </div>

                {/* Sekcja Statystyk */}
                <Row className="g-4 mb-5">
                    {[
                        { label: 'Pomieszczenia', val: stats.rooms, sub: 'Zarejestrowane jednostki' },
                        { label: 'Urządzenia', val: stats.devices, sub: 'Aktywne moduły sterujące' },
                        { label: 'Automatyzacje', val: stats.automations, sub: 'Reguły systemowe' }
                    ].map((s, i) => (
                        <Col md={4} key={i}>
                            <div className="p-4 h-100" style={{ 
                                backgroundColor: 'rgba(30, 41, 59, 0.5)', 
                                border: '1px solid #334155', 
                                borderRadius: '20px' 
                            }}>
                                <h6 className="text-uppercase small fw-bold mb-3" style={{ color: 'var(--accent-hover)', letterSpacing: '1px' }}>
                                    {s.label}
                                </h6>
                                <div className="d-flex align-items-baseline gap-2">
                                    <h2 className="display-4 fw-bold mb-0" style={{ color: '#fff' }}>
                                        {loading ? <Spinner animation="border" size="sm" /> : s.val}
                                    </h2>
                                </div>
                                <p className="small text-muted mt-2 mb-0">{s.sub}</p>
                            </div>
                        </Col>
                    ))}
                </Row>

                <h4 className="mb-4 fw-bold" style={{ color: 'var(--text-main)' }}>Szybki dostęp</h4>

                {/* Sekcja Akcji */}
                <Row className="g-4">
                    {actionCards.map((card, i) => (
                        <Col md={4} key={i}>
                            <Card 
                                onClick={() => navigate(card.link)}
                                className="h-100 border-0 dashboard-action-card p-2" 
                                style={{ 
                                    backgroundColor: 'var(--bg-color)', 
                                    border: '1px solid #334155',
                                    cursor: 'pointer'
                                }}
                            >
                                <Card.Body>
                                    <Badge bg={card.variant} className="mb-3 px-3 py-2 text-dark fw-bold">
                                        {card.badge}
                                    </Badge>
                                    <h5 className="fw-bold mb-3" style={{ color: 'var(--accent-cyan)' }}>
                                        {card.title}
                                    </h5>
                                    <Card.Text style={{ color: 'var(--text-sub)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                        {card.desc}
                                    </Card.Text>
                                    <div className="mt-3 text-info small fw-bold">
                                        Przejdź do modułu &rarr;
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
};

export default Dashboard;