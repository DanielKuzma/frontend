import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../api';

const SensorChart = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [readings, setReadings] = useState([]);
    const [sensorInfo, setSensorInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(() => {
            fetchData();
        }, 3000); // Odświeżanie na żywo co 3s

        return () => clearInterval(intervalId);
    }, [id]);

    const fetchData = async () => {
        try {
            // Pobieramy detale czujnika
            const sensorRes = await api.get('/sensors');
            const currentSensor = sensorRes.data.find(s => s.id.toString() === id);
            setSensorInfo(currentSensor);

            // Pobieramy historię odczytów z backendu
            const readingsRes = await api.get(`/sensors/readings/${id}`);
            
            // Formatujemy dane pod wykres
            const formattedData = readingsRes.data.map(reading => {
                
                // --- KULOODPORNY PARSER DATY ---
                // Szukamy pola daty pod różnymi popularnymi nazwami z Spring Boota
                const rawTime = reading.timestamp || reading.createdAt || reading.time || reading.date || reading.localDateTime;
                
                let date;
                if (!rawTime) {
                    date = new Date(); // Fallback, gdyby w ogóle nie było daty
                } else if (Array.isArray(rawTime)) {
                    // Java wysyła tablicę: [rok, miesiąc, dzień, godzina, minuta, sekunda]
                    const [year, month, day, hour, minute, second] = rawTime;
                    date = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
                } else {
                    // Jeśli to tekst, sprawdzamy czy nie brakuje literki 'T'
                    let timeStr = String(rawTime);
                    if (timeStr.includes(' ') && !timeStr.includes('T')) {
                        timeStr = timeStr.replace(' ', 'T');
                    }
                    date = new Date(timeStr);
                }

                // Formatowanie do postaci HH:mm:ss
                let timeString = '--:--:--';
                if (!isNaN(date.getTime())) {
                    timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                } else {
                    // BRUTAL FALLBACK: Jeśli JS wciąż nie rozumie daty, wyciągamy samą godzinę z tekstu
                    const match = String(rawTime).match(/\d{2}:\d{2}:\d{2}/);
                    if (match) timeString = match[0];
                }
                // --------------------------------

                // Dla czujników ON/OFF (np. ruch) mapujemy tekst na wartości 1 i 0 dla osi Y
                let numValue = reading.value;
                if (reading.valueText) {
                    numValue = (reading.valueText === 'ON' || reading.valueText === 'LOCK') ? 1 : 0;
                }

                return {
                    time: timeString,
                    Wartość: numValue,
                    Tekst: reading.valueText || null
                };
            });

            // Bierzemy tylko ostatnie 20 odczytów, żeby wykres był czytelny
            setReadings(formattedData.slice(-20));
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Błąd pobierania danych do wykresu.');
            setLoading(false);
        }
    };

    // Niestandardowy dymek (Tooltip) najechania myszką
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <div className="custom-tooltip p-3 rounded" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--accent-cyan)' }}>
                    <p className="label fw-bold mb-1" style={{ color: 'var(--text-main)' }}>Godzina: {label}</p>
                    <p className="intro mb-0" style={{ color: 'var(--accent-cyan)' }}>
                        Odczyt: {dataPoint.Tekst !== null ? dataPoint.Tekst : `${dataPoint.Wartość} ${sensorInfo?.unit || ''}`}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) return <Spinner animation="border" style={{ color: 'var(--accent-cyan)' }} className="d-block mx-auto mt-5" />;
    if (error) return <Alert variant="danger" className="mt-4 container-main-view">{error}</Alert>;

    const isBinaryChart = sensorInfo && (sensorInfo.type === 'MOTION' || sensorInfo.type === 'DOOR_WINDOW');

    return (
        <div className="mt-4 container-main-view">
            <Button variant="outline-secondary" className="mb-4" onClick={() => navigate('/sensors')}>
                &larr; Wróć do listy czujników
            </Button>

            <div className="main-card-container shadow border-0 p-4">
                <div className="mb-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="section-title mb-1" style={{ color: 'var(--accent-cyan)' }}>
                            Odczyty na żywo: {sensorInfo?.name}
                        </h2>
                        <span className="text-muted">
                            Typ: <Badge bg="info" className="text-dark me-2">{sensorInfo?.type}</Badge>
                            Jednostka: <Badge bg="secondary">{sensorInfo?.unit}</Badge>
                        </span>
                    </div>
                    {readings.length > 0 && (
                        <div className="text-end">
                            <p className="text-muted small mb-1">Ostatni odczyt:</p>
                            <h3 className="fw-bold m-0" style={{ color: 'var(--accent-hover)' }}>
                                {readings[readings.length - 1].Tekst !== null ? readings[readings.length - 1].Tekst : readings[readings.length - 1].Wartość} {sensorInfo?.unit}
                            </h3>
                        </div>
                    )}
                </div>

                {readings.length === 0 ? (
                    <Alert variant="warning" className="text-center py-5 m-0">
                        Ten czujnik nie wysłał jeszcze żadnych danych.
                    </Alert>
                ) : (
                    <div style={{ width: '100%', height: 400, backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: '15px', padding: '20px' }}>
                        <ResponsiveContainer>
                            <AreaChart data={readings} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="time" stroke="var(--text-sub)" tick={{ fill: 'var(--text-sub)' }} />
                                
                                <YAxis 
                                    stroke="var(--text-sub)" 
                                    tick={{ fill: 'var(--text-sub)' }} 
                                    domain={isBinaryChart ? [0, 1.2] : ['auto', 'auto']}
                                    ticks={isBinaryChart ? [0, 1] : undefined}
                                />
                                
                                <Tooltip content={<CustomTooltip />} />
                                <Area 
                                    type={isBinaryChart ? "stepAfter" : "monotone"} 
                                    dataKey="Wartość" 
                                    stroke="var(--accent-cyan)" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorValue)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SensorChart;