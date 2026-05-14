// frontend/src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; 

// Importy komponentów logowania
import Login from './components/Login';
import Register from './components/Register';

// Importy widoków prywatnych
import Layout from './components/Layout';
import Dashboard from './components/Dashboard'; 
import Profile from './components/Profile';
import Rooms from './components/Rooms';
import Devices from './components/Devices';
import AllDevices from './components/AllDevices';
import Sensors from './components/Sensors';
import Automations from './components/Automations';
import Schedules from './components/Schedules';
import EventLogs from './components/EventLogs';
import Users from './components/Users';

// IMPORT KONTEKSTU POWIADOMIEŃ
import { NotificationProvider } from './NotificationContext';

function App() {
    const [token, setToken] = useState(localStorage.getItem('token') || '');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setToken('');
    };

    return (
        // OWIJAMY CAŁĄ APLIKACJĘ DOSTAWCĄ POWIADOMIEŃ
        <NotificationProvider>
            <Router>
                <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', color: 'white' }}>
                    <Routes>
                        {!token ? (
                            <>
                                <Route path="/auth/signin" element={<Login setToken={setToken} />} />
                                <Route path="/auth/signup" element={<Register />} />
                                <Route path="*" element={<Navigate to="/auth/signin" />} />
                            </>
                        ) : (
                            <Route element={<Layout handleLogout={handleLogout} />}>
                                <Route path="/" element={<Dashboard />} />
                                
                                <Route path="/rooms" element={<Rooms />} />
                                <Route path="/rooms/:roomId/devices" element={<Devices />} />
                                <Route path="/devices" element={<AllDevices />} />
                                <Route path="/users/me" element={<Profile />} />
                                <Route path="/sensors" element={<Sensors />} />
                                <Route path="/automations" element={<Automations />} />
                                
                                <Route path="/schedules" element={<Schedules />} />
                                <Route path="/logs" element={<EventLogs />} />
                                <Route path="/users" element={<Users />} />
                                
                                <Route path="*" element={<Navigate to="/" />} />
                            </Route>
                        )}
                    </Routes>
                </div>
            </Router>
        </NotificationProvider>
    );
}

export default App;