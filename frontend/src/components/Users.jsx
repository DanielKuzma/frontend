import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Form, Badge } from 'react-bootstrap';
import api from '../api';
import { useNotification } from '../NotificationContext'; // <-- Import globalnego hooka

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Wyciągamy funkcję do globalnych powiadomień
    const { showNotification } = useNotification();

    // Lista ról dostępnych w systemie
    const availableRoles = ['ADMIN', 'BUILDING_MANAGER', 'RESIDENT'];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            setError('Brak uprawnień lub błąd serwera. Tylko Administrator może przeglądać tę listę.');
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.patch(`/users/${userId}?role=${newRole}`);
            fetchUsers(); // Odświeżamy listę, żeby zobaczyć zmiany
            
            // Powiadomienie o sukcesie
            showNotification('Pomyślnie zmieniono rolę użytkownika.', 'success');
        } catch (err) {
            // Zastąpiono alert() globalnym powiadomieniem o błędzie
            showNotification('Nie udało się zmienić roli. Sprawdź uprawnienia.', 'danger');
        }
    };

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} className="d-block mx-auto mt-5" />;
    if (error) return <Alert variant="danger" className="mt-4 container-main-view">{error}</Alert>;

    return (
        <div className="mt-4 container-main-view">
            {/* Główne opakowanie karty (main-card-container) dla efektu ramki i tła */}
            <div className="main-card-container shadow border-0">
                <h2 className="section-title mb-4" style={{ color: 'var(--accent-cyan)' }}>
                    Zarządzanie Użytkownikami
                </h2>
                
                <Table striped bordered hover variant="dark" responsive className="m-0 align-middle">
                    <thead>
                        <tr className="text-center">
                            <th>ID</th>
                            <th>Nazwa użytkownika</th>
                            <th>Aktualna Rola</th>
                            <th>Akcja (Zmień rolę)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="text-center text-muted" style={{ fontSize: '0.8rem' }}>{user.id}</td>
                                <td className="fw-bold" style={{ color: 'var(--accent-hover)' }}>{user.username}</td>
                                <td className="text-center">
                                    <Badge 
                                        bg={user.role === 'ADMIN' ? 'danger' : user.role === 'BUILDING_MANAGER' ? 'warning' : 'success'} 
                                        text={user.role === 'BUILDING_MANAGER' ? 'dark' : 'light'}
                                    >
                                        {user.role}
                                    </Badge>
                                </td>
                                <td className="text-center">
                                    <Form.Select 
                                        size="sm" 
                                        className="bg-dark text-white border-secondary"
                                        defaultValue={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        style={{ minWidth: '150px', margin: '0 auto' }}
                                    >
                                        {availableRoles.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </Form.Select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};

export default Users;