// frontend/src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// 1. Domyślny CSS Bootstrapa (ładuje standardowe style)
import 'bootstrap/dist/css/bootstrap.min.css';

// 2. Twój własny motyw (ładuje zmienne i nadpisuje standardowe style)
// TO MUSI BYĆ PONIŻEJ IMPORTU BOOTSTRAPA!
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)