import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Button, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import api from '../api';
import { useNotification } from '../NotificationContext';

const Automations = () => {
    const [rules, setRules] = useState([]);
    const [sensors, setSensors] = useState([]);
    const [devices, setDevices] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [showModal, setShowModal] = useState(false);
    const [newRule, setNewRule] = useState({
        name: '',
        roomId: '', 
        targetDeviceId: '',
        actionPayload: 'ON',
        sensorId: '',
        operator: 'GT', 
        threshold: ''
    });

    const { showNotification } = useNotification();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [rulesRes, sensorsRes, devicesRes, roomsRes, userRes] = await Promise.all([
                api.get('/automation/rules'),
                api.get('/sensors'),
                api.get('/devices'),
                api.get('/rooms'),
                api.get('/users/me')
            ]);
            
            setRules(rulesRes.data);
            if (Array.isArray(sensorsRes.data)) setSensors(sensorsRes.data);
            if (Array.isArray(devicesRes.data)) setDevices(devicesRes.data);
            if (Array.isArray(roomsRes.data)) setRooms(roomsRes.data);
            setCurrentUserId(userRes.data.id);
            
            setLoading(false);
        } catch (err) {
            setError('Błąd pobierania danych. Zaloguj się ponownie.');
            setLoading(false);
        }
    };

    const fetchRulesOnly = async () => {
        try {
            const response = await api.get('/automation/rules');
            setRules(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleRule = async (id) => {
        try {
            await api.post(`/automation/rules/${id}`);
            fetchRulesOnly();
            showNotification('Zmieniono status reguły automatyzacji.', 'success');
        } catch (err) {
            showNotification('Błąd podczas zmiany statusu reguły.', 'danger');
        }
    };

    const handleDeleteRule = async (id) => {
        if (!window.confirm('Na pewno usunąć tę automatyzację?')) return;
        try {
            await api.delete(`/automation/rules/${id}`);
            fetchRulesOnly();
            showNotification('Pomyślnie usunięto regułę automatyzacji.', 'success');
        } catch (err) {
            showNotification('Błąd podczas usuwania reguły.', 'danger');
        }
    };

    const handleAddRule = async (e) => {
        e.preventDefault();
        try {
            // KULOODPORNY PAYLOAD: Wysyłamy akcję pod kilkoma nazwami, żeby Java na 100% to złapała
            const payload = {
                name: newRule.name,
                sensorId: parseInt(newRule.sensorId),
                operator: newRule.operator,
                threshold: parseFloat(newRule.threshold),
                targetDeviceId: parseInt(newRule.targetDeviceId),
                userId: currentUserId,
                
                // Różne warianty nazewnictwa dla Spring Boota:
                actionPayload: newRule.actionPayload,
                action: newRule.actionPayload,
                status: newRule.actionPayload,
                targetStatus: newRule.actionPayload,
                deviceStatus: newRule.actionPayload,
                command: newRule.actionPayload
            };

            await api.post('/automation/rules', payload);
            
            setShowModal(false);
            setNewRule({
                name: '', roomId: '', targetDeviceId: '', actionPayload: 'ON', sensorId: '', operator: 'GT', threshold: ''
            });
            fetchRulesOnly();
            
            showNotification('Pomyślnie dodano nową regułę automatyzacji!', 'success');
        } catch (err) {
            showNotification('Błąd podczas dodawania reguły. Sprawdź formularz.', 'danger');
        }
    };

    const formatOperator = (operator) => {
        switch(operator) {
            case 'GT': return '>';
            case 'GTE': return '>=';
            case 'LT': return '<';
            case 'LTE': return '<=';
            case 'EQ': return '=';
            case 'NEQ': return '!=';
            default: return operator;
        }
    };

    const filteredDevices = devices.filter(d => d.room && d.room.id.toString() === newRule.roomId.toString());
    const selectedDeviceObj = devices.find(d => d.id.toString() === newRule.targetDeviceId.toString());
    
    const availableSensors = sensors.filter(s => {
        if (!selectedDeviceObj) return false;
        const sDeviceName = s.deviceName || (s.device && s.device.name);
        return sDeviceName === selectedDeviceObj.name;
    });

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} className="d-block mx-auto mt-5" />;
    if (error) return <Alert variant="danger" className="mt-4 container-main-view">{error}</Alert>;

    return (
        <div className="mt-4 container-main-view">
            <div className="main-card-container shadow border-0 p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="section-title mb-0" style={{ color: 'var(--accent-cyan)' }}>
                        Globalne Automatyzacje
                    </h2>
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                        + Dodaj Regułę
                    </Button>
                </div>
                
                {rules.length === 0 ? (
                    <Alert variant="info" className="m-0">
                        Nie masz jeszcze żadnych reguł. Kliknij "Dodaj Regułę", aby rozpocząć.
                    </Alert>
                ) : (
                    <Table striped bordered hover variant="dark" responsive className="m-0 align-middle">
                        <thead>
                            <tr className="text-center">
                                <th>Nazwa Reguły</th>
                                <th>Wyzwalacz (Czujnik)</th>
                                <th>Warunek</th>
                                <th>Urządzenie Docelowe</th>
                                <th>Akcja (Status)</th>
                                <th>Status Reguły</th>
                                <th>Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rules.map(rule => {
                                // Kuloodporny odczyt statusu z bazy danych
                                const ruleAction = rule.actionPayload || rule.action || rule.status || rule.deviceStatus || rule.targetStatus || rule.command;
                                
                                return (
                                    <tr key={rule.id}>
                                        <td className="fw-bold" style={{ color: 'var(--accent-hover)' }}>{rule.name}</td>
                                        <td>{rule.sensor ? rule.sensor.name : <span className="text-muted small">Nieznany</span>}</td>
                                        <td className="text-center">
                                            <Badge bg="secondary" className="px-3 py-2 fw-normal" style={{ fontSize: '0.9rem' }}>
                                                {formatOperator(rule.operator)} {rule.threshold}
                                            </Badge>
                                        </td>
                                        <td>{rule.targetDevice ? rule.targetDevice.name : <span className="text-muted small">Nieznane</span>}</td>
                                        <td className="text-center">
                                            <Badge 
                                                bg={ruleAction === 'ON' ? 'info' : 'secondary'} 
                                                text={ruleAction === 'ON' ? 'dark' : 'light'}
                                                className="px-2 py-2"
                                            >
                                                Zmień na: {ruleAction || 'BŁĄD ZAPISU (NULL)'}
                                            </Badge>
                                        </td>
                                        <td className="text-center">
                                            {rule.enabled ? (
                                                <Badge bg="success">Aktywna</Badge>
                                            ) : (
                                                <Badge bg="danger">Uśpiona</Badge>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <Button 
                                                variant={rule.enabled ? 'outline-warning' : 'outline-success'} 
                                                size="sm" 
                                                className="me-2"
                                                onClick={() => handleToggleRule(rule.id)}
                                            >
                                                {rule.enabled ? 'Uśpij' : 'Wznów'}
                                            </Button>
                                            
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteRule(rule.id)}>
                                                Usuń
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                )}
            </div>

            {/* Modal dodawania reguły - Kaskadowy układ */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <div style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', borderRadius: '12px', border: '1px solid var(--accent-hover)' }}>
                    <Modal.Header closeButton closeVariant="white" className="border-secondary">
                        <Modal.Title>Nowa Reguła Automatyzacji</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Form onSubmit={handleAddRule}>
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold text-info">Nazwa automatyzacji</Form.Label>
                                <Form.Control
                                    type="text" required
                                    placeholder="np. Włącz światło gdy wykryto ruch..."
                                    value={newRule.name}
                                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                />
                            </Form.Group>

                            <h6 className="fw-bold text-light mb-3 border-bottom border-secondary pb-2">1. Cel akcji (Czym sterujemy?)</h6>
                            <Row className="mb-4">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Wybierz pokój</Form.Label>
                                        <Form.Select 
                                            required 
                                            value={newRule.roomId} 
                                            onChange={(e) => setNewRule({ ...newRule, roomId: e.target.value, targetDeviceId: '', sensorId: '' })}
                                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                        >
                                            <option value="">-- Wybierz pokój --</option>
                                            {rooms.map(room => (
                                                <option key={room.id} value={room.id}>{room.name}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={5}>
                                    <Form.Group>
                                        <Form.Label>Urządzenie docelowe</Form.Label>
                                        <Form.Select 
                                            required 
                                            value={newRule.targetDeviceId} 
                                            disabled={!newRule.roomId}
                                            onChange={(e) => setNewRule({ ...newRule, targetDeviceId: e.target.value, sensorId: '' })}
                                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                        >
                                            <option value="">-- Wybierz urządzenie --</option>
                                            {filteredDevices.map(device => (
                                                <option key={device.id} value={device.id}>
                                                    {device.name} ({device.deviceType})
                                                </option>
                                            ))}
                                            {newRule.roomId && filteredDevices.length === 0 && <option disabled>Brak urządzeń w tym pokoju</option>}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Akcja:</Form.Label>
                                        <Form.Select 
                                            value={newRule.actionPayload} 
                                            onChange={(e) => setNewRule({ ...newRule, actionPayload: e.target.value })}
                                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                        >
                                            <option value="ON">Włącz (ON)</option>
                                            <option value="OFF">Wyłącz (OFF)</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <h6 className="fw-bold text-light mb-3 border-bottom border-secondary pb-2">2. Warunek (Kiedy to zrobić?)</h6>
                            <Row className="mb-4">
                                <Col md={5}>
                                    <Form.Group>
                                        <Form.Label>Czujnik (przypisany do urządzenia)</Form.Label>
                                        <Form.Select 
                                            required 
                                            value={newRule.sensorId} 
                                            disabled={!newRule.targetDeviceId}
                                            onChange={(e) => setNewRule({ ...newRule, sensorId: e.target.value })}
                                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                        >
                                            <option value="">-- Wybierz czujnik --</option>
                                            {availableSensors.map(sensor => (
                                                <option key={sensor.id} value={sensor.id}>
                                                    {sensor.name} ({sensor.unit})
                                                </option>
                                            ))}
                                            {newRule.targetDeviceId && availableSensors.length === 0 && (
                                                <option disabled>To urządzenie nie posiada czujników</option>
                                            )}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Odczyt jest:</Form.Label>
                                        <Form.Select 
                                            value={newRule.operator} 
                                            onChange={(e) => setNewRule({ ...newRule, operator: e.target.value })}
                                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                        >
                                            <option value="GT">Większy niż (&gt;)</option>
                                            <option value="GTE">Większy lub równy (&gt;=)</option>
                                            <option value="LT">Mniejszy niż (&lt;)</option>
                                            <option value="LTE">Mniejszy lub równy (&lt;=)</option>
                                            <option value="EQ">Równy (=)</option>
                                            <option value="NEQ">Różny od (!=)</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Próg (Wartość)</Form.Label>
                                        <Form.Control
                                            type="number" step="0.1" required
                                            placeholder="np. 25"
                                            value={newRule.threshold}
                                            onChange={(e) => setNewRule({ ...newRule, threshold: e.target.value })}
                                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <Button variant="secondary" onClick={() => setShowModal(false)}>Anuluj</Button>
                                <Button 
                                    variant="success" 
                                    type="submit" 
                                    className="fw-bold px-4"
                                    disabled={!newRule.name || !newRule.targetDeviceId || !newRule.sensorId || !newRule.threshold}
                                >
                                    Zapisz i aktywuj
                                </Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </div>
            </Modal>
        </div>
    );
};

export default Automations;