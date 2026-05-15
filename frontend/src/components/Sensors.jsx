import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Badge, Card, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // <-- DODANO IMPORT
import api from '../api';
import { useNotification } from '../NotificationContext';

const ALLOWED_SENSORS_FOR_DEVICE = {
    'LIGHT': ['MOTION'], 
    'HEATER': ['TEMPERATURE'], 
    'AIR_CONDITIONER': ['TEMPERATURE', 'HUMIDITY'],
    'FAN': ['TEMPERATURE', 'HUMIDITY'],
    'BLINDS': ['MOTION', 'DOOR_WINDOW'],
    'LOCK': ['DOOR_WINDOW'], 
    'OUTLET': ['TEMPERATURE', 'HUMIDITY', 'MOTION', 'DOOR_WINDOW'], 
    'SPEAKER': ['HUMIDITY']
};

const Sensors = () => {
    const [sensors, setSensors] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [deleteConfirmInfo, setDeleteConfirmInfo] = useState({ show: false, id: null });
    
    const navigate = useNavigate(); // <-- INICJALIZACJA NAWIGACJI
    const { showNotification } = useNotification();

    const [newSensor, setNewSensor] = useState({
        name: '',
        roomId: '',
        deviceName: '',
        type: '', 
        unit: ''
    });

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await Promise.all([fetchSensors(), fetchRooms(), fetchDevices()]);
            setLoading(false);
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchSensors();
        }, 3000);
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
            setNewSensor({ name: '', roomId: '', deviceName: '', type: '', unit: '' });
            showNotification("Pomyślnie dodano nowy czujnik!", "success");
        } catch (error) {
            showNotification("Błąd podczas dodawania czujnika.", "danger");
        }
    };

    const executeDelete = async () => {
        if (!deleteConfirmInfo.id) return;
        try {
            await api.delete(`/sensors/${deleteConfirmInfo.id}`);
            fetchSensors();
            showNotification("Czujnik został pomyślnie usunięty.", "info");
        } catch (error) {
            showNotification("Błąd usuwania! Sprawdź uprawnienia.", "danger");
        } finally {
            setDeleteConfirmInfo({ show: false, id: null });
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await api.patch(`/sensors/${id}`);
            fetchSensors(); 
            showNotification("Status czujnika został zmieniony.", "success");
        } catch (error) {
            showNotification("Błąd zmiany statusu.", "danger");
        }
    };

    const selectedDeviceObj = devices.find(d => 
        d.name === newSensor.deviceName && 
        d.room?.id.toString() === newSensor.roomId.toString()
    );
    const selectedDeviceType = selectedDeviceObj ? selectedDeviceObj.deviceType : null;
    const allowedSensors = selectedDeviceType ? ALLOWED_SENSORS_FOR_DEVICE[selectedDeviceType] || [] : [];

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} className="d-block mx-auto mt-5" />;

    return (
        <div className="mt-4 container-main-view">
            <div className="main-card-container shadow border-0 p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="section-title mb-0" style={{ color: 'var(--accent-cyan)' }}>Zarządzanie Czujnikami</h2>
                    <Button variant="primary" onClick={() => setShowModal(true)}>+ Dodaj Czujnik</Button>
                </div>

                <Table striped bordered hover variant="dark" responsive className="m-0 align-middle">
                    <thead>
                        <tr className="text-center">
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
                        {sensors.map(sensor => {
                            const displayType = (sensor.type === 'HUMIDITY' && sensor.device?.deviceType === 'SPEAKER') 
                                ? 'VOLUME' 
                                : (sensor.type || sensor.sensorType || 'N/A');

                            return (
                                <tr key={sensor.id}>
                                    <td className="fw-bold" style={{ color: 'var(--accent-hover)' }}>{sensor.name}</td>
                                    <td className="text-center">
                                        <Badge bg="info" text="dark">{displayType}</Badge>
                                    </td>
                                    <td className="text-center">{sensor.room ? sensor.room.name : '---'}</td>
                                    <td className="text-center">
                                        {sensor.deviceName || (sensor.device && sensor.device.name) || 'Brak'}
                                    </td>
                                    <td className="text-center"><Badge bg="secondary">{sensor.unit}</Badge></td>
                                    <td className="text-center">
                                        {sensor.enabled ? <Badge bg="success">Włączony</Badge> : <Badge bg="danger">Wyłączony</Badge>}
                                    </td>
                                    <td className="text-center">
                                        {/* --- ZMIANA: Przycisk przekierowuje do wykresu --- */}
                                        <Button 
                                            variant="outline-info" 
                                            size="sm" 
                                            className="me-2" 
                                            onClick={() => navigate(`/sensors/${sensor.id}/chart`)}
                                        >
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
                                        <Button variant="outline-danger" size="sm" onClick={() => setDeleteConfirmInfo({ show: true, id: sensor.id })}>
                                            Usuń
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>

                {sensors.length === 0 && <p className="text-center text-muted mt-4 mb-0">Brak zarejestrowanych czujników w systemie.</p>}
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <div style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', borderRadius: '12px', border: '1px solid var(--accent-hover)' }}>
                    <Modal.Header closeButton closeVariant="white" className="border-secondary">
                        <Modal.Title>Dodaj Nowy Czujnik</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Form onSubmit={handleAddSensor}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nazwa Czujnika</Form.Label>
                                <Form.Control 
                                    required type="text" placeholder="np. Termometr Salon"
                                    value={newSensor.name} onChange={(e) => setNewSensor({...newSensor, name: e.target.value})} 
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Pokój</Form.Label>
                                <Form.Select 
                                    required value={newSensor.roomId} 
                                    onChange={(e) => setNewSensor({ ...newSensor, roomId: e.target.value, deviceName: '', type: '', unit: '' })}
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                >
                                    <option value="">-- Wybierz pokój --</option>
                                    {rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Powiązane Urządzenie</Form.Label>
                                <Form.Select 
                                    required value={newSensor.deviceName} 
                                    onChange={(e) => {
                                        const selectedDevName = e.target.value;
                                        const devObj = devices.find(d => d.name === selectedDevName && d.room?.id.toString() === newSensor.roomId.toString());
                                        const devType = devObj ? devObj.deviceType : null;

                                        let autoType = '';
                                        let autoUnit = '';
                                        if (devType === 'SPEAKER') {
                                            autoType = 'HUMIDITY';
                                            autoUnit = '%';
                                        }

                                        setNewSensor({...newSensor, deviceName: selectedDevName, type: autoType, unit: autoUnit});
                                    }}
                                    disabled={!newSensor.roomId}
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                >
                                    <option value="">-- Wybierz urządzenie --</option>
                                    {devices
                                        .filter(d => d.room && d.room.id.toString() === newSensor.roomId.toString())
                                        .map(d => <option key={d.id} value={d.name}>{d.name} ({d.deviceType})</option>)
                                    }
                                </Form.Select>
                                {!newSensor.roomId && <Form.Text className="text-muted">Wybierz pokój, aby zobaczyć dostępne urządzenia.</Form.Text>}
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Typ działania</Form.Label>
                                <Form.Select 
                                    required value={newSensor.type} 
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        let unit = '';
                                        if (val === 'TEMPERATURE') unit = '°C';
                                        else if (val === 'HUMIDITY') unit = '%';
                                        else if (val === 'MOTION') unit = 'ON/OFF';
                                        else if (val === 'DOOR_WINDOW') unit = 'LOCK/UNLOCK';
                                        setNewSensor({...newSensor, type: val, unit: unit});
                                    }}
                                    disabled={!newSensor.deviceName || selectedDeviceType === 'SPEAKER'} 
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                >
                                    <option value="">-- Wybierz typ --</option>
                                    {allowedSensors.includes('TEMPERATURE') && <option value="TEMPERATURE">Temperatura (°C)</option>}
                                    {allowedSensors.includes('HUMIDITY') && (
                                        <option value="HUMIDITY">
                                            {selectedDeviceType === 'SPEAKER' ? 'Procent głośności (%)' : 'Wilgotność (%)'}
                                        </option>
                                    )}
                                    {allowedSensors.includes('MOTION') && <option value="MOTION">Ruch (ON/OFF)</option>}
                                    {allowedSensors.includes('DOOR_WINDOW') && <option value="DOOR_WINDOW">Otwarcie (LOCK/UNLOCK)</option>}
                                    {newSensor.deviceName && allowedSensors.length === 0 && <option value="" disabled>To urządzenie nie wspiera czujników</option>}
                                </Form.Select>
                                {!newSensor.deviceName && newSensor.roomId && <Form.Text className="text-muted">Wybierz urządzenie, aby dopasować czujnik.</Form.Text>}
                                {selectedDeviceType === 'SPEAKER' && <Form.Text className="text-info">Dla głośnika poziom głośności przypisywany jest automatycznie.</Form.Text>}
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label>Jednostka (przypisana automatycznie)</Form.Label>
                                <Form.Control value={newSensor.unit} readOnly disabled style={{ backgroundColor: '#1E293B', color: 'var(--text-sub)', border: '1px solid #334155' }} />
                            </Form.Group>
                            <div className="d-flex justify-content-end gap-2">
                                <Button variant="secondary" onClick={() => setShowModal(false)}>Anuluj</Button>
                                <Button variant="primary" type="submit" className="fw-bold px-4" disabled={!newSensor.name || !newSensor.roomId || !newSensor.deviceName || !newSensor.type}>
                                    Zapisz Czujnik
                                </Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </div>
            </Modal>

            <Modal show={deleteConfirmInfo.show} onHide={() => setDeleteConfirmInfo({ show: false, id: null })} centered size="sm">
                <div style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', borderRadius: '12px', border: '1px solid var(--accent-hover)' }}>
                    <Modal.Body className="p-4 text-center">
                        <div className="mb-3"><span style={{ fontSize: '3rem' }}>⚠️</span></div>
                        <h5 className="fw-bold mb-3 text-danger">Potwierdź usunięcie</h5>
                        <p className="text-muted" style={{ fontSize: '0.95rem' }}>Czy na pewno chcesz usunąć ten czujnik? Ta operacja usunie również jego historię odczytów.</p>
                        <div className="d-flex justify-content-center gap-2 mt-4">
                            <Button variant="secondary" onClick={() => setDeleteConfirmInfo({ show: false, id: null })}>Anuluj</Button>
                            <Button variant="danger" className="fw-bold" onClick={executeDelete}>Tak, usuń</Button>
                        </div>
                    </Modal.Body>
                </div>
            </Modal>
        </div>
    );
};

export default Sensors;