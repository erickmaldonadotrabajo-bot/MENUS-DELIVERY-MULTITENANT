import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Menu from './pages/Menu';
import MenuImagenes from './pages/MenuImagenes'; 
import Admin from './pages/Admin'; 
import SuperAdmin from './pages/SuperAdmin'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Rutas de las tiendas */}
        <Route path="/home" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/menu-imagenes" element={<MenuImagenes />} />
        
        {/* Panel de administración de cada cliente */}
        <Route path="/admin" element={<Admin />} />
        
        {/* RUTA DEL PANEL MASTER (Super Admin) */}
        <Route path="/sistema-master-99" element={<SuperAdmin />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;