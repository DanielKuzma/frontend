import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Button, Badge, Card } from 'react-bootstrap';
import api from '../api';

const Automations = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
        } catch (err) {
            alert('Błąd podczas zmiany statusu reguły.');
        }
    };

    const handleDeleteRule = async (id) => {
        if (!window.confirm('Na pewno usunąć tę automatyzację?')) return;
        try {
            await api.delete(`/automation/rules/${id}`);
            fetchRules();
        } catch (err) {
            alert('Błąd podczas usuwania reguły.');
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

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <div className="mt-4">
            <h2 className="mb-4">Globalne Automatyzacje</h2>
            
            {rules.length === 0 ? (
                <Alert variant="info">Nie masz jeszcze żadnych reguł. Dodaj je z poziomu karty urządzenia.</Alert>
            ) : (
                <Card className="shadow bg-dark">
                    <Table striped bordered hover variant="dark" responsive className="m-0">
                        <thead>
                            <tr>
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
                                    <td className="fw-bold" style={{ color: 'var(--accent-cyan)' }}>{rule.name}</td>
                                    <td>{rule.sensor ? rule.sensor.name : 'Nieznany'}</td>
                                    <td>
                                        <Badge bg="secondary" className="fs-6">
                                            {formatOperator(rule.operator)} {rule.threshold}
                                        </Badge>
                                    </td>
                                    <td>{rule.targetDevice ? rule.targetDevice.name : 'Nieznane'}</td>
                                    <td>
                                        {/* POPRAWKA: Ładne wyświetlanie akcji (ON lub OFF) wyciągane z naszego Payloadu */}
                                        <Badge 
                                            bg={rule.actionPayload === 'ON' ? 'info' : 'secondary'} 
                                            text={rule.actionPayload === 'ON' ? 'dark' : 'light'}
                                        >
                                            Zmień na: {rule.actionPayload || 'Nieznany'}
                                        </Badge>
                                    </td>
                                    <td>
                                        {rule.enabled ? (
                                            <Badge bg="success">Aktywna</Badge>
                                        ) : (
                                            <Badge bg="danger">Uśpiona</Badge>
                                        )}
                                    </td>
                                    <td>
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
                </Card>
            )}
        </div>
    );
};

export default Automations;