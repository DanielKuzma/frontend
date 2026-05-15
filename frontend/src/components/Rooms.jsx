import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Alert, Button, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useNotification } from '../NotificationContext';

const Rooms = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState(''); 
    const [showModal, setShowModal] = useState(false);
    
    // NOWE: Stan dla modala potwierdzającego usunięcie
    const [deleteConfirmInfo, setDeleteConfirmInfo] = useState({ show: false, id: null });

    const [newRoom, setNewRoom] = useState({
        name: '', description: '', floor: 0, areaInSquareM: 0.0
    });
    
    const { showNotification } = useNotification();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const userResponse = await api.get('/users/me');
            setUserRole(userResponse.data.role);
            const roomsResponse = await api.get('/rooms');
            setRooms(roomsResponse.data);
            setLoading(false);
        } catch (err) {
            setError('Nie udało się pobrać danych z serwera.');
            setLoading(false);
        }
    };

    const fetchRoomsOnly = async () => {
        try {
            const response = await api.get('/rooms');
            setRooms(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddRoom = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: newRoom.name,
                description: newRoom.description,
                floor: parseInt(newRoom.floor, 10),
                areaInSquareM: parseFloat(newRoom.areaInSquareM)
            };
            await api.post('/rooms', payload);
            setShowModal(false);     
            setNewRoom({ name: '', description: '', floor: 0, areaInSquareM: 0.0 });      
            fetchRoomsOnly();            
            showNotification('Pomyślnie dodano nowe pomieszczenie.', 'success');
        } catch (err) {
            if (err.response && err.response.status === 409) {
                showNotification('Pomieszczenie o takiej nazwie już istnieje! Wybierz inną.', 'warning');
            } else {
                showNotification('Wystąpił błąd podczas dodawania pokoju. Sprawdź połączenie.', 'danger');
            }
        }
    };

    // ZMODYFIKOWANA FUNKCJA: Teraz tylko wysyła żądanie po potwierdzeniu w modalu
    const executeDeleteRoom = async () => {
        if (!deleteConfirmInfo.id) return;
        try {
            await api.delete(`/rooms/${deleteConfirmInfo.id}`);
            fetchRoomsOnly();
            showNotification('Pomieszczenie zostało pomyślnie usunięte.', 'success');
        } catch (err) {
            showNotification('Wystąpił błąd podczas usuwania pokoju.', 'danger');
        } finally {
            setDeleteConfirmInfo({ show: false, id: null });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewRoom(prev => ({ ...prev, [name]: value }));
    };

    const canManage = userRole === 'ADMIN' || userRole === 'BUILDING_MANAGER';

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} className="d-block mx-auto mt-5" />;
    if (error) return <Alert variant="danger" className="mt-4 container-main-view">{error}</Alert>;

    return (
        <div className="mt-4 container-main-view">
            <div className="main-card-container shadow border-0 p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="section-title mb-0">Zarządzanie Pomieszczeniami</h2>
                    {canManage && (
                        <Button variant="primary" onClick={() => setShowModal(true)}>
                            + Dodaj Pokój
                        </Button>
                    )}
                </div>

                {rooms.length === 0 ? (
                    <p className="text-center py-5" style={{ color: 'var(--text-sub)' }}>
                        Baza danych jest pusta. Brak pomieszczeń.
                    </p>
                ) : (
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {rooms.map((room) => (
                            <Col key={room.id}>
                                <Card 
                                    style={{ 
                                        backgroundColor: 'var(--bg-color)', 
                                        border: '1px solid var(--accent-hover)' 
                                    }} 
                                    className="h-100 shadow-sm transition-hover"
                                >
                                    <Card.Body className="d-flex flex-column p-4">
                                        <Card.Title style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem' }} className="fw-bold mb-3">
                                            {room.name}
                                        </Card.Title>
                                        
                                        <div style={{ color: 'var(--text-sub)', fontSize: '0.95rem' }} className="mb-4 flex-grow-1">
                                            <p className="mb-2"><strong style={{ color: '#fff' }}>Opis:</strong> {room.description || 'Brak opisu'}</p>
                                            <p className="mb-2"><strong style={{ color: '#fff' }}>Piętro:</strong> {room.floor}</p>
                                            <p className="mb-0"><strong style={{ color: '#fff' }}>Metraż:</strong> {room.areaInSquareM} m²</p>
                                        </div>

                                        <div className="mt-auto d-flex justify-content-between gap-2">
                                            <Button 
                                                variant="primary" 
                                                size="sm" 
                                                className="flex-grow-1 fw-bold"
                                                onClick={() => navigate(`/rooms/${room.id}/devices`)}
                                            >
                                                Urządzenia
                                            </Button>
                                            {canManage && (
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm" 
                                                    onClick={() => setDeleteConfirmInfo({ show: true, id: room.id })}
                                                >
                                                    Usuń
                                                </Button>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            {/* Modal dodawania pokoju */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <div style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', borderRadius: '12px', border: '1px solid var(--accent-hover)' }}>
                    <Modal.Header closeButton closeVariant="white" className="border-secondary">
                        <Modal.Title>Nowe Pomieszczenie</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Form onSubmit={handleAddRoom}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nazwa pokoju</Form.Label>
                                <Form.Control 
                                    type="text" name="name" placeholder="np. Salon..." 
                                    required value={newRoom.name} onChange={handleChange} 
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Opis (opcjonalnie)</Form.Label>
                                <Form.Control 
                                    as="textarea" rows={2} name="description" value={newRoom.description} onChange={handleChange} 
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                />
                            </Form.Group>
                            <Row>
                                <Col>
                                    <Form.Group className="mb-4">
                                        <Form.Label>Piętro</Form.Label>
                                        <Form.Control 
                                            type="number" name="floor" required value={newRoom.floor} onChange={handleChange} 
                                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group className="mb-4">
                                        <Form.Label>Powierzchnia (m²)</Form.Label>
                                        <Form.Control 
                                            type="number" step="0.1" name="areaInSquareM" required value={newRoom.areaInSquareM} onChange={handleChange} 
                                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <div className="d-flex justify-content-end gap-2">
                                <Button variant="secondary" onClick={() => setShowModal(false)}>Anuluj</Button>
                                <Button variant="primary" type="submit" className="fw-bold px-4">Zapisz pokój</Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </div>
            </Modal>

            {/* MODAL POTWIERDZENIA USUNIĘCIA */}
            <Modal show={deleteConfirmInfo.show} onHide={() => setDeleteConfirmInfo({ show: false, id: null })} centered size="sm">
                <div style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', borderRadius: '12px', border: '1px solid var(--accent-hover)' }}>
                    <Modal.Body className="p-4 text-center">
                        <div className="mb-3">
                            <span style={{ fontSize: '3rem' }}>⚠️</span>
                        </div>
                        <h5 className="fw-bold mb-3 text-danger">Usuń pomieszczenie</h5>
                        <p className="text-muted" style={{ fontSize: '0.95rem' }}>
                            Czy na pewno chcesz usunąć ten pokój? Usunięcie pokoju może wpłynąć na przypisane do niego urządzenia.
                        </p>
                        <div className="d-flex justify-content-center gap-2 mt-4">
                            <Button variant="secondary" onClick={() => setDeleteConfirmInfo({ show: false, id: null })}>
                                Anuluj
                            </Button>
                            <Button variant="danger" className="fw-bold" onClick={executeDeleteRoom}>
                                Tak, usuń
                            </Button>
                        </div>
                    </Modal.Body>
                </div>
            </Modal>
        </div>
    );
};

export default Rooms;