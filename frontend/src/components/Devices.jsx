import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Spinner, Alert, Button, Modal, Form, Badge, Toast, ToastContainer } from 'react-bootstrap';
import api from '../api';

const Devices = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    
    const [devices, setDevices] = useState([]);
    const [sensors, setSensors] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [userRole, setUserRole] = useState('');
    const [currentUserId, setCurrentUserId] = useState(null); 
    
    const [showModal, setShowModal] = useState(false);
    const [newDevice, setNewDevice] = useState({
        name: '',
        deviceType: 'LIGHT', 
        deviceStatus: 'OFF', 
        properties: ''
    });
    const [actionError, setActionError] = useState('');

    const [showRuleModal, setShowRuleModal] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [newRule, setNewRule] = useState({
        name: '',
        sensorId: '',
        operator: 'GT', 
        threshold: '',
        targetStatus: 'ON'
        // Usunąłem stąd sztywny actionPayload, będziemy go ustawiać dynamicznie
    });

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');

    useEffect(() => {
        fetchInitialData();
    }, [roomId]);

    const fetchInitialData = async () => {
        try {
            const userResponse = await api.get('/users/me');
            setUserRole(userResponse.data.role);
            setCurrentUserId(userResponse.data.id); 

            const devicesResponse = await api.get(`/devices/rooms/${roomId}`);
            setDevices(devicesResponse.data);

            const sensorsResponse = await api.get('/sensors');
            if (Array.isArray(sensorsResponse.data)) {
                setSensors(sensorsResponse.data);
            }
            
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

    const handleOpenRuleCreator = (device) => {
        setSelectedDevice(device);
        setNewRule({
            ...newRule,
            name: `Automatyzacja dla: ${device.name}`,
            sensorId: '',
            threshold: ''
        });
        setShowRuleModal(true);
    };

    const handleSaveRule = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newRule,
                targetDeviceId: selectedDevice.id,
                threshold: parseFloat(newRule.threshold),
                sensorId: parseInt(newRule.sensorId),
                userId: currentUserId,
                // POPRAWKA: Wysyłamy do bazy "ON" lub "OFF" jako payload, żeby ładnie wyglądało w tabeli!
                actionPayload: newRule.targetStatus 
            };

            await api.post('/automation/rules', payload);

            setShowRuleModal(false);
            setToastVariant('success');
            setToastMessage("Pomyślnie dodano nową regułę automatyzacji!");
            setShowToast(true);

        } catch (error) {
            console.error("Szczegóły błędu dodawania reguły:", error);
            setToastVariant('danger');
            setToastMessage("Błąd serwera (Sprawdź uprawnienia lub czy token nie wygasł).");
            setShowToast(true);
        }
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
                                        <div>
                                            <Button 
                                                variant={device.deviceStatus === 'ON' ? 'warning' : 'success'} 
                                                size="sm" 
                                                className="me-2"
                                                onClick={() => toggleStatus(device.id, device.deviceStatus)}
                                                disabled={device.deviceStatus === 'OFFLINE'} 
                                            >
                                                {device.deviceStatus === 'ON' ? 'Wyłącz' : 'Włącz'}
                                            </Button>
                                            
                                            {canAddDevice && (
                                                <Button variant="outline-info" size="sm" onClick={() => handleOpenRuleCreator(device)}>
                                                    ⚙️ Automatyzuj
                                                </Button>
                                            )}
                                        </div>
                                        
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

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <div style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)' }}>
                    <Modal.Header closeButton closeVariant="white" style={{ borderBottomColor: '#3A475C' }}>
                        <Modal.Title>Nowe Urządzenie</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleAddDevice}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nazwa</Form.Label>
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

            <Modal show={showRuleModal} onHide={() => setShowRuleModal(false)} centered>
                <div style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)' }}>
                    <Modal.Header closeButton closeVariant="white" style={{ borderBottomColor: '#3A475C' }}>
                        <Modal.Title>Reguła dla: <span style={{ color: 'var(--accent-cyan)' }}>{selectedDevice?.name}</span></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleSaveRule}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nazwa automatyzacji</Form.Label>
                                <Form.Control
                                    type="text" required
                                    placeholder="np. Wyłącz klimatyzację w nocy"
                                    value={newRule.name}
                                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Wyzwalacz (Czujnik)</Form.Label>
                                <Form.Select 
                                    required 
                                    value={newRule.sensorId} 
                                    onChange={(e) => setNewRule({ ...newRule, sensorId: e.target.value })}
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
                                >
                                    <option value="">-- Wybierz czujnik --</option>
                                    {sensors.length === 0 ? (
                                        <option value="" disabled>Brak czujników! Dodaj je najpierw w zakładce Czujniki.</option>
                                    ) : (
                                        sensors.map(sensor => (
                                            <option key={sensor.id} value={sensor.id}>
                                                {sensor.name} {sensor.room ? `(${sensor.room.name})` : ''}
                                            </option>
                                        ))
                                    )}
                                </Form.Select>
                            </Form.Group>

                            <Row className="mb-3">
                                <Col>
                                    <Form.Group>
                                        <Form.Label>Gdy odczyt jest:</Form.Label>
                                        <Form.Select 
                                            value={newRule.operator} 
                                            onChange={(e) => setNewRule({ ...newRule, operator: e.target.value })}
                                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
                                        >
                                            <option value="GT">Większa niż (&gt;)</option>
                                            <option value="GTE">Większa lub równa (&gt;=)</option>
                                            <option value="LT">Mniejsza niż (&lt;)</option>
                                            <option value="LTE">Mniejsza lub równa (&lt;=)</option>
                                            <option value="EQ">Równa (=)</option>
                                            <option value="NEQ">Różna od (!=)</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group>
                                        <Form.Label>Wartość (Próg):</Form.Label>
                                        <Form.Control
                                            type="number" step="0.1" required
                                            placeholder="np. 25"
                                            value={newRule.threshold}
                                            onChange={(e) => setNewRule({ ...newRule, threshold: e.target.value })}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-4">
                                <Form.Label>Wtedy zmień status urządzenia na:</Form.Label>
                                <Form.Select 
                                    value={newRule.targetStatus} 
                                    onChange={(e) => setNewRule({ ...newRule, targetStatus: e.target.value })}
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
                                >
                                    <option value="ON">Włączone (ON)</option>
                                    <option value="OFF">Wyłączone (OFF)</option>
                                </Form.Select>
                            </Form.Group>

                            <div className="d-flex justify-content-end">
                                <Button variant="secondary" className="me-2" onClick={() => setShowRuleModal(false)}>Anuluj</Button>
                                <Button variant="success" type="submit" disabled={sensors.length === 0}>Zapisz i aktywuj</Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </div>
            </Modal>

            <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 9999 }}>
                <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg={toastVariant}>
                    <Toast.Header>
                        <strong className="me-auto">System Automatyzacji</strong>
                    </Toast.Header>
                    <Toast.Body className={(toastVariant === 'success' || toastVariant === 'danger' || toastVariant === 'primary') ? 'text-white' : 'text-dark'}>
                        {toastMessage}
                    </Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
};

export default Devices;