import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Badge } from 'react-bootstrap';
import api from '../api';
import { useNotification } from '../NotificationContext'; // <-- Import globalnego hooka

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Wyciągamy funkcję do globalnych powiadomień
    const { showNotification } = useNotification();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Uderzamy dokładnie w Twój endpoint /api/users/me
                const response = await api.get('/users/me');
                setProfile(response.data);
                setLoading(false);
            } catch (err) {
                setError('Wystąpił problem.');
                setLoading(false);
                // Globalne powiadomienie o błędzie
                showNotification('Nie udało się pobrać danych profilu. Spróbuj odświeżyć stronę.', 'danger');
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} className="d-block mx-auto mt-5" />;
    
    // Opcjonalne zabezpieczenie, jeśli profil jest nullem pomimo braku ładowania
    if (error || !profile) return <Alert variant="danger" className="mt-4 container-main-view">Błąd ładowania profilu.</Alert>;

    return (
        <div className="mt-4 container-main-view">
            {/* Główne opakowanie karty dla zachowania spójności z resztą aplikacji */}
            <div className="main-card-container shadow border-0">
                <h2 className="section-title mb-4" style={{ color: 'var(--accent-cyan)' }}>
                    Mój Profil
                </h2>
                
                {/* Wyśrodkowana, wewnętrzna karta profilu */}
                <div className="d-flex justify-content-center py-4">
                    <Card className="shadow-sm w-100" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid #334155', maxWidth: '500px' }}>
                        <Card.Body className="p-4">
                            <Card.Title style={{ color: 'var(--accent-cyan)', fontSize: '1.5rem' }} className="mb-3 fw-bold">
                                Witaj, {profile.username}!
                            </Card.Title>
                            
                            <hr style={{ borderColor: '#334155' }} />
                            
                            <div style={{ color: 'var(--text-sub)', fontSize: '1.1rem' }}>
                                <p className="mb-3">
                                    <strong>ID w systemie:</strong> <span style={{ color: 'var(--text-main)' }}>{profile.id}</span>
                                </p>
                                <p className="mb-0 d-flex align-items-center">
                                    <strong className="me-2">Twoja rola:</strong> 
                                    <Badge 
                                        bg={profile.role === 'ADMIN' ? 'danger' : profile.role === 'BUILDING_MANAGER' ? 'warning' : 'success'}
                                        text={profile.role === 'BUILDING_MANAGER' ? 'dark' : 'light'}
                                        className="px-3 py-2 fw-normal"
                                    >
                                        {profile.role}
                                    </Badge>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Profile;