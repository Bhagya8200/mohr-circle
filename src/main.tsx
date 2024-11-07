import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MohrCircleVisualization from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MohrCircleVisualization />
  </StrictMode>,
)