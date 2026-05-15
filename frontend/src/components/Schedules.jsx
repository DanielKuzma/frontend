import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Button, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import api from '../api';
import { useNotification } from '../NotificationContext';

const Schedules = () => {
    const [schedules, setSchedules] = useState([]);
    const [rooms, setRooms] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showModal, setShowModal] = useState(false);
    
    // --- NOWY STAN DLA POTWIERDZENIA USUNIĘCIA ---
    const [deleteConfirmInfo, setDeleteConfirmInfo] = useState({ show: false, id: null });

    const [newSchedule, setNewSchedule] = useState({
        name: '',
        executionTime: '',
        targetStatus: 'ON',
        targetType: 'ALL', 
        targetId: '',      
        deviceType: 'LIGHT'
    });

    const { showNotification } = useNotification();

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
        try {
            const response = await api.get('/schedules');
            if (Array.isArray(response.data)) setSchedules(response.data);
        } catch (err) { console.error(err); }
    };

    const fetchRooms = async () => {
        try {
            const response = await api.get('/rooms');
            if (Array.isArray(response.data)) setRooms(response.data);
        } catch (err) { console.error(err); }
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
                deviceType: newSchedule.targetType === 'BY_DEVICE_TYPE' ? newSchedule.deviceType : null,
                targetId: newSchedule.targetType === 'BY_ROOM' ? parseInt(newSchedule.targetId) : null,
                enabled: true
            };

            await api.post('/schedules', payload);
            
            setShowModal(false);
            setNewSchedule({ name: '', executionTime: '', targetStatus: 'ON', targetType: 'ALL', targetId: '', deviceType: 'LIGHT' });
            fetchSchedules();
            showNotification('Pomyślnie utworzono harmonogram.', 'success');
        } catch (err) {
            showNotification('Błąd zapisu harmonogramu.', 'danger');
        }
    };

    const handleToggleSchedule = async (id) => {
        try {
            await api.post(`/schedules/toggle/${id}`);
            fetchSchedules();
            showNotification('Zmieniono status harmonogramu.', 'success');
        } catch (err) {
            showNotification('Nie udało się zmienić statusu.', 'danger');
        }
    };

    // --- FUNKCJA WYKONAWCZA USUNIĘCIA ---
    const executeDeleteSchedule = async () => {
        if (!deleteConfirmInfo.id) return;
        try {
            await api.delete(`/schedules/${deleteConfirmInfo.id}`);
            fetchSchedules();
            showNotification('Harmonogram został usunięty.', 'success');
        } catch (err) {
            showNotification('Błąd podczas usuwania.', 'danger');
        } finally {
            setDeleteConfirmInfo({ show: false, id: null });
        }
    };

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} className="d-block mx-auto mt-5" />;
    if (error) return <Alert variant="danger" className="mt-4 container-main-view">{error}</Alert>;

    return (
        <div className="mt-4 container-main-view">
            <div className="main-card-container shadow border-0 p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="section-title mb-0" style={{ color: 'var(--accent-cyan)' }}>
                        Harmonogramy Czasowe
                    </h2>
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                        + Nowe Zadanie
                    </Button>
                </div>
                
                {schedules.length === 0 ? (
                    <Alert variant="info" className="m-0">Lista harmonogramów jest pusta.</Alert>
                ) : (
                    <Table striped bordered hover variant="dark" responsive className="m-0 align-middle">
                        <thead>
                            <tr className="text-center">
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
                                    <td className="fw-bold" style={{ color: 'var(--accent-hover)' }}>{sch.name}</td>
                                    <td className="text-center">
                                        {sch.targetType === 'ALL' && <Badge bg="primary">Cały budynek</Badge>}
                                        {sch.targetType === 'BY_DEVICE_TYPE' && <Badge bg="info" text="dark">Typ: {sch.deviceType}</Badge>}
                                        {sch.targetType === 'BY_ROOM' && <Badge bg="success">Pokój ID: {sch.targetId}</Badge>}
                                    </td>
                                    <td className="text-center fs-5 fw-bold" style={{ color: 'var(--accent-cyan)' }}>
                                        {cronToTime(sch.cronExpression)}
                                    </td>
                                    <td className="text-center">
                                        <Badge bg={sch.targetStatus === 'ON' ? 'info' : 'secondary'} text={sch.targetStatus === 'ON' ? 'dark' : 'light'} className="px-3 py-2">
                                            {sch.targetStatus}
                                        </Badge>
                                    </td>
                                    <td className="text-center">
                                        <Badge bg={sch.enabled ? "success" : "danger"}>
                                            {sch.enabled ? "AKTYWNY" : "WSTRZYMANY"}
                                        </Badge>
                                    </td>
                                    <td className="text-center">
                                        <Button 
                                            variant={sch.enabled ? 'outline-warning' : 'outline-success'} 
                                            size="sm" className="me-2"
                                            onClick={() => handleToggleSchedule(sch.id)}
                                        >
                                            {sch.enabled ? 'Pauza' : 'Start'}
                                        </Button>
                                        <Button variant="outline-danger" size="sm" onClick={() => setDeleteConfirmInfo({ show: true, id: sch.id })}>
                                            Usuń
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </div>

            {/* Modal dodawania harmonogramu */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <div style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', borderRadius: '12px', border: '1px solid var(--accent-hover)' }}>
                    <Modal.Header closeButton closeVariant="white" className="border-secondary">
                        <Modal.Title>Dodaj Harmonogram</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Form onSubmit={handleAddSchedule}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Nazwa zadania</Form.Label>
                                        <Form.Control 
                                            type="text" required value={newSchedule.name} 
                                            onChange={(e) => setNewSchedule({...newSchedule, name: e.target.value})} 
                                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Godzina</Form.Label>
                                        <Form.Control 
                                            type="time" required value={newSchedule.executionTime} 
                                            onChange={(e) => setNewSchedule({...newSchedule, executionTime: e.target.value})} 
                                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Status Docelowy</Form.Label>
                                        <Form.Select 
                                            value={newSchedule.targetStatus} 
                                            onChange={(e) => setNewSchedule({...newSchedule, targetStatus: e.target.value})}
                                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                        >
                                            <option value="ON">ON</option>
                                            <option value="OFF">OFF</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3 mt-3">
                                <Form.Label className="fw-bold" style={{ color: 'var(--accent-hover)' }}>Zasięg zadania</Form.Label>
                                <Form.Select 
                                    value={newSchedule.targetType} 
                                    onChange={(e) => setNewSchedule({...newSchedule, targetType: e.target.value, targetId: ''})}
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                >
                                    <option value="ALL">Cały budynek (Wszystko)</option>
                                    <option value="BY_DEVICE_TYPE">Według typu urządzenia</option>
                                    <option value="BY_ROOM">W konkretnym pokoju</option>
                                </Form.Select>
                            </Form.Group>

                            {newSchedule.targetType === 'BY_ROOM' && (
                                <Form.Group className="mb-3">
                                    <Form.Label>Wybierz Pokój</Form.Label>
                                    <Form.Select 
                                        required value={newSchedule.targetId} 
                                        onChange={(e) => setNewSchedule({...newSchedule, targetId: e.target.value})}
                                        style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                    >
                                        <option value="">-- Wybierz pokój --</option>
                                        {rooms.map(r => <option key={r.id} value={r.id}>{r.name} (P{r.floor})</option>)}
                                    </Form.Select>
                                </Form.Group>
                            )}

                            {newSchedule.targetType === 'BY_DEVICE_TYPE' && (
                                <Form.Group className="mb-3">
                                    <Form.Label>Typ Urządzenia</Form.Label>
                                    <Form.Select 
                                        value={newSchedule.deviceType} 
                                        onChange={(e) => setNewSchedule({...newSchedule, deviceType: e.target.value})}
                                        style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                    >
                                        <option value="LIGHT">Światła (LIGHT)</option>
                                        <option value="HEATER">Grzejniki (HEATER)</option>
                                        <option value="AIR_CONDITIONER">Klimatyzatory (AIR_CONDITIONER)</option>
                                        <option value="BLINDS">Rolety (BLINDS)</option>
                                    </Form.Select>
                                </Form.Group>
                            )}

                            <div className="d-flex justify-content-end mt-4 gap-2">
                                <Button variant="secondary" onClick={() => setShowModal(false)}>Anuluj</Button>
                                <Button variant="primary" type="submit" className="fw-bold px-4">Zapisz zadanie</Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </div>
            </Modal>

            {/* --- NOWY MODAL POTWIERDZENIA USUNIĘCIA --- */}
            <Modal show={deleteConfirmInfo.show} onHide={() => setDeleteConfirmInfo({ show: false, id: null })} centered size="sm">
                <div style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', borderRadius: '12px', border: '1px solid var(--accent-hover)' }}>
                    <Modal.Body className="p-4 text-center">
                        <div className="mb-3">
                            <span style={{ fontSize: '3rem' }}>⚠️</span>
                        </div>
                        <h5 className="fw-bold mb-3 text-danger">Usuń harmonogram</h5>
                        <p className="text-muted" style={{ fontSize: '0.95rem' }}>
                            Czy na pewno chcesz usunąć to zaplanowane zadanie?
                        </p>
                        <div className="d-flex justify-content-center gap-2 mt-4">
                            <Button variant="secondary" onClick={() => setDeleteConfirmInfo({ show: false, id: null })}>
                                Anuluj
                            </Button>
                            <Button variant="danger" className="fw-bold" onClick={executeDeleteSchedule}>
                                Tak, usuń
                            </Button>
                        </div>
                    </Modal.Body>
                </div>
            </Modal>
        </div>
    );
};

export default Schedules;