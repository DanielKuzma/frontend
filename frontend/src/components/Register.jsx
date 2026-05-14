import React, { useState } from 'react';
import { Card, Form, Button, Container } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useNotification } from '../NotificationContext'; // <-- Import globalnego hooka

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    const navigate = useNavigate();
    // Wyciągamy funkcję do wyświetlania powiadomień
    const { showNotification } = useNotification();

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post('/auth/signup', { username, password });
            
            if (response.data === "User already exists!") {
                // Globalne powiadomienie zamiast lokalnego błędu
                showNotification('Taki użytkownik już istnieje! Wybierz inną nazwę.', 'warning');
            } else {
                // Udana rejestracja - eleganckie powiadomienie i przekierowanie
                showNotification('Rejestracja zakończona sukcesem! Zaloguj się.', 'success');
                navigate('/auth/signin'); 
            }
        } catch (err) {
            // Globalne powiadomienie o błędzie
            showNotification('Wystąpił błąd podczas rejestracji. Hasło musi mieć min. 3 znaki.', 'danger');
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div className="w-100" style={{ maxWidth: "400px" }}>
                <Card className="shadow border-0" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}>
                    <Card.Body className="p-4">
                        <h2 className="text-center mb-4 fw-bold" style={{ color: 'var(--accent-cyan)' }}>Rejestracja</h2>
                        
                        <Form onSubmit={handleRegister}>
                            <Form.Group className="mb-3">
                                <Form.Label style={{ color: 'var(--text-sub)' }}>Nazwa użytkownika</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    required 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label style={{ color: 'var(--text-sub)' }}>Hasło (min. 3 znaki)</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid #334155' }}
                                />
                            </Form.Group>

                            <Button variant="primary" type="submit" className="w-100 mb-3 fw-bold">
                                Zarejestruj się
                            </Button>

                            <div className="text-center mt-3" style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
                                Masz już konto?{' '}
                                <Link to="/auth/signin" style={{ color: 'var(--accent-hover)', fontWeight: 'bold', textDecoration: 'none' }}>
                                    Zaloguj się
                                </Link>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        </Container>
    );
};

export default Register;