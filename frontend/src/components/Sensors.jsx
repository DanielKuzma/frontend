import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Badge, Card, Toast, ToastContainer, Spinner } from 'react-bootstrap';
import api from '../api';

const Sensors = () => {
    const [sensors, setSensors] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Stany dla powiadomień Toast
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');

    const [newSensor, setNewSensor] = useState({
        name: '',
        type: '', 
        roomId: '',
        deviceName: '',
        unit: ''
    });

    // 1. Pierwsze ładowanie danych (czujniki, pokoje, urządzenia)
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await Promise.all([fetchSensors(), fetchRooms(), fetchDevices()]);
            setLoading(false);
        };
        loadInitialData();
    }, []);

    // 2. NOWOŚĆ: Automatyczne odświeżanie (Polling) co 3 sekundy
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchSensors(); // Odświeżamy tylko listę czujników, by widzieć nowe statusy/odczyty
        }, 3000);

        // Czyszczenie interwału przy wyjściu z komponentu
        return () => clearInterval(intervalId);
    }, []);

    const fetchSensors = async () => {
        try {
            const response = await api.get('/sensors');
            if (Array.isArray(response.data)) {
                setSensors(response.data);
            }
        } catch (error) {
            console.error("Błąd pobierania czujników", error);
        }
    };

    const fetchRooms = async () => {
        try {
            const response = await api.get('/rooms');
            setRooms(response.data);
        } catch (error) {
            console.error("Błąd pobierania pokoi", error);
        }
    };

    const fetchDevices = async () => {
        try {
            const response = await api.get('/devices');
            setDevices(response.data);
        } catch (error) {
            console.error("Błąd pobierania urządzeń", error);
        }
    };

    const handleAddSensor = async (e) => {
        e.preventDefault();
        try {
            await api.post('/sensors', newSensor);
            setShowModal(false);
            fetchSensors();
            setNewSensor({ name: '', type: '', roomId: '', deviceName: '', unit: '' });
            
            setToastVariant('success');
            setToastMessage("Pomyślnie dodano nowy czujnik!");
            setShowToast(true);
        } catch (error) {
            setToastVariant('danger');
            setToastMessage("Błąd podczas dodawania czujnika.");
            setShowToast(true);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Na pewno usunąć ten czujnik? Spowoduje to usunięcie jego historii odczytów.")) {
            try {
                await api.delete(`/sensors/${id}`);
                fetchSensors();
                setToastVariant('info');
                setToastMessage("Czujnik został usunięty.");
                setShowToast(true);
            } catch (error) {
                setToastVariant('danger');
                setToastMessage("Błąd usuwania! Sprawdź uprawnienia.");
                setShowToast(true);
            }
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await api.patch(`/sensors/${id}`);
            fetchSensors(); 
            setToastVariant('success');
            setToastMessage("Status czujnika został zmieniony.");
            setShowToast(true);
        } catch (error) {
            setToastVariant('danger');
            setToastMessage("Błąd zmiany statusu.");
            setShowToast(true);
        }
    };

    const handleGetReading = async (id) => {
        try {
            const response = await api.get(`/sensors/readings/${id}`);
            console.log("Dane odczytu z backendu:", response.data);

            // Sprawdzamy czy dostaliśmy tablicę odczytów (zgodnie z poprawką w Java List<SensorReading>)
            if (Array.isArray(response.data) && response.data.length > 0) {
                const latest = response.data[response.data.length - 1];
                setToastVariant('primary');
                setToastMessage(`Najnowszy odczyt: ${latest.value !== null ? latest.value : latest.valueText}`);
                setShowToast(true);
            } 
            else {
                setToastVariant('info');
                setToastMessage("Ten czujnik nie zarejestrował jeszcze żadnych odczytów.");
                setShowToast(true);
            }
        } catch (error) {
            setToastVariant('danger');
            setToastMessage("Błąd pobierania odczytu z serwera.");
            setShowToast(true);
        }
    };

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} className="d-block mx-auto mt-5" />;

    return (
        <>
            <Card className="bg-dark text-white p-4 mt-4 shadow-lg border-0">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 style={{ color: 'var(--accent-hover)' }}>🎛️ Zarządzanie Czujnikami</h2>
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                        + Dodaj Czujnik
                    </Button>
                </div>

                <Table striped bordered hover variant="dark" responsive>
                    <thead>
                        <tr>
                            <th>Nazwa</th>
                            <th>Typ</th>
                            <th>Pokój</th>
                            <th>Powiązane Urządzenie</th>
                            <th>Jednostka</th>
                            <th>Status</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sensors.map(sensor => (
                            <tr key={sensor.id}>
                                <td className="fw-bold">{sensor.name}</td>
                                <td>
                                    <Badge bg="info">
                                        {sensor.type || sensor.sensorType || 'N/A'}
                                    </Badge>
                                </td>
                                <td>{sensor.room ? sensor.room.name : '---'}</td>
                                <td>
                                    {sensor.deviceName || (sensor.device && sensor.device.name) || 'Brak'}
                                </td>
                                <td><Badge bg="warning" text="dark">{sensor.unit}</Badge></td>
                                <td>
                                    {sensor.enabled ? (
                                        <Badge bg="success">Włączony (Aktywny)</Badge>
                                    ) : (
                                        <Badge bg="secondary">Wyłączony</Badge>
                                    )}
                                </td>
                                <td>
                                    <Button variant="outline-light" size="sm" className="me-2" onClick={() => handleGetReading(sensor.id)}>
                                        Odczyt
                                    </Button>
                                    <Button 
                                        variant={sensor.enabled ? "outline-warning" : "outline-success"} 
                                        size="sm" 
                                        className="me-2" 
                                        onClick={() => handleToggleStatus(sensor.id)}
                                    >
                                        {sensor.enabled ? 'Dezaktywuj' : 'Aktywuj'}
                                    </Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(sensor.id)}>
                                        Usuń
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

                {sensors.length === 0 && <p className="text-center text-muted mt-3">Brak zarejestrowanych czujników w systemie.</p>}
            </Card>

            {/* Modal dodawania czujnika */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <div style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)' }}>
                    <Modal.Header closeButton closeVariant="white">
                        <Modal.Title>Dodaj Nowy Czujnik</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleAddSensor}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nazwa Czujnika</Form.Label>
                                <Form.Control 
                                    required 
                                    type="text" 
                                    placeholder="np. Termometr Salon"
                                    value={newSensor.name} 
                                    onChange={(e) => setNewSensor({...newSensor, name: e.target.value})} 
                                />
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                                <Form.Label>Typ działania</Form.Label>
                                <Form.Select 
                                    required
                                    value={newSensor.type} 
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        let unit = '';
                                        if (val === 'TEMPERATURE') unit = '°C';
                                        else if (val === 'HUMIDITY') unit = '%';
                                        else if (val === 'MOTION') unit = 'ON/OFF';
                                        else if (val === 'DOOR_WINDOW') unit = 'LOCK/UNLOCK';
                                        setNewSensor({...newSensor, type: val, unit: unit});
                                    }}
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
                                >
                                    <option value="">-- Wybierz typ --</option>
                                    <option value="TEMPERATURE">Temperatura (°C)</option>
                                    <option value="HUMIDITY">Wilgotność (%)</option>
                                    <option value="MOTION">Ruch (ON/OFF)</option>
                                    <option value="DOOR_WINDOW">Otwarcie (LOCK/UNLOCK)</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Pokój</Form.Label>
                                <Form.Select 
                                    required 
                                    value={newSensor.roomId} 
                                    onChange={(e) => setNewSensor({...newSensor, roomId: e.target.value, deviceName: ''})}
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
                                >
                                    <option value="">-- Wybierz pokój --</option>
                                    {rooms.map(room => (
                                        <option key={room.id} value={room.id}>{room.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Powiązane Urządzenie (w wybranym pokoju)</Form.Label>
                                <Form.Select 
                                    required 
                                    value={newSensor.deviceName} 
                                    onChange={(e) => setNewSensor({...newSensor, deviceName: e.target.value})}
                                    disabled={!newSensor.roomId}
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
                                >
                                    <option value="">-- Wybierz urządzenie --</option>
                                    {devices
                                        .filter(d => d.room && d.room.id.toString() === newSensor.roomId.toString())
                                        .map(d => (
                                            <option key={d.id} value={d.name}>{d.name} ({d.deviceType})</option>
                                        ))
                                    }
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label>Jednostka (przypisana automatycznie)</Form.Label>
                                <Form.Control 
                                    value={newSensor.unit} 
                                    readOnly 
                                    disabled 
                                    className="bg-secondary text-white"
                                />
                            </Form.Group>

                            <Button 
                                variant="success" 
                                type="submit" 
                                className="w-100 fw-bold" 
                                disabled={!newSensor.name || !newSensor.type || !newSensor.roomId || !newSensor.deviceName}
                            >
                                Zapisz Czujnik
                            </Button>
                        </Form>
                    </Modal.Body>
                </div>
            </Modal>

            <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 9999 }}>
                <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg={toastVariant}>
                    <Toast.Header>
                        <strong className="me-auto">System Smart Building</strong>
                    </Toast.Header>
                    <Toast.Body className={(toastVariant === 'success' || toastVariant === 'danger' || toastVariant === 'primary') ? 'text-white' : 'text-dark'}>
                        {toastMessage}
                    </Toast.Body>
                </Toast>
            </ToastContainer>
        </>
    );
};

export default Sensors;