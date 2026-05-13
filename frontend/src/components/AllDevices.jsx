import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Button, Badge, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const AllDevices = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState('');
    const navigate = useNavigate();

    // 1. Pierwsze ładowanie danych przy wejściu na stronę
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await fetchData();
            setLoading(false);
        };
        loadInitialData();
    }, []);

    // 2. NOWOŚĆ: Automatyczne odświeżanie (Polling) co 3 sekundy
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchData(); // Pobieramy nowe statusy urządzeń w tle
        }, 3000);

        // Czyszczenie interwału przy wyjściu z tej zakładki
        return () => clearInterval(intervalId);
    }, []);

    const fetchData = async () => {
        try {
            // Pytamy o rolę użytkownika (potrzebne do uprawnień usuwania)
            const userRes = await api.get('/users/me');
            setUserRole(userRes.data.role);

            // Pobieramy listę wszystkich urządzeń w systemie
            const devicesRes = await api.get('/devices');
            if (Array.isArray(devicesRes.data)) {
                setDevices(devicesRes.data);
            }
        } catch (err) {
            console.error("Błąd podczas odświeżania danych:", err);
            setError('Nie udało się pobrać listy urządzeń. Sprawdź połączenie z serwerem.');
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'ON' ? 'OFF' : 'ON';
        try {
            // Wywołujemy patchMapping z parametrem statusu
            await api.patch(`/devices/${id}?deviceStatus=${nextStatus}`);
            fetchData(); // Natychmiastowe odświeżenie po kliknięciu
        } catch (err) {
            alert('Nie udało się zmienić statusu urządzenia.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Czy na pewno chcesz usunąć to urządzenie z systemu?')) return;
        try {
            await api.delete(`/devices/${id}`);
            fetchData();
        } catch (err) {
            alert('Błąd podczas usuwania. Tylko Administrator ma do tego uprawnienia.');
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'ON': return 'info';
            case 'OFF': return 'secondary';
            case 'OFFLINE': return 'warning';
            case 'ERROR': return 'danger';
            default: return 'secondary';
        }
    };

    const canDelete = userRole === 'ADMIN';

    if (loading) return (
        <div className="text-center mt-5">
            <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} />
            <p className="mt-2 text-muted">Ładowanie wszystkich urządzeń...</p>
        </div>
    );

    if (error) return <Alert variant="danger" className="mt-4">{error}</Alert>;

    return (
        <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 style={{ color: 'var(--text-main)' }}>🌐 Wszystkie Urządzenia w Budynku</h2>
                <Badge bg="dark" className="p-2 border border-secondary text-light">
                    Łącznie: {devices.length}
                </Badge>
            </div>

            {devices.length === 0 ? (
                <Alert variant="info">Brak urządzeń zarejestrowanych w systemie.</Alert>
            ) : (
                <Card className="shadow bg-dark border-0">
                    <Table striped bordered hover variant="dark" responsive className="m-0">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nazwa Urządzenia</th>
                                <th>Typ</th>
                                <th>Pokój</th>
                                <th>Status</th>
                                <th>Konfiguracja</th>
                                <th>Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {devices.map((device) => (
                                <tr key={device.id}>
                                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>#{device.id}</td>
                                    <td className="fw-bold" style={{ color: 'var(--accent-hover)' }}>{device.name}</td>
                                    <td>
                                        <Badge bg="outline-light" className="border text-light fw-normal">
                                            {device.deviceType}
                                        </Badge>
                                    </td>
                                    <td>
                                        {device.room ? (
                                            <span 
                                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                onClick={() => navigate(`/rooms/${device.room.id}/devices`)}
                                            >
                                                {device.room.name} (P{device.room.floor})
                                            </span>
                                        ) : 'Brak przypisania'}
                                    </td>
                                    <td>
                                        <Badge bg={getStatusBadge(device.deviceStatus)}>
                                            {device.deviceStatus}
                                        </Badge>
                                    </td>
                                    <td style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>
                                        {device.properties || '-'}
                                    </td>
                                    <td>
                                        <Button 
                                            variant={device.deviceStatus === 'ON' ? 'warning' : 'success'} 
                                            size="sm" 
                                            className="me-2 text-dark fw-bold"
                                            disabled={device.deviceStatus === 'OFFLINE'}
                                            onClick={() => toggleStatus(device.id, device.deviceStatus)}
                                        >
                                            {device.deviceStatus === 'ON' ? 'Wyłącz' : 'Włącz'}
                                        </Button>
                                        
                                        {canDelete && (
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(device.id)}>
                                                Usuń
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>
            )}
        </div>
    );
};

export default AllDevices;