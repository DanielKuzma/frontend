import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../api';

const Login = ({ setToken }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); // reset błędu

        try {
            // ZMIANA 1: Używamy endpointu /auth/signin zdefiniowanego w Javie
            const response = await api.post('/auth/signin', { username, password });
            
            // ZMIANA 2: Backend zwraca po prostu czystego Stringa z tokenem!
            const token = response.data; 
            
            localStorage.setItem('token', token);
            // Ponieważ backend nie zwraca obiektu user, zapiszemy sobie chociaż nazwę z formularza
            localStorage.setItem('username', username); 
            
            // Informujemy główną aplikację, że jesteśmy zalogowani
            setToken(token);
        } catch (err) {
            setError('Błędny login lub hasło! Spróbuj ponownie.');
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
            <div className="w-100" style={{ maxWidth: "400px" }}>
                <Card className="shadow">
                    <Card.Body>
                        <h2 className="text-center mb-4">Smart Building API</h2>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Form onSubmit={handleLogin}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nazwa użytkownika</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    required 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)} 
                                />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label>Hasło</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    required 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                />
                            </Form.Group>
                            <Button className="w-100" type="submit">Zaloguj się</Button>
                            <div className="text-center mt-3" style={{ color: '#E0E0E0', fontSize: '0.9rem' }}>
                                Nie masz konta? <Link to="/auth/signup" style={{ color: '#00E5FF', fontWeight: 'bold', textDecoration: 'none' }}>Zarejestruj się</Link>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        </Container>
    );
};

export default Login;