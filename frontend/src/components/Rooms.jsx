import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Alert, Button, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Rooms = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // --- NOWOŚĆ: Stan przechowujący rolę zalogowanego użytkownika ---
    const [userRole, setUserRole] = useState(''); 
    
    const [showModal, setShowModal] = useState(false);
    const [newRoom, setNewRoom] = useState({
        name: '',
        description: '',
        floor: 0,
        areaInSquareM: 0.0
    });
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    // --- NOWOŚĆ: Pobieramy dane o użytkowniku ORAZ listę pokoi ---
    const fetchInitialData = async () => {
        try {
            // Najpierw pytamy backend "Kim jestem?"
            const userResponse = await api.get('/users/me');
            setUserRole(userResponse.data.role);

            // Potem pobieramy pokoje
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
        setActionError('');
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
        } catch (err) {
            setActionError('Wystąpił błąd podczas dodawania pokoju.');
        }
    };

    const handleDeleteRoom = async (id) => {
        if (!window.confirm('Czy na pewno chcesz usunąć ten pokój?')) return;
        setActionError('');
        try {
            await api.delete(`/rooms/${id}`);
            fetchRoomsOnly();
        } catch (err) {
            setActionError('Wystąpił błąd podczas usuwania pokoju.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewRoom(prev => ({ ...prev, [name]: value }));
    };

    // --- NOWOŚĆ: Funkcja sprawdzająca czy user może zarządzać ---
    const canManage = userRole === 'ADMIN' || userRole === 'BUILDING_MANAGER';

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Zarządzanie Pomieszczeniami</h2>
                
                {/* Ukrywamy przycisk jeśli użytkownik nie ma uprawnień */}
                {canManage && (
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                        + Dodaj Pokój
                    </Button>
                )}
            </div>

            {actionError && <Alert variant="danger" onClose={() => setActionError('')} dismissible>{actionError}</Alert>}
            
            {rooms.length === 0 ? (
                <p style={{ color: 'var(--text-sub)' }}>Baza danych jest pusta. Brak pomieszczeń.</p>
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {rooms.map((room) => (
                        <Col key={room.id}>
                            <Card className="h-100 shadow">
                                <Card.Body className="d-flex flex-column">
                                    <Card.Title style={{ color: 'var(--accent-hover)' }} className="mb-3">
                                        {room.name}
                                    </Card.Title>
                                    
                                    <div style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }} className="mb-3 flex-grow-1">
                                        <p className="mb-1"><strong>Opis:</strong> {room.description || 'Brak opisu'}</p>
                                        <p className="mb-1"><strong>Piętro:</strong> {room.floor}</p>
                                        <p className="mb-1"><strong>Metraż:</strong> {room.areaInSquareM} m²</p>
                                    </div>

                                    <div className="mt-auto d-flex justify-content-between">
                                        <Button 
                                            variant="outline-info" 
                                            size="sm" 
                                            onClick={() => navigate(`/devices/rooms/${room.id}`)}
                                        >
                                            Urządzenia
                                        </Button>
                                        {/* Ukrywamy przycisk USUŃ jeśli użytkownik nie ma uprawnień */}
                                        {canManage && (
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteRoom(room.id)}>Usuń</Button>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Modal - ten kod zostaje bez zmian */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <div style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)' }}>
                    <Modal.Header closeButton closeVariant="white" style={{ borderBottomColor: '#3A475C' }}>
                        <Modal.Title>Nowe Pomieszczenie</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleAddRoom}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nazwa pokoju</Form.Label>
                                <Form.Control type="text" name="name" required value={newRoom.name} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Opis (opcjonalnie)</Form.Label>
                                <Form.Control as="textarea" rows={2} name="description" value={newRoom.description} onChange={handleChange} />
                            </Form.Group>
                            <Row>
                                <Col>
                                    <Form.Group className="mb-4">
                                        <Form.Label>Piętro</Form.Label>
                                        <Form.Control type="number" name="floor" required value={newRoom.floor} onChange={handleChange} />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group className="mb-4">
                                        <Form.Label>Powierzchnia (m²)</Form.Label>
                                        <Form.Control type="number" step="0.1" name="areaInSquareM" required value={newRoom.areaInSquareM} onChange={handleChange} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <div className="d-flex justify-content-end">
                                <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>Anuluj</Button>
                                <Button variant="primary" type="submit">Zapisz pokój</Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </div>
            </Modal>
        </div>
    );
};

export default Rooms;