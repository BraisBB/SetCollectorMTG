import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'mana-font/css/mana.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
