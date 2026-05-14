import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Spinner, Alert, Button, Modal, Form, Badge } from 'react-bootstrap';
import api from '../api';
import { useNotification } from '../NotificationContext';

const Devices = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    
    const [devices, setDevices] = useState([]); // Urządzenia w obecnym pokoju
    const [allDevices, setAllDevices] = useState([]); // WSZYSTKIE urządzenia (do walidacji nazwy)
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

    const [showRuleModal, setShowRuleModal] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [newRule, setNewRule] = useState({
        name: '',
        sensorId: '',
        operator: 'GT', 
        threshold: '',
        targetStatus: 'ON'
    });

    const { showNotification } = useNotification();

    useEffect(() => {
        fetchInitialData();
    }, [roomId]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchDevicesOnly();
        }, 3000);
        return () => clearInterval(intervalId);
    }, [roomId]);

    const fetchInitialData = async () => {
        try {
            const userResponse = await api.get('/users/me');
            setUserRole(userResponse.data.role);
            setCurrentUserId(userResponse.data.id); 

            // Pobieramy urządzenia z pokoju, wszystkie urządzenia oraz czujniki na raz
            const [roomDevicesRes, allDevicesRes, sensorsRes] = await Promise.all([
                api.get(`/devices/rooms/${roomId}`),
                api.get('/devices'),
                api.get('/sensors')
            ]);

            setDevices(roomDevicesRes.data);
            setAllDevices(allDevicesRes.data);
            
            if (Array.isArray(sensorsRes.data)) {
                setSensors(sensorsRes.data);
            }
            
            setLoading(false);
        } catch (err) {
            setError('Nie udało się pobrać danych z serwera.');
            setLoading(false);
        }
    };

    const fetchDevicesOnly = async () => {
        try {
            const [roomDevicesRes, allDevicesRes] = await Promise.all([
                api.get(`/devices/rooms/${roomId}`),
                api.get('/devices')
            ]);
            setDevices(roomDevicesRes.data);
            setAllDevices(allDevicesRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddDevice = async (e) => {
        e.preventDefault();

        // --- WALIDACJA UNIKALNOŚCI NAZWY ---
        const cleanNewName = newDevice.name.trim().toLowerCase();
        
        const nameExists = allDevices.some(d => d.name.trim().toLowerCase() === cleanNewName);

        if (nameExists) {
            // Zatrzymujemy wysyłanie formularza i wyświetlamy żółte ostrzeżenie
            showNotification('Błąd: Urządzenie o takiej nazwie już istnieje w budynku! Użyj unikalnej nazwy (np. "Światło Salon").', 'warning');
            return; 
        }
        // -----------------------------------

        try {
            const payload = { ...newDevice, roomId: parseInt(roomId) };
            await api.post('/devices', payload);
            
            setShowModal(false);     
            setNewDevice({ name: '', deviceType: 'LIGHT', deviceStatus: 'OFF', properties: '' });      
            fetchDevicesOnly();
            
            showNotification('Pomyślnie dodano nowe urządzenie.', 'success');
        } catch (err) {
            showNotification('Wystąpił błąd podczas dodawania urządzenia. Sprawdź uprawnienia.', 'danger');
        }
    };

    const handleDeleteDevice = async (id) => {
        if (!window.confirm('Usunąć to urządzenie?')) return;
        try {
            await api.delete(`/devices/${id}`);
            fetchDevicesOnly();
            showNotification('Urządzenie zostało pomyślnie usunięte.', 'success');
        } catch (err) {
            showNotification('Błąd usuwania (może brak uprawnień ADMIN?).', 'danger');
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const nextStatus = (currentStatus === 'ON') ? 'OFF' : 'ON';
        try {
            await api.patch(`/devices/${id}?deviceStatus=${nextStatus}&status=${nextStatus}`, {
                deviceStatus: nextStatus,
                status: nextStatus
            });
            fetchDevicesOnly();
            showNotification(`Wysłano komendę: ${nextStatus}.`, 'success');
        } catch (err) {
            showNotification('Nie udało się zmienić statusu urządzenia.', 'danger');
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
                name: newRule.name,
                sensorId: parseInt(newRule.sensorId),
                operator: newRule.operator,
                threshold: parseFloat(newRule.threshold),
                targetDeviceId: selectedDevice.id,
                userId: currentUserId,
                
                actionPayload: newRule.targetStatus,
                action: newRule.targetStatus,
                status: newRule.targetStatus,
                targetStatus: newRule.targetStatus,
                deviceStatus: newRule.targetStatus,
                command: newRule.targetStatus
            };

            await api.post('/automation/rules', payload);

            setShowRuleModal(false);
            showNotification('Pomyślnie dodano nową regułę automatyzacji!', 'success');

        } catch (error) {
            console.error("Szczegóły błędu dodawania reguły:", error);
            showNotification('Błąd serwera (Sprawdź uprawnienia lub czy token nie wygasł).', 'danger');
        }
    };

    const getStatusBadgeVariant = (status) => {
        switch(status) {
            case 'ON': return 'info';
            case 'OFF': return 'secondary';
            case 'ERROR': return 'danger';
            case 'OFFLINE': return 'warning';
            default: return 'danger';
        }
    };

    const availableSensorsForSelectedDevice = sensors.filter(s => {
        if (!selectedDevice) return false;
        const sDeviceName = s.deviceName || (s.device && s.device.name);
        return sDeviceName === selectedDevice.name;
    });

    const canAddDevice = userRole === 'ADMIN' || userRole === 'BUILDING_MANAGER';
    const canDeleteDevice = userRole === 'ADMIN';

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} className="d-block mx-auto mt-5" />;
    if (error) return <Alert variant="danger" className="mt-4 container-main-view">{error}</Alert>;

    return (
        <div className="mt-4 container-main-view">
            <Button variant="outline-secondary" className="mb-3" onClick={() => navigate('/rooms')}>
                &larr; Wróć do listy pokoi
            </Button>
            
            <div className="main-card-container shadow border-0">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="section-title mb-0" style={{ color: 'var(--accent-cyan)' }}>
                        Urządzenia w pokoju (ID: {roomId})
                    </h2>
                    
                    {canAddDevice && (
                        <Button variant="primary" onClick={() => setShowModal(true)}>
                            + Dodaj Urządzenie
                        </Button>
                    )}
                </div>

                {devices.length === 0 ? (
                    <p className="text-center py-5" style={{ color: 'var(--text-sub)' }}>
                        Brak urządzeń w tym pomieszczeniu.
                    </p>
                ) : (
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {devices.map((device) => (
                            <Col key={device.id}>
                                <Card 
                                    className="h-100 shadow-sm transition-hover" 
                                    style={{ 
                                        backgroundColor: 'var(--bg-color)', 
                                        border: '1px solid var(--accent-hover)',
                                        borderLeft: device.deviceStatus === 'ON' ? '4px solid var(--accent-cyan)' : '4px solid #475569' 
                                    }}
                                >
                                    <Card.Body className="d-flex flex-column p-4">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <Card.Title className="fw-bold m-0" style={{ color: 'var(--accent-cyan)', fontSize: '1.25rem' }}>
                                                {device.name}
                                            </Card.Title>
                                            
                                            <Badge bg={getStatusBadgeVariant(device.deviceStatus)} className="px-2 py-1">
                                                {device.deviceStatus || 'BŁĄD DANYCH'}
                                            </Badge>
                                        </div>
                                        
                                        <div style={{ color: 'var(--text-sub)', fontSize: '0.95rem' }} className="mb-4 flex-grow-1">
                                            <p className="mb-2"><strong style={{ color: '#fff' }}>Typ:</strong> {device.deviceType}</p>
                                            <p className="mb-0"><strong style={{ color: '#fff' }}>Szczegóły:</strong> {device.properties || 'Brak'}</p>
                                        </div>

                                        <div className="mt-auto d-flex justify-content-between align-items-center gap-2">
                                            <div className="d-flex gap-2 flex-grow-1">
                                                <Button 
                                                    variant={device.deviceStatus === 'ON' ? 'warning' : 'success'} 
                                                    size="sm" 
                                                    className="fw-bold flex-grow-1"
                                                    onClick={() => toggleStatus(device.id, device.deviceStatus)}
                                                    disabled={device.deviceStatus === 'OFFLINE'} 
                                                >
                                                    {device.deviceStatus === 'ON' ? 'Wyłącz' : 'Włącz'}
                                                </Button>
                                                
                                                {canAddDevice && (
                                                    <Button variant="outline-info" size="sm" onClick={() => handleOpenRuleCreator(device)}>
                                                        Automatyzuj
                                                    </Button>
                                                )}
                                            </div>
                                            
                                            {canDeleteDevice && (
                                                <Button variant="outline-danger" size="sm" onClick={() => handleDeleteDevice(device.id)}>
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

            {/* Modal dodawania urządzenia */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <div style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', borderRadius: '12px', border: '1px solid var(--accent-hover)' }}>
                    <Modal.Header closeButton closeVariant="white" className="border-secondary">
                        <Modal.Title>Nowe Urządzenie</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Form onSubmit={handleAddDevice}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nazwa (Musi być unikalna!)</Form.Label>
                                <Form.Control type="text" name="name" required value={newDevice.name} onChange={handleChange} style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}/>
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
                                <Form.Control type="text" name="properties" placeholder="np. MAC: 00:1B:44:11:3A:B7" value={newDevice.properties} onChange={handleChange} style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }} />
                            </Form.Group>

                            <div className="d-flex justify-content-end gap-2">
                                <Button variant="secondary" onClick={() => setShowModal(false)}>Anuluj</Button>
                                <Button variant="primary" type="submit" className="fw-bold px-4">Dodaj urządzenie</Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </div>
            </Modal>

            {/* Modal dodawania reguły z poziomu urządzenia */}
            <Modal show={showRuleModal} onHide={() => setShowRuleModal(false)} centered>
                <div style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', borderRadius: '12px', border: '1px solid var(--accent-hover)' }}>
                    <Modal.Header closeButton closeVariant="white" className="border-secondary">
                        <Modal.Title>Reguła dla: <span style={{ color: 'var(--accent-cyan)' }}>{selectedDevice?.name}</span></Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Form onSubmit={handleSaveRule}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nazwa automatyzacji</Form.Label>
                                <Form.Control
                                    type="text" required
                                    placeholder="np. Wyłącz klimatyzację w nocy"
                                    value={newRule.name}
                                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
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
                                    {availableSensorsForSelectedDevice.length === 0 ? (
                                        <option value="" disabled>To urządzenie nie posiada przypisanych czujników!</option>
                                    ) : (
                                        availableSensorsForSelectedDevice.map(sensor => (
                                            <option key={sensor.id} value={sensor.id}>
                                                {sensor.name} {sensor.unit ? `(${sensor.unit})` : ''}
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
                                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
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

                            <div className="d-flex justify-content-end gap-2">
                                <Button variant="secondary" onClick={() => setShowRuleModal(false)}>Anuluj</Button>
                                <Button 
                                    variant="success" 
                                    type="submit" 
                                    disabled={availableSensorsForSelectedDevice.length === 0 || !newRule.name || !newRule.sensorId || !newRule.threshold} 
                                    className="fw-bold px-4"
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

export default Devices;