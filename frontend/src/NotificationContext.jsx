import React, { createContext, useState, useContext } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

// Tworzymy kontekst
const NotificationContext = createContext();

// Własny hook, żeby łatwo używać powiadomień w innych plikach
export const useNotification = () => useContext(NotificationContext);

// Główny komponent dostarczający powiadomienia
export const NotificationProvider = ({ children }) => {
    const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

    // Funkcja wywoływana z dowolnego miejsca w aplikacji
    const showNotification = (message, variant = 'success') => {
        setToast({ show: true, message, variant });
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            
            {/* Ten Toast renderuje się tylko raz dla całej aplikacji */}
            <ToastContainer position="bottom-end" className="p-4" style={{ zIndex: 9999, position: 'fixed' }}>
                <Toast 
                    onClose={() => setToast({ ...toast, show: false })} 
                    show={toast.show} 
                    delay={4000} 
                    autohide 
                    bg={toast.variant}
                    className="shadow-lg border-0"
                >
                    <Toast.Header 
                        className="border-0 bg-transparent" 
                        closeVariant={toast.variant === 'warning' || toast.variant === 'light' ? undefined : 'white'}
                    >
                        <strong 
                            className={`me-auto ${toast.variant === 'warning' || toast.variant === 'light' ? 'text-dark' : 'text-white'}`}
                        >
                            Smart Building
                        </strong>
                    </Toast.Header>
                    <Toast.Body className={toast.variant === 'warning' || toast.variant === 'light' ? 'text-dark fw-bold' : 'text-white fw-bold'}>
                        {toast.message}
                    </Toast.Body>
                </Toast>
            </ToastContainer>
        </NotificationContext.Provider>
    );
};