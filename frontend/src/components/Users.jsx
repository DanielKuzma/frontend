import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert, Form } from 'react-bootstrap';
import api from '../api';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Lista ról dostępnych w Twoim systemie (Enum Role)
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
            // Wywołujemy Twój @PatchMapping("/{id}") z @RequestParam Role role
            await api.patch(`/users/${userId}?role=${newRole}`);
            fetchUsers(); // Odświeżamy listę, żeby zobaczyć zmiany
        } catch (err) {
            alert('Nie udało się zmienić roli. Sprawdź uprawnienia.');
        }
    };

    if (loading) return <Spinner animation="border" variant="info" />;
    if (error) return <Alert variant="danger" className="mt-3">{error}</Alert>;

    return (
        <div className="mt-4">
            <h2 className="mb-4">Zarządzanie Użytkownikami</h2>
            <Table striped bordered hover variant="dark" responsive className="shadow">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nazwa użytkownika</th>
                        <th>Aktualna Rola</th>
                        <th>Akcja (Zmień rolę)</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.username}</td>
                            <td>
                                <span className={`badge ${user.role === 'ADMIN' ? 'bg-danger' : 'bg-success'}`}>
                                    {user.role}
                                </span>
                            </td>
                            <td>
                                <Form.Select 
                                    size="sm" 
                                    className="bg-dark text-white border-secondary"
                                    defaultValue={user.role}
                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
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
    );
};

export default Users;