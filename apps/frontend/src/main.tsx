// @ts-expect-error React types are provided by the project dependencies.
import { StrictMode, createElement } from 'react'
// @ts-expect-error React DOM types are provided by the project dependencies.
import { createRoot } from 'react-dom/client'
// @ts-expect-error CSS modules are handled by the bundler.
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  createElement(StrictMode, null, createElement(App)),
)
