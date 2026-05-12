import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Container, Badge } from 'react-bootstrap';
import api from '../api';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Uderzamy dokładnie w Twój endpoint /api/users/me
                const response = await api.get('/users/me');
                setProfile(response.data);
                setLoading(false);
            } catch (err) {
                setError('Nie udało się pobrać danych profilu.');
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <Container className="mt-4 d-flex flex-column align-items-center">
            <h2 className="mb-4 w-100" style={{ maxWidth: '500px' }}>Mój Profil</h2>
            <Card className="shadow w-100" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', maxWidth: '500px' }}>
                <Card.Body>
                    <Card.Title style={{ color: 'var(--accent-cyan)', fontSize: '1.5rem' }} className="mb-3">
                        Witaj, {profile.username}!
                    </Card.Title>
                    <hr style={{ borderColor: '#3A475C' }} />
                    <div style={{ color: 'var(--text-sub)', fontSize: '1.1rem' }}>
                        <p className="mb-2"><strong>ID w systemie:</strong> {profile.id}</p>
                        <p className="mb-0 d-flex align-items-center">
                            <strong className="me-2">Twoja rola:</strong> 
                            <Badge 
                                bg={profile.role === 'ADMIN' ? 'danger' : profile.role === 'BUILDING_MANAGER' ? 'warning' : 'success'}
                            >
                                {profile.role}
                            </Badge>
                        </p>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Profile;