// --- App.jsx ---
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 1. IMPORTACIONES PEREZOSAS (Code Splitting estricto)
const Home = lazy(() => import('./pages/Home'));
const Menu = lazy(() => import('./pages/Menu'));
const MenuImagenes = lazy(() => import('./pages/MenuImagenes')); 
const Admin = lazy(() => import('./pages/Admin')); 
const SuperAdmin = lazy(() => import('./pages/SuperAdmin')); 

// 2. COMPONENTE DE CARGA (Fallback)
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      {/*SUSPENSE: Detiene el renderizado hasta que el chunk JS se haya descargado */}
      <Suspense fallback={<PageLoader />}>

        <Routes>

          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/menu-imagenes" element={<MenuImagenes />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/sistema-master-99" element={<SuperAdmin />} /> 
        
        </Routes>

      </Suspense>
    </BrowserRouter>
  );
}

export default App;