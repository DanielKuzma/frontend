import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Button, Badge, Modal, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api';
import { useNotification } from '../NotificationContext';

const AllDevices = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole] = useState(localStorage.getItem('role') || 'RESIDENT');
    const [deleteConfirmInfo, setDeleteConfirmInfo] = useState({ show: false, id: null });
    
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await fetchData();
            setLoading(false);
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        const intervalId = setInterval(fetchData, 3000);
        return () => clearInterval(intervalId);
    }, []);

    const fetchData = async () => {
        try {
            const devicesRes = await api.get('/devices');
            if (Array.isArray(devicesRes.data)) {
                setDevices(devicesRes.data);
            }
        } catch (err) {
            console.error("Błąd odświeżania:", err);
            setError('Nie udało się pobrać listy urządzeń.');
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'ON' ? 'OFF' : 'ON';
        try {
            await api.patch(`/devices/${id}?deviceStatus=${nextStatus}`);
            fetchData(); 
            showNotification(`Zmieniono status na ${nextStatus}`, 'success');
        } catch (err) {
            showNotification('Błąd zmiany statusu.', 'danger');
        }
    };

    const executeDelete = async () => {
        if (!deleteConfirmInfo.id) return;
        try {
            await api.delete(`/devices/${deleteConfirmInfo.id}`);
            fetchData();
            showNotification('Pomyślnie usunięto urządzenie.', 'success');
        } catch (err) {
            showNotification('Błąd usuwania.', 'danger');
        } finally {
            setDeleteConfirmInfo({ show: false, id: null });
        }
    };

    const getDeviceTypeStats = () => {
        const counts = { 'LIGHT': 0, 'HEATER': 0, 'AIR_CONDITIONER': 0, 'FAN': 0, 'BLINDS': 0, 'LOCK': 0, 'OUTLET': 0, 'SPEAKER': 0 };
        devices.forEach(d => { if (counts[d.deviceType] !== undefined) counts[d.deviceType] += 1; });

        const TYPE_NAMES = { 'LIGHT': 'Światło', 'HEATER': 'Grzejnik', 'AIR_CONDITIONER': 'Klimatyzator', 'FAN': 'Wentylator', 'BLINDS': 'Rolety', 'LOCK': 'Zamek', 'OUTLET': 'Gniazdko', 'SPEAKER': 'Głośnik' };
        const COLORS = { 'LIGHT': '#facc15', 'HEATER': '#ef4444', 'AIR_CONDITIONER': '#3b82f6', 'FAN': '#0ea5e9', 'BLINDS': '#8b5cf6', 'LOCK': '#10b981', 'OUTLET': '#f97316', 'SPEAKER': '#ec4899' };

        return Object.keys(counts).map(key => ({
            name: TYPE_NAMES[key],
            value: counts[key],
            color: COLORS[key]
        }));
    };

    const deviceStats = getDeviceTypeStats();

    // --- CUSTOM TOOLTIP: Pokazuje wszystkie dane naraz ---
    const AllDataTooltip = ({ active }) => {
        if (active) {
            return (
                <div className="p-3 rounded shadow" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--accent-cyan)', minWidth: '200px' }}>
                    <h6 className="fw-bold mb-2 border-bottom pb-1" style={{ color: 'var(--text-main)' }}>Podsumowanie sprzętu:</h6>
                    {deviceStats.map((s, i) => (
                        <div key={i} className="d-flex justify-content-between gap-3 mb-1" style={{ fontSize: '0.85rem' }}>
                            <span style={{ color: s.color }}>● {s.name}:</span>
                            <span className="fw-bold text-white">{s.value} szt.</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} className="d-block mx-auto mt-5" />;

    return (
        <div className="mt-4 container-main-view">
            <div className="main-card-container shadow border-0 p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="section-title mb-0" style={{ color: 'var(--accent-cyan)' }}>Wszystkie Urządzenia w Budynku</h2>
                    <Badge bg="dark" className="p-2 border border-secondary text-light fw-normal fs-6">Łącznie: {devices.length}</Badge>
                </div>

                {devices.length > 0 && (
                    <div className="mb-5 p-4" style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: '15px', border: '1px solid #334155' }}>
                        <Row className="align-items-center">
                            <Col md={5}>
                                <div>
                                    <h5 className="fw-bold text-white mb-3">Inwentaryzacja Sprzętu</h5>
                                    <p className="text-muted small">
                                        Wykres prezentuje procentowy udział poszczególnych typów urządzeń w całej infrastrukturze Smart Home. 
                                    </p>
                                </div>
                            </Col>
                            <Col md={7}>
                                <div style={{ width: '100%', height: 280 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie 
                                                data={deviceStats} 
                                                innerRadius={65} 
                                                outerRadius={95} 
                                                paddingAngle={5} 
                                                dataKey="value" 
                                                stroke="none"
                                            >
                                                {deviceStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<AllDataTooltip />} />
                                            <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </Col>
                        </Row>
                    </div>
                )}

                <Table striped bordered hover variant="dark" responsive className="m-0 align-middle">
                    <thead>
                        <tr className="text-center">
                            <th>ID</th><th>Nazwa Urządzenia</th><th>Typ</th><th>Pokój</th><th>Status</th><th>Konfiguracja</th><th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {devices.map((device) => (
                            <tr key={device.id}>
                                <td className="text-center text-muted">#{device.id}</td>
                                <td className="fw-bold" style={{ color: 'var(--accent-hover)' }}>{device.name}</td>
                                <td className="text-center"><Badge bg="outline-light" className="border text-light fw-normal">{device.deviceType}</Badge></td>
                                <td className="text-center">
                                    {device.room ? (
                                        <span className="text-info" style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(`/rooms/${device.room.id}/devices`)}>
                                            {device.room.name} (P{device.room.floor})
                                        </span>
                                    ) : <span className="text-muted small">Brak</span>}
                                </td>
                                <td className="text-center"><Badge bg={device.deviceStatus === 'ON' ? 'info' : 'secondary'}>{device.deviceStatus}</Badge></td>
                                <td className="text-center small text-muted">{device.properties || '-'}</td>
                                <td className="text-center">
                                    <Button variant={device.deviceStatus === 'ON' ? 'warning' : 'success'} size="sm" className="me-2 text-dark fw-bold" onClick={() => toggleStatus(device.id, device.deviceStatus)}>
                                        {device.deviceStatus === 'ON' ? 'Wyłącz' : 'Włącz'}
                                    </Button>
                                    {userRole === 'ADMIN' && <Button variant="outline-danger" size="sm" onClick={() => setDeleteConfirmInfo({ show: true, id: device.id })}>Usuń</Button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            <Modal show={deleteConfirmInfo.show} onHide={() => setDeleteConfirmInfo({ show: false, id: null })} centered size="sm">
                <div style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', borderRadius: '12px', border: '1px solid var(--accent-hover)' }}>
                    <Modal.Body className="p-4 text-center">
                        <div className="mb-3"><span style={{ fontSize: '3rem' }}>⚠️</span></div>
                        <h5 className="fw-bold mb-3 text-danger">Usuń urządzenie</h5>
                        <p className="text-muted small">Operacja jest nieodwracalna.</p>
                        <div className="d-flex justify-content-center gap-2 mt-4">
                            <Button variant="secondary" onClick={() => setDeleteConfirmInfo({ show: false, id: null })}>Anuluj</Button>
                            <Button variant="danger" onClick={executeDelete}>Tak, usuń</Button>
                        </div>
                    </Modal.Body>
                </div>
            </Modal>
        </div>
    );
};

export default AllDevices;