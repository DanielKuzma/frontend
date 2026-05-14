import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Button, Badge, Card } from 'react-bootstrap';
import api from '../api';
import { useNotification } from '../NotificationContext'; // <-- Import globalnego hooka

const Automations = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const { showNotification } = useNotification(); // <-- Wyciągamy funkcję powiadomień

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const response = await api.get('/automation/rules');
            setRules(response.data);
            setLoading(false);
        } catch (err) {
            setError('Błąd pobierania reguł automatyzacji. Zaloguj się ponownie.');
            setLoading(false);
        }
    };

    const handleToggleRule = async (id) => {
        try {
            await api.post(`/automation/rules/${id}`);
            fetchRules();
            // Powiadomienie o sukcesie
            showNotification('Zmieniono status reguły automatyzacji.', 'success');
        } catch (err) {
            // Zastąpiono alert() powiadomieniem o błędzie
            showNotification('Błąd podczas zmiany statusu reguły.', 'danger');
        }
    };

    const handleDeleteRule = async (id) => {
        if (!window.confirm('Na pewno usunąć tę automatyzację?')) return;
        try {
            await api.delete(`/automation/rules/${id}`);
            fetchRules();
            // Powiadomienie o pomyślnym usunięciu
            showNotification('Pomyślnie usunięto regułę automatyzacji.', 'success');
        } catch (err) {
            // Zastąpiono alert() powiadomieniem o błędzie
            showNotification('Błąd podczas usuwania reguły.', 'danger');
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

    const userRole = localStorage.getItem('role'); // upewnij się, że przy logowaniu zapisujesz rolę do localStorage

    useEffect(() => {
        // Jeśli użytkownik to mieszkaniec, nie próbuj nawet pobierać reguł
        if (userRole === 'RESIDENT') {
            setLoading(false);
            return;
        }
        fetchRules();
    }, []);

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} className="d-block mx-auto mt-5" />;
    if (error) return <Alert variant="danger" className="mt-4 container-main-view">{error}</Alert>;
    if (userRole === 'RESIDENT') {
        return (
            <div className="mt-4 container-main-view">
                <div className="main-card-container shadow border-0 p-5 text-center">
                    <h2 style={{ color: 'var(--accent-cyan)' }}>Automatyzacje</h2>
                    <p className="text-muted mt-4">
                        Tylko Zarządca lub Administrator może zarządzać regułami automatyzacji budynku.
                        Twoje uprawnienia (Mieszkaniec) pozwalają jedynie na bezpośrednie sterowanie urządzeniami.
                    </p>
                </div>
            </div>
        );
    }
    return (
        <div className="mt-4 container-main-view">
            {/* Główne opakowanie karty (main-card-container) dla efektu ramki i tła */}
            <div className="main-card-container shadow border-0">
                <h2 className="section-title mb-4" style={{ color: 'var(--accent-cyan)' }}>
                    Globalne Automatyzacje
                </h2>
                
                {rules.length === 0 ? (
                    <Alert variant="info" className="m-0">
                        Nie masz jeszcze żadnych reguł. Dodaj je z poziomu karty urządzenia.
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
                            {rules.map(rule => (
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
                                            bg={rule.actionPayload === 'ON' ? 'info' : 'secondary'} 
                                            text={rule.actionPayload === 'ON' ? 'dark' : 'light'}
                                            className="px-2 py-2"
                                        >
                                            Zmień na: {rule.actionPayload || '???'}
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
                            ))}
                        </tbody>
                    </Table>
                )}
            </div>
        </div>
    );
};

export default Automations;