import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Badge, Card, Toast, ToastContainer } from 'react-bootstrap';
import api from '../api';

const Sensors = () => {
    const [sensors, setSensors] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [devices, setDevices] = useState([]);
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

    useEffect(() => {
        fetchSensors();
        fetchRooms();
        fetchDevices();
    }, []);

    const fetchSensors = async () => {
        try {
            const response = await api.get('/sensors');
            // Zabezpieczenie: upewniamy się, że response.data to tablica
            if (Array.isArray(response.data)) {
                setSensors(response.data);
            } else {
                console.error("Backend nie zwrócił listy czujników!", response.data);
                setSensors([]); 
            }
        } catch (error) {
            console.error("Błąd pobierania czujników", error);
            setSensors([]);
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
        if (window.confirm("Na pewno usunąć ten czujnik?")) {
            try {
                await api.delete(`/sensors/${id}`);
                fetchSensors();
                setToastVariant('info');
                setToastMessage("Czujnik został usunięty.");
                setShowToast(true);
            } catch (error) {
                setToastVariant('danger');
                setToastMessage("Błąd usuwania! Sprawdź konsolę.");
                setShowToast(true);
            }
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await api.patch(`/sensors/${id}`);
            fetchSensors(); 
            setToastVariant('success');
            setToastMessage("Status został zmieniony.");
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

            // Sprawdzamy, czy Java zwróciła nam listę (Array) i czy ta lista nie jest pusta
            if (Array.isArray(response.data) && response.data.length > 0) {
                // Pobieramy OSTATNI element z listy (najnowszy odczyt)
                const latestReading = response.data[response.data.length - 1];
                
                setToastVariant('primary');
                // Sprawdzamy czy ma pole value, czy valueText (w zależności co wysłała Java)
                setToastMessage(`Najnowszy odczyt: ${latestReading.value !== null ? latestReading.value : latestReading.valueText}`);
                setShowToast(true);
            } 
            // Zabezpieczenie dla innych formatów (gdyby Java jednak wysłała pojedynczy obiekt)
            else if (response.data && !Array.isArray(response.data) && response.data.value !== undefined) {
                setToastVariant('primary');
                setToastMessage(`Odczyt czujnika: ${response.data.value}`);
                setShowToast(true);
            } 
            // Jeśli lista jest pusta
            else {
                setToastVariant('info');
                setToastMessage("Ten czujnik nie zarejestrował jeszcze żadnych odczytów.");
                setShowToast(true);
            }
        } catch (error) {
            console.error("Szczegóły błędu odczytu:", error);
            setToastVariant('danger');
            setToastMessage("Błąd pobierania odczytu z serwera.");
            setShowToast(true);
        }
    };

    return (
        <>
            <Card className="bg-dark text-white p-4 mt-4 shadow-lg">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>🎛️ Zarządzanie Czujnikami</h2>
                    <Button variant="success" onClick={() => setShowModal(true)}>
                        + Dodaj Czujnik
                    </Button>
                </div>

                <Table striped bordered hover variant="dark">
                    <thead>
                        <tr>
                            <th>Nazwa</th>
                            <th>Typ</th>
                            <th>Pokój</th>
                            <th>Powiązane Urządzenie</th>
                            <th>Jednostka/Stan</th>
                            <th>Status</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sensors.map(sensor => (
                            <tr key={sensor.id}>
                                <td>{sensor.name}</td>
                                <td>
                                    <Badge bg="info">
                                        {/* Obsługa różnych nazw pól z backendu */}
                                        {sensor.type || sensor.sensorType || 'N/A'}
                                    </Badge>
                                </td>
                                <td>{sensor.room ? sensor.room.name : '---'}</td>
                                <td>
                                    {/* Sprawdzamy pole deviceName lub obiekt device */}
                                    {sensor.deviceName || (sensor.device && sensor.device.name) || 'Brak'}
                                </td>
                                <td><Badge bg="warning" text="dark">{sensor.unit}</Badge></td>
                                <td>
                                    {sensor.enabled ? (
                                        <Badge bg="success">Włączony</Badge>
                                    ) : (
                                        <Badge bg="secondary">Wyłączony</Badge>
                                    )}
                                </td>
                                <td>
                                    <Button variant="outline-light" size="sm" className="me-2" onClick={() => handleGetReading(sensor.id)}>
                                        Odczyt
                                    </Button>
                                    <Button variant={sensor.enabled ? "outline-warning" : "outline-success"} size="sm" className="me-2" onClick={() => handleToggleStatus(sensor.id)}>
                                        Zmień
                                    </Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(sensor.id)}>
                                        Usuń
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

                <Modal show={showModal} onHide={() => setShowModal(false)} data-bs-theme="dark" className="text-white">
                    <Modal.Header closeButton>
                        <Modal.Title>Dodaj Nowy Czujnik</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleAddSensor}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nazwa Czujnika</Form.Label>
                                <Form.Control 
                                    required 
                                    type="text" 
                                    placeholder="np. Czujnik drzwi salon"
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
                                        else if (val === 'DOOR_WINDOW') unit = 'LOCK/UNLOCK';
                                        else if (val === 'MOTION') unit = 'ON/OFF';
                                        setNewSensor({...newSensor, type: val, unit: unit});
                                    }}
                                >
                                    <option value="">-- Wybierz typ --</option>
                                    <option value="TEMPERATURE">Temperatura (°C)</option>
                                    <option value="HUMIDITY">Wartość procentowa (%)</option>
                                    <option value="MOTION">Włącznik (ON/OFF)</option>
                                    <option value="DOOR_WINDOW">Zamek/Blokada (LOCK/UNLOCK)</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Pokój</Form.Label>
                                <Form.Select 
                                    required 
                                    value={newSensor.roomId} 
                                    onChange={(e) => setNewSensor({...newSensor, roomId: e.target.value, deviceName: ''})}
                                >
                                    <option value="">-- Wybierz pokój --</option>
                                    {rooms.map(room => (
                                        <option key={room.id} value={room.id}>{room.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Powiązane Urządzenie</Form.Label>
                                <Form.Select 
                                    required 
                                    value={newSensor.deviceName} 
                                    onChange={(e) => setNewSensor({...newSensor, deviceName: e.target.value})}
                                    disabled={!newSensor.roomId}
                                >
                                    <option value="">-- Musisz wybrać urządzenie --</option>
                                    {devices
                                        .filter(d => d.room && d.room.id.toString() === newSensor.roomId.toString())
                                        .map(d => (
                                            <option key={d.id} value={d.name}>{d.name} ({d.deviceType})</option>
                                        ))
                                    }
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Jednostka (automatyczna)</Form.Label>
                                <Form.Control 
                                    value={newSensor.unit} 
                                    readOnly 
                                    disabled 
                                    style={{ backgroundColor: '#2b3035', color: '#fff' }} 
                                />
                            </Form.Group>

                            <Button 
                                variant="success" 
                                type="submit" 
                                className="w-100" 
                                disabled={!newSensor.name || !newSensor.type || !newSensor.roomId || !newSensor.deviceName}
                            >
                                Zapisz Czujnik
                            </Button>
                        </Form>
                    </Modal.Body>
                </Modal>
            </Card>

            <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 9999 }}>
                <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg={toastVariant}>
                    <Toast.Header>
                        <strong className="me-auto">System</strong>
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
