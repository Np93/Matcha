import React from 'react';
import ReactDOM from 'react-dom/client'; // Importez "react-dom/client" pour React 18
import App from './App';

// Récupérer l'élément root dans le DOM
const rootElement = document.getElementById('root');

// Créez un root React
const root = ReactDOM.createRoot(rootElement);

// Rendre l'application dans le root React
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);