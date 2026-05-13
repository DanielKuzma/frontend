import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import Rooms from './components/Rooms';
import Devices from './components/Devices';
import Users from './components/Users';
import Register from './components/Register';
import Profile from './components/Profile';
import AllDevices from './components/AllDevices';
import Sensors from './components/Sensors';
import Automations from "./components/Automations";
import Schedules from './components/Schedules';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLICZNA ŚCIEŻKA LOGOWANIA - Zgodnie z Twoim życzeniem adres to /auth/signin */}
        <Route 
          path="/auth/signin" 
          element={!token ? <Login setToken={setToken} /> : <Navigate to="/" />} 
        />
        <Route 
        path="/auth/signup" 
        element={!token ? <Register /> : <Navigate to="/" />} 
        />

        {/* CHRONIONE ŚCIEŻKI - Wymagają posiadania tokenu */}
        <Route 
          path="/" 
          element={token ? <Layout handleLogout={handleLogout} /> : <Navigate to="/auth/signin" />}
        >
            {/* Domyślny widok po zalogowaniu */}
            <Route index element={
              <div>
                <h2>Dashboard</h2>
                <p style={{ color: 'var(--text-sub)' }}>Wybierz interesującą Cię zakładkę z górnego menu.</p>
              </div>
            } />
            
            <Route path="rooms" element={<Rooms />} />
            <Route path="devices/rooms/:roomId" element={<Devices />} />
            <Route path="users" element={<Users />} />
            <Route path="users/me" element={<Profile />} />
            <Route path="devices" element={<AllDevices />} />
            <Route path="sensors" element={<Sensors />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/schedules" element={<Schedules />} />
        </Route>

        {/* Jeśli ktoś wpisze zły adres, wyrzucamy go na stronę główną lub do logowania */}
        <Route path="*" element={<Navigate to={token ? "/" : "/auth/signin"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;