import React, { useState } from 'react';
import { Card, Form, Button, Alert, Container } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            // Zgodnie z Twoim AuthController.java uderzamy w /auth/signup
            const response = await api.post('/auth/signup', { username, password });
            
            // Twój backend zwraca Stringa. Sprawdzamy co dokładnie powiedział.
            if (response.data === "User already exists!") {
                setError('Taki użytkownik już istnieje! Wybierz inną nazwę.');
            } else {
                setMessage('Rejestracja zakończona sukcesem! Możesz się teraz zalogować.');
                // Po udanej rejestracji czyścimy formularz
                setUsername('');
                setPassword('');
            }
        } catch (err) {
            setError('Wystąpił błąd podczas rejestracji. Hasło musi mieć min. 3 znaki.');
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <Card style={{ width: '400px', backgroundColor: 'var(--card-bg)' }} className="p-4 shadow-lg text-white">
                <Card.Body>
                    <h2 className="text-center mb-4" style={{ color: 'var(--accent-hover)' }}>Rejestracja</h2>
                    
                    {error && <Alert variant="danger">{error}</Alert>}
                    {message && <Alert variant="success">{message}</Alert>}

                    <Form onSubmit={handleRegister}>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: 'var(--text-sub)' }}>Nazwa użytkownika</Form.Label>
                            <Form.Control 
                                type="text" 
                                required 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label style={{ color: 'var(--text-sub)' }}>Hasło (min. 3 znaki)</Form.Label>
                            <Form.Control 
                                type="password" 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100 mb-3">
                            Zarejestruj się
                        </Button>

                        <div className="text-center mt-3" style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
                            Masz już konto? <Link to="/auth/signin" style={{ color: 'var(--accent-cyan)' }}>Zaloguj się</Link>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Register;