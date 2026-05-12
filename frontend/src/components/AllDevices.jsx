import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const AllDevices = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Pytamy o rolę, żeby wiedzieć, co wolno temu użytkownikowi
            const userRes = await api.get('/users/me');
            setUserRole(userRes.data.role);

            // Wywołujemy nasz "zapomniany" endpoint GET /api/devices
            const devicesRes = await api.get('/devices');
            setDevices(devicesRes.data);
            setLoading(false);
        } catch (err) {
            setError('Nie udało się pobrać listy wszystkich urządzeń.');
            setLoading(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'ON' ? 'OFF' : 'ON';
        try {
            await api.patch(`/devices/${id}?deviceStatus=${nextStatus}`);
            fetchData();
        } catch (err) {
            alert('Błąd podczas zmiany statusu.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Na pewno usunąć to urządzenie z systemu?')) return;
        try {
            await api.delete(`/devices/${id}`);
            fetchData();
        } catch (err) {
            alert('Brak uprawnień do usunięcia (tylko ADMIN).');
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'ON': return 'info';
            case 'OFF': return 'secondary';
            case 'ERROR': return 'danger';
            case 'OFFLINE': return 'warning';
            default: return 'secondary';
        }
    };

    const canDelete = userRole === 'ADMIN';

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <div className="mt-4">
            <h2 className="mb-4">Globalny Rejestr Urządzeń</h2>
            
            {devices.length === 0 ? (
                <Alert variant="info">Brak urządzeń w całym budynku.</Alert>
            ) : (
                <Table striped bordered hover variant="dark" responsive className="shadow">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nazwa</th>
                            <th>Typ</th>
                            <th>Status</th>
                            <th>Szczegóły (MAC/IP)</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {devices.map(device => (
                            <tr key={device.id}>
                                <td>{device.id}</td>
                                <td>{device.name}</td>
                                <td>{device.deviceType}</td>
                                <td>
                                    <Badge bg={getStatusBadge(device.deviceStatus)}>
                                        {device.deviceStatus}
                                    </Badge>
                                </td>
                                <td>{device.properties || '-'}</td>
                                <td>
                                    <Button 
                                        variant={device.deviceStatus === 'ON' ? 'warning' : 'success'} 
                                        size="sm" 
                                        className="me-2"
                                        disabled={device.deviceStatus === 'OFFLINE'}
                                        onClick={() => toggleStatus(device.id, device.deviceStatus)}
                                    >
                                        {device.deviceStatus === 'ON' ? 'Wyłącz' : 'Włącz'}
                                    </Button>
                                    
                                    {canDelete && (
                                        <Button variant="danger" size="sm" onClick={() => handleDelete(device.id)}>
                                            Usuń
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </div>
    );
};

export default AllDevices;