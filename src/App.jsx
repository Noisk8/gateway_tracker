import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import NodeDetail from './pages/NodeDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/nodo/:slug" element={<NodeDetail />} />
      </Routes>
    </BrowserRouter>
  )
}
