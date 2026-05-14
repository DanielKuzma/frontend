import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Badge, Card, Form, InputGroup } from 'react-bootstrap';
import api from '../api';
import { useNotification } from '../NotificationContext'; // <-- Import globalnego hooka

const ExpandableText = ({ text }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    if (!text) return null;
    let strVal = String(text);
    if (strVal === 'Optional.empty') return <span>Brak</span>;

    const maxLength = 35;

    if (strVal.length <= maxLength) {
        return <span>{strVal}</span>;
    }

    return (
        <div className="d-flex flex-column align-items-center">
            <span style={{ 
                wordBreak: isExpanded ? 'break-word' : 'normal', 
                whiteSpace: isExpanded ? 'normal' : 'nowrap',
                maxWidth: '250px' 
            }}>
                {isExpanded ? strVal : `${strVal.substring(0, maxLength)}...`}
            </span>
            <Badge 
                bg="secondary" 
                className="mt-1"
                style={{ cursor: 'pointer', fontSize: '0.6rem', opacity: '0.8' }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? 'Zwiń' : 'Rozwiń'}
            </Badge>
        </div>
    );
};

const EventLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const { showNotification } = useNotification(); // <-- Wyciągamy funkcję powiadomień

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await api.get('/logs'); 
            const sortedLogs = response.data.sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp));
            setLogs(sortedLogs);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Błąd pobierania logów. Sprawdź, czy ścieżka API jest poprawna.');
            setLoading(false);
            // Globalne powiadomienie o błędzie ładowania
            showNotification('Nie udało się załadować dziennika zdarzeń.', 'danger');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('pl-PL', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const getLogTypeBadge = (logType) => {
        switch (logType) {
            case 'ERROR': return <Badge bg="danger">BŁĄD</Badge>;
            case 'WARNING': return <Badge bg="warning" text="dark">OSTRZEŻENIE</Badge>;
            case 'INFO': return <Badge bg="info" text="dark">INFO</Badge>;
            default: return <Badge bg="secondary">{logType}</Badge>;
        }
    };

    const getSourceBadge = (source) => {
        switch (source) {
            case 'USER': return <Badge bg="primary">Użytkownik</Badge>;
            case 'AUTOMATION': return <Badge bg="purple" style={{backgroundColor: '#6f42c1'}}>Automatyzacja</Badge>;
            case 'SCHEDULE': return <Badge bg="success">Harmonogram</Badge>;
            case 'SENSOR': return <Badge bg="teal" style={{backgroundColor: '#20c997'}}>Czujnik</Badge>;
            case 'DEVICE': return <Badge bg="secondary">Urządzenie</Badge>;
            case 'SYSTEM': return <Badge bg="dark" className="border border-secondary">System</Badge>;
            default: return <Badge bg="secondary">{source}</Badge>;
        }
    };

    const filteredLogs = logs.filter(log => {
        const searchString = `${log.eventType} ${log.entityType} ${log.description || ''} ${log.oldValue || ''} ${log.newValue || ''}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    const stickyHeaderStyle = {
        position: 'sticky',
        top: 0,
        backgroundColor: '#1E293B', 
        zIndex: 10, 
        boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
    };

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} className="d-block mx-auto mt-5" />;
    if (error) return <Alert variant="danger" className="mt-4 container-main-view">{error}</Alert>;

    return (
        <div className="mt-4 container-main-view">
            <div className="main-card-container shadow border-0">
                <h2 className="section-title mb-4" style={{ color: 'var(--accent-cyan)' }}>
                    Dziennik Zdarzeń
                </h2>
                
                <Card className="shadow bg-dark border-0 mb-4 p-3">
                    <InputGroup>
                        <InputGroup.Text className="input-group-text">Szukaj</InputGroup.Text>
                        <Form.Control
                            type="text"
                            placeholder="Szukaj po urządzeniu, akcji lub opisie..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                        />
                    </InputGroup>
                </Card>
                
                {filteredLogs.length === 0 ? (
                    <Alert variant="info" className="m-0">Dziennik jest pusty lub nic nie pasuje do wyszukiwania.</Alert>
                ) : (
                    <Card className="shadow border-0 overflow-hidden">
                        <div style={{ maxHeight: '60vh', overflow: 'auto' }} className="custom-scrollbar">
                            <Table striped bordered hover variant="dark" className="m-0 align-middle" size="sm">
                                <thead>
                                    <tr className="text-center">
                                        <th style={stickyHeaderStyle}>Data</th>
                                        <th style={stickyHeaderStyle}>Poziom</th>
                                        <th style={stickyHeaderStyle}>Źródło</th>
                                        <th style={stickyHeaderStyle}>Wydarzenie</th>
                                        <th style={stickyHeaderStyle}>Cel</th>
                                        <th style={stickyHeaderStyle}>Zmiana</th>
                                        <th style={stickyHeaderStyle}>Opis</th>
                                    </tr>
                                </thead>
                                <tbody style={{ fontSize: '0.9rem' }}>
                                    {filteredLogs.map(log => (
                                        <tr key={log.id} style={{ opacity: log.logType === 'ERROR' ? '1' : '0.85' }}>
                                            <td className="text-muted fw-bold text-nowrap text-center">{formatDate(log.timeStamp)}</td>
                                            <td className="text-center">{getLogTypeBadge(log.logType)}</td>
                                            <td className="text-center">{getSourceBadge(log.source)}</td>
                                            <td style={{ color: 'var(--accent-cyan)' }} className="fw-bold">
                                                {log.eventType}
                                            </td>
                                            <td>
                                                <span className="fw-bold">{log.entityType || '-'}</span> <br/>
                                                <small className="text-muted">ID: {log.entityId || '-'}</small>
                                            </td>
                                            
                                            <td className="text-center align-middle" style={{ minWidth: '180px' }}>
                                                {log.oldValue || log.newValue ? (
                                                    <div className="d-flex flex-column align-items-center justify-content-center">
                                                        {log.oldValue && (
                                                            <div className="text-danger text-decoration-line-through mb-1" style={{ fontSize: '0.85rem' }}>
                                                                <ExpandableText text={log.oldValue} />
                                                            </div>
                                                        )}
                                                        
                                                        {log.oldValue && log.newValue && (
                                                            <span className="text-muted my-1" style={{ fontSize: '0.7rem' }}>↓</span>
                                                        )}
                                                        
                                                        {log.newValue && (
                                                            <div className="text-success fw-bold mt-1" style={{ fontSize: '0.85rem' }}>
                                                                <ExpandableText text={log.newValue} />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : <span className="text-muted">-</span>}
                                            </td>
                                            
                                            <td style={{ maxWidth: '300px', whiteSpace: 'normal' }}>
                                                {log.description || '-'}
                                                {log.userId && <div className="mt-1"><small className="text-info">Użytkownik ID: {log.userId}</small></div>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default EventLogs;