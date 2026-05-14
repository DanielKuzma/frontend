import React, { useState } from 'react';
import { Container, Form, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../api';
import { useNotification } from '../NotificationContext'; // <-- Import globalnego hooka

const Login = ({ setToken }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // Wyciągamy funkcję do wyświetlania powiadomień
    const { showNotification } = useNotification();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            // Używamy endpointu /auth/signin zdefiniowanego w Javie
            const response = await api.post('/auth/signin', { username, password });
            
            // Backend zwraca po prostu czystego Stringa z tokenem
            const token = response.data; 
            
            localStorage.setItem('token', token);
            // Ponieważ backend nie zwraca obiektu user, zapiszemy sobie chociaż nazwę z formularza
            localStorage.setItem('username', username); 
            
            // Globalne powiadomienie o sukcesie (zostanie na ekranie nawet po przeładowaniu widoku!)
            showNotification('Pomyślnie zalogowano.', 'success');
            
            // Informujemy główną aplikację, że jesteśmy zalogowani
            setToken(token);
        } catch (err) {
            // Globalne powiadomienie o błędzie zamiast lokalnego Alertu
            showNotification('Błędny login lub hasło! Spróbuj ponownie.', 'danger');
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
            <div className="w-100" style={{ maxWidth: "400px" }}>
                {/* Dostosowanie karty do globalnego stylu */}
                <Card className="shadow border-0" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}>
                    <Card.Body className="p-4">
                        <h2 className="text-center mb-4 fw-bold" style={{ color: 'var(--accent-cyan)' }}>
                            Smart Building
                        </h2>
                        
                        <Form onSubmit={handleLogin}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nazwa użytkownika</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    required 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)} 
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label>Hasło</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    required 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                />
                            </Form.Group>
                            
                            <Button className="w-100 fw-bold" type="submit" variant="primary">
                                Zaloguj się
                            </Button>
                            
                            <div className="text-center mt-4" style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
                                Nie masz konta?{' '}
                                <Link to="/auth/signup" style={{ color: 'var(--accent-hover)', fontWeight: 'bold', textDecoration: 'none' }}>
                                    Zarejestruj się
                                </Link>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        </Container>
    );
};

export default Login;