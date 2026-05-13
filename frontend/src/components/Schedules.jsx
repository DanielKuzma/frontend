import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Button, Badge, Card, Modal, Form, Toast, ToastContainer, Row, Col } from 'react-bootstrap';
import api from '../api';

const Schedules = () => {
    const [schedules, setSchedules] = useState([]);
    const [rooms, setRooms] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showModal, setShowModal] = useState(false);
    
    // Formularz idealnie dopasowany do Twojej bazy danych (BY_DEVICE_TYPE, BY_ROOM, ALL)
    const [newSchedule, setNewSchedule] = useState({
        name: '',
        executionTime: '',
        targetStatus: 'ON',
        targetType: 'ALL', 
        targetId: '',      
        deviceType: 'LIGHT'
    });

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchSchedules(), fetchRooms()]);
            setLoading(false);
        } catch (err) {
            setError('Błąd pobierania danych. Spróbuj zalogować się ponownie.');
            setLoading(false);
        }
    };

    const fetchSchedules = async () => {
        const response = await api.get('/schedules');
        if (Array.isArray(response.data)) setSchedules(response.data);
    };

    const fetchRooms = async () => {
        const response = await api.get('/rooms');
        if (Array.isArray(response.data)) setRooms(response.data);
    };

    const timeToCron = (timeStr) => {
        if (!timeStr) return "0 0 12 * * *"; 
        const [hours, minutes] = timeStr.split(':');
        return `0 ${parseInt(minutes)} ${parseInt(hours)} * * *`;
    };

    const cronToTime = (cron) => {
        if (!cron) return '--:--';
        const parts = cron.split(' ');
        if (parts.length >= 3) {
            const mm = parts[1].padStart(2, '0');
            const hh = parts[2].padStart(2, '0');
            return `${hh}:${mm}`;
        }
        return cron;
    };

    const handleAddSchedule = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: newSchedule.name,
                cronExpression: timeToCron(newSchedule.executionTime),
                targetStatus: newSchedule.targetStatus,
                targetType: newSchedule.targetType,
                // Wysyłamy deviceType tylko jeśli wybrano typ urządzenia
                deviceType: newSchedule.targetType === 'BY_DEVICE_TYPE' ? newSchedule.deviceType : null,
                // Wysyłamy targetId tylko jeśli wybrano konkretny pokój
                targetId: newSchedule.targetType === 'BY_ROOM' ? parseInt(newSchedule.targetId) : null,
                enabled: true
            };

            await api.post('/schedules', payload);
            
            setShowModal(false);
            setNewSchedule({ name: '', executionTime: '', targetStatus: 'ON', targetType: 'ALL', targetId: '', deviceType: 'LIGHT' });
            fetchSchedules();

            setToastVariant('success');
            setToastMessage("Pomyślnie utworzono harmonogram.");
            setShowToast(true);
        } catch (err) {
            console.error("Błąd zapisu:", err);
            setToastVariant('danger');
            setToastMessage("Błąd zapisu! Sprawdź logi w konsoli.");
            setShowToast(true);
        }
    };

    const handleToggleSchedule = async (id) => {
        try {
            await api.post(`/schedules/toggle/${id}`);
            fetchSchedules();
        } catch (err) {
            alert('Nie udało się zmienić statusu.');
        }
    };

    const handleDeleteSchedule = async (id) => {
        if (!window.confirm('Usunąć ten harmonogram?')) return;
        try {
            await api.delete(`/schedules/${id}`);
            fetchSchedules();
        } catch (err) {
            alert('Błąd podczas usuwania.');
        }
    };

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} className="d-block mx-auto mt-5" />;
    if (error) return <Alert variant="danger" className="mt-4">{error}</Alert>;

    return (
        <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 style={{ color: 'var(--text-main)' }}>🕒 Harmonogramy Czasowe</h2>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    + Nowe Zadanie
                </Button>
            </div>
            
            {schedules.length === 0 ? (
                <Alert variant="info">Lista harmonogramów jest pusta.</Alert>
            ) : (
                <Card className="shadow bg-dark border-0">
                    <Table striped bordered hover variant="dark" responsive className="m-0 align-middle">
                        <thead>
                            <tr>
                                <th>Nazwa</th>
                                <th>Zakres działania</th>
                                <th>Godzina</th>
                                <th>Akcja</th>
                                <th>Status</th>
                                <th>Opcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedules.map(sch => (
                                <tr key={sch.id}>
                                    <td className="fw-bold" style={{ color: 'var(--accent-cyan)' }}>{sch.name}</td>
                                    <td>
                                        {sch.targetType === 'ALL' && <Badge bg="primary">Cały budynek</Badge>}
                                        {sch.targetType === 'BY_DEVICE_TYPE' && <Badge bg="info" text="dark">Typ: {sch.deviceType}</Badge>}
                                        {sch.targetType === 'BY_ROOM' && <Badge bg="success">Pokój ID: {sch.targetId}</Badge>}
                                    </td>
                                    <td className="fs-5 fw-bold">
                                        {cronToTime(sch.cronExpression)}
                                    </td>
                                    <td>
                                        <Badge bg={sch.targetStatus === 'ON' ? 'info' : 'secondary'} className="px-3 py-2">
                                            {sch.targetStatus}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Badge bg={sch.enabled ? "success" : "danger"}>
                                            {sch.enabled ? "AKTYWNY" : "WSTRZYMANY"}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Button 
                                            variant={sch.enabled ? 'outline-warning' : 'outline-success'} 
                                            size="sm" className="me-2"
                                            onClick={() => handleToggleSchedule(sch.id)}
                                        >
                                            {sch.enabled ? 'Pauza' : 'Start'}
                                        </Button>
                                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteSchedule(sch.id)}>
                                            Usuń
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <div style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)' }}>
                    <Modal.Header closeButton closeVariant="white">
                        <Modal.Title>Dodaj Harmonogram</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleAddSchedule}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Nazwa zadania</Form.Label>
                                        <Form.Control type="text" required value={newSchedule.name} onChange={(e) => setNewSchedule({...newSchedule, name: e.target.value})} />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Godzina</Form.Label>
                                        <Form.Control type="time" required value={newSchedule.executionTime} onChange={(e) => setNewSchedule({...newSchedule, executionTime: e.target.value})} />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Status Docelowy</Form.Label>
                                        <Form.Select value={newSchedule.targetStatus} onChange={(e) => setNewSchedule({...newSchedule, targetStatus: e.target.value})}>
                                            <option value="ON">ON</option>
                                            <option value="OFF">OFF</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3 mt-3">
                                <Form.Label className="text-info fw-bold">Zasięg zadania</Form.Label>
                                <Form.Select value={newSchedule.targetType} onChange={(e) => setNewSchedule({...newSchedule, targetType: e.target.value, targetId: ''})}>
                                    <option value="ALL">Cały budynek (Wszystko)</option>
                                    <option value="BY_DEVICE_TYPE">Według typu urządzenia</option>
                                    <option value="BY_ROOM">W konkretnym pokoju</option>
                                </Form.Select>
                            </Form.Group>

                            {newSchedule.targetType === 'BY_ROOM' && (
                                <Form.Group className="mb-3">
                                    <Form.Label>Wybierz Pokój</Form.Label>
                                    <Form.Select required value={newSchedule.targetId} onChange={(e) => setNewSchedule({...newSchedule, targetId: e.target.value})}>
                                        <option value="">-- Wybierz pokój --</option>
                                        {rooms.map(r => <option key={r.id} value={r.id}>{r.name} (P{r.floor})</option>)}
                                    </Form.Select>
                                </Form.Group>
                            )}

                            {newSchedule.targetType === 'BY_DEVICE_TYPE' && (
                                <Form.Group className="mb-3">
                                    <Form.Label>Typ Urządzenia</Form.Label>
                                    <Form.Select value={newSchedule.deviceType} onChange={(e) => setNewSchedule({...newSchedule, deviceType: e.target.value})}>
                                        <option value="LIGHT">Światła (LIGHT)</option>
                                        <option value="HEATER">Grzejniki (HEATER)</option>
                                        <option value="AIR_CONDITIONER">Klimatyzatory (AIR_CONDITIONER)</option>
                                        <option value="BLINDS">Rolety (BLINDS)</option>
                                    </Form.Select>
                                </Form.Group>
                            )}

                            <div className="d-flex justify-content-end mt-4">
                                <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>Anuluj</Button>
                                <Button variant="success" type="submit">Zapisz zadanie</Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </div>
            </Modal>

            <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 9999 }}>
                <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg={toastVariant}>
                    <Toast.Header><strong className="me-auto">Harmonogramy</strong></Toast.Header>
                    <Toast.Body className={(toastVariant === 'success' || toastVariant === 'danger' || toastVariant === 'primary') ? 'text-white' : 'text-dark'}>{toastMessage}</Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
};

export default Schedules;