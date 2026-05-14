import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useNotification } from '../NotificationContext'; // <-- Import naszego globalnego hooka

const AllDevices = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState('');
    
    const navigate = useNavigate();
    const { showNotification } = useNotification(); // <-- Wyciągamy funkcję do wyświetlania powiadomień

    // 1. Pierwsze ładowanie danych przy wejściu na stronę
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await fetchData();
            setLoading(false);
        };
        loadInitialData();
    }, []);

    // 2. Automatyczne odświeżanie (Polling) co 3 sekundy
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchData(); // Pobieramy nowe statusy urządzeń w tle
        }, 3000);

        return () => clearInterval(intervalId);
    }, []);

    const fetchData = async () => {
        try {
            const userRes = await api.get('/users/me');
            setUserRole(userRes.data.role);

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
            await api.patch(`/devices/${id}?deviceStatus=${nextStatus}`);
            fetchData(); 
            // Zastąpiono alert() ładnym powiadomieniem z systemu
            showNotification(`Zmieniono status urządzenia na ${nextStatus}`, 'success');
        } catch (err) {
            // Informacja o błędzie
            showNotification('Nie udało się zmienić statusu urządzenia.', 'danger');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Czy na pewno chcesz usunąć to urządzenie z systemu?')) return;
        try {
            await api.delete(`/devices/${id}`);
            fetchData();
            // Powiadomienie o sukcesie usunięcia
            showNotification('Pomyślnie usunięto urządzenie z systemu.', 'success');
        } catch (err) {
            // Zastąpiono alert() powiadomieniem o braku uprawnień
            showNotification('Błąd podczas usuwania. Tylko Administrator ma do tego uprawnienia.', 'danger');
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

    if (error) return <Alert variant="danger" className="mt-4 container-main-view">{error}</Alert>;

    return (
        <div className="mt-4 container-main-view">
            {/* Główne opakowanie karty (main-card-container) dla efektu ramki i tła */}
            <div className="main-card-container shadow border-0">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="section-title mb-0" style={{ color: 'var(--accent-cyan)' }}>
                        Wszystkie Urządzenia w Budynku
                    </h2>
                    <Badge bg="dark" className="p-2 border border-secondary text-light fw-normal">
                        Łącznie: {devices.length}
                    </Badge>
                </div>

                {devices.length === 0 ? (
                    <Alert variant="info" className="m-0">Brak urządzeń zarejestrowanych w systemie.</Alert>
                ) : (
                    <Table striped bordered hover variant="dark" responsive className="m-0 align-middle">
                        <thead>
                            <tr className="text-center">
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
                                    <td className="text-center text-muted" style={{ fontSize: '0.8rem' }}>#{device.id}</td>
                                    <td className="fw-bold" style={{ color: 'var(--accent-hover)' }}>{device.name}</td>
                                    <td className="text-center">
                                        <Badge bg="outline-light" className="border text-light fw-normal">
                                            {device.deviceType}
                                        </Badge>
                                    </td>
                                    <td className="text-center">
                                        {device.room ? (
                                            <span 
                                                className="text-info"
                                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                onClick={() => navigate(`/rooms/${device.room.id}/devices`)}
                                            >
                                                {device.room.name} (P{device.room.floor})
                                            </span>
                                        ) : <span className="text-muted small">Brak przypisania</span>}
                                    </td>
                                    <td className="text-center">
                                        <Badge bg={getStatusBadge(device.deviceStatus)}>
                                            {device.deviceStatus}
                                        </Badge>
                                    </td>
                                    <td className="text-center" style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>
                                        {device.properties || '-'}
                                    </td>
                                    <td className="text-center">
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
                )}
            </div>
        </div>
    );
};

export default AllDevices;