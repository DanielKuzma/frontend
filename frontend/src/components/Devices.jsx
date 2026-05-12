import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Spinner, Alert, Button, Modal, Form, Badge } from 'react-bootstrap';
import api from '../api';

const Devices = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // --- NOWOŚĆ: Stan na rolę użytkownika ---
    const [userRole, setUserRole] = useState('');
    
    const [showModal, setShowModal] = useState(false);
    const [newDevice, setNewDevice] = useState({
        name: '',
        deviceType: 'LIGHT', 
        deviceStatus: 'OFF', 
        properties: ''
    });
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, [roomId]);

    // --- NOWOŚĆ: Pobieramy rolę i urządzenia na starcie ---
    const fetchInitialData = async () => {
        try {
            // Pytamy "Kim jestem?"
            const userResponse = await api.get('/users/me');
            setUserRole(userResponse.data.role);

            // Pobieramy urządzenia dla danego pokoju
            const devicesResponse = await api.get(`/devices/rooms/${roomId}`);
            setDevices(devicesResponse.data);
            
            setLoading(false);
        } catch (err) {
            setError('Nie udało się pobrać danych z serwera.');
            setLoading(false);
        }
    };

    const fetchDevicesOnly = async () => {
        try {
            const response = await api.get(`/devices/rooms/${roomId}`);
            setDevices(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddDevice = async (e) => {
        e.preventDefault();
        setActionError('');
        try {
            const payload = { ...newDevice, roomId: parseInt(roomId) };
            await api.post('/devices', payload);
            
            setShowModal(false);     
            setNewDevice({ name: '', deviceType: 'LIGHT', deviceStatus: 'OFF', properties: '' });      
            fetchDevicesOnly();            
        } catch (err) {
            setActionError('Wystąpił błąd podczas dodawania urządzenia. Sprawdź uprawnienia.');
        }
    };

    const handleDeleteDevice = async (id) => {
        if (!window.confirm('Usunąć to urządzenie?')) return;
        try {
            await api.delete(`/devices/${id}`);
            fetchDevicesOnly();
        } catch (err) {
            alert('Błąd usuwania (może brak uprawnień ADMIN?).');
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const nextStatus = (currentStatus === 'ON') ? 'OFF' : 'ON';
        try {
            await api.patch(`/devices/${id}?deviceStatus=${nextStatus}`);
            fetchDevicesOnly();
        } catch (err) {
            alert('Nie udało się zmienić statusu urządzenia.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewDevice(prev => ({ ...prev, [name]: value }));
    };

    const getStatusBadgeVariant = (status) => {
        switch(status) {
            case 'ON': return 'info';
            case 'OFF': return 'secondary';
            case 'ERROR': return 'danger';
            case 'OFFLINE': return 'warning';
            default: return 'secondary';
        }
    };

    // --- LOGIKA UPRAWNIEŃ (zgodna z Twoim backendem Javy) ---
    const canAddDevice = userRole === 'ADMIN' || userRole === 'BUILDING_MANAGER';
    const canDeleteDevice = userRole === 'ADMIN';

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <div>
            <Button variant="outline-secondary" className="mb-3" onClick={() => navigate('/rooms')}>
                &larr; Wróć do listy pokoi
            </Button>
            
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Urządzenia w pokoju (ID: {roomId})</h2>
                
                {/* Przycisk dodawania tylko dla ADMIN i BUILDING_MANAGER */}
                {canAddDevice && (
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                        + Dodaj Urządzenie
                    </Button>
                )}
            </div>

            {actionError && <Alert variant="danger">{actionError}</Alert>}
            
            {devices.length === 0 ? (
                <p style={{ color: 'var(--text-sub)' }}>Brak urządzeń w tym pomieszczeniu.</p>
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {devices.map((device) => (
                        <Col key={device.id}>
                            <Card className="h-100 shadow" style={{ borderLeft: device.deviceStatus === 'ON' ? '4px solid var(--accent-cyan)' : '4px solid gray' }}>
                                <Card.Body className="d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <Card.Title style={{ color: 'var(--accent-hover)' }}>{device.name}</Card.Title>
                                        <Badge bg={getStatusBadgeVariant(device.deviceStatus)}>
                                            {device.deviceStatus}
                                        </Badge>
                                    </div>
                                    
                                    <div style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }} className="mb-4">
                                        <p className="mb-1"><strong>Typ:</strong> {device.deviceType}</p>
                                        <p className="mb-1"><strong>Szczegóły:</strong> {device.properties || 'Brak'}</p>
                                    </div>

                                    <div className="mt-auto d-flex justify-content-between align-items-center">
                                        <Button 
                                            variant={device.deviceStatus === 'ON' ? 'warning' : 'success'} 
                                            size="sm" 
                                            onClick={() => toggleStatus(device.id, device.deviceStatus)}
                                            disabled={device.deviceStatus === 'OFFLINE'} 
                                        >
                                            {device.deviceStatus === 'ON' ? 'Wyłącz' : 'Włącz'}
                                        </Button>
                                        
                                        {/* Przycisk usuwania TYLKO dla ADMINA */}
                                        {canDeleteDevice && (
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteDevice(device.id)}>Usuń</Button>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Modal dodawania urządzenia (zostaje bez zmian) */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <div style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)' }}>
                    <Modal.Header closeButton closeVariant="white" style={{ borderBottomColor: '#3A475C' }}>
                        <Modal.Title>Nowe Urządzenie</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleAddDevice}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nazwa (np. Główne światło, Zamek w drzwiach)</Form.Label>
                                <Form.Control type="text" name="name" required value={newDevice.name} onChange={handleChange} />
                            </Form.Group>
                            
                            <Row>
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Typ Urządzenia</Form.Label>
                                        <Form.Select name="deviceType" value={newDevice.deviceType} onChange={handleChange} style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}>
                                            <option value="LIGHT">Światło (LIGHT)</option>
                                            <option value="HEATER">Grzejnik (HEATER)</option>
                                            <option value="AIR_CONDITIONER">Klimatyzator (AIR_CONDITIONER)</option>
                                            <option value="FAN">Wentylator (FAN)</option>
                                            <option value="BLINDS">Rolety (BLINDS)</option>
                                            <option value="LOCK">Zamek (LOCK)</option>
                                            <option value="OUTLET">Gniazdko (OUTLET)</option>
                                            <option value="SPEAKER">Głośnik (SPEAKER)</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Początkowy status</Form.Label>
                                        <Form.Select name="deviceStatus" value={newDevice.deviceStatus} onChange={handleChange} style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}>
                                            <option value="OFF">Wyłączone (OFF)</option>
                                            <option value="ON">Włączone (ON)</option>
                                            <option value="OFFLINE">Offline (OFFLINE)</option>
                                            <option value="ERROR">Błąd (ERROR)</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-4">
                                <Form.Label>Szczegóły / Konfiguracja (opcjonalnie)</Form.Label>
                                <Form.Control type="text" name="properties" placeholder="np. MAC: 00:1B:44:11:3A:B7" value={newDevice.properties} onChange={handleChange} />
                            </Form.Group>

                            <div className="d-flex justify-content-end">
                                <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>Anuluj</Button>
                                <Button variant="primary" type="submit">Dodaj urządzenie</Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </div>
            </Modal>
        </div>
    );
};

export default Devices;