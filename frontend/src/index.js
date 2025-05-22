import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import axios from 'axios';

// ✅ Global Axios Interceptor to suppress 401
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Option 1: Return null (or any dummy value your app can handle)
      return Promise.resolve(null);

      // Option 2: Hang the promise forever (not recommended unless you're sure)
      // return new Promise(() => {});
    }
    return Promise.reject(error);
  }
);

// ✅ Suppress unhandled promise rejections from 401
window.addEventListener('unhandledrejection', e => {
  const status = e.reason?.response?.status;
  if (status === 401) {
    e.preventDefault(); // prevent logging the error
  }
});

// Mount React app
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
