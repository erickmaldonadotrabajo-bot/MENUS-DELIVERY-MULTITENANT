import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { getCleanDomain, isPremiumDomain } from '../utils/helpers';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useAdminData } from '../hooks/useAdminData';

import { limpiarTexto } from '../utils/adminHelpers';

// Componentes Modulares
import { AdminIcons } from '../components/admin/AdminIcons';
import { Ticket } from '../components/admin/Ticket';
import { OrderCard } from '../components/admin/OrderCard';
import { AdminModal } from '../components/admin/AdminModal';
import { InventoryView } from '../components/admin/InventoryView';
import { SettingsView } from '../components/admin/SettingsView';

const alertSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3');
alertSound.loop = true;

export default function Admin() {
    const [searchParams] = useSearchParams();
    const parametroTienda = searchParams.get('tienda');
    const premium = isPremiumDomain();
    const cleanHostname = getCleanDomain();

    // Hooks Arquitectónicos
    const { tiendaId, isAuthenticated, loadingAuth, authError, login, logout } = useAdminAuth(parametroTienda);
    const {
        tienda, updateStoreConfig, categories, updateLocalCategories, products, updateLocalProducts,
        orders, setOrders, historyOrders, stats, loadingData,
        hasNewOrder, setHasNewOrder, metricsDateFilter, setMetricsDateFilter, fetchTiendaData, loadHistory
    } = useAdminData(tiendaId, isAuthenticated);

    // Estados de UI y Navegación
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginErrorState, setLoginErrorState] = useState(false);
    
    const [view, setView] = useState('orders');
    const [activeCat, setActiveCat] = useState('Todas');
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState({open: false, type: null, editItem: null});
    const [ticketOrder, setTicketOrder] = useState(null);
    const [toastMsg, setToastMsg] = useState('');
    
    const [configForm, setConfigForm] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [logoUploadProgress, setLogoUploadProgress] = useState(0); 
    const [historyFilterDays, setHistoryFilterDays] = useState(1);
    const [historyFilterStatus, setHistoryFilterStatus] = useState('todos');

    const [autoPrint, setAutoPrint] = useState(() => localStorage.getItem('saas_autoprint') === 'true');
    const autoPrintRef = useRef(autoPrint);

    // Efectos Base
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            body { font-family: 'Poppins', sans-serif; background-color: #111827; color: white; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .animate-card { animation: fade-in-up 0.3s ease-out forwards; }
            @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
            .toggle-checkbox:checked { right: 0; border-color: #68D391; }
            .toggle-checkbox:checked + .toggle-label { background-color: #68D391; }
            .loader { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #f97316; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto;}
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @media print {
                @page { size: 58mm auto; margin: 0mm; }
                body { margin: 0; padding: 0; background-color: white; }
                body * { visibility: hidden; height: 0; overflow: hidden; }
                #ticket-area { visibility: visible; position: absolute; left: 0 !important; top: 0 !important; width: 58mm !important; height: auto !important; overflow: visible !important; padding: 5px 10px 20px 5px; z-index: 9999; background-color: white !important; color: black !important; font-family: 'Courier New', Courier, monospace; line-height: 1.1; }
                #ticket-area * { visibility: visible; height: auto; color: black !important; }
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    useEffect(() => { if (tienda) setConfigForm(tienda); }, [tienda]);

    useEffect(() => {
        localStorage.setItem('saas_autoprint', autoPrint);
        autoPrintRef.current = autoPrint;
    }, [autoPrint]);

    useEffect(() => {
        const handleNewOrderEvent = (e) => {
            alertSound.play().catch(err => console.log("Audio block:", err));
            if (autoPrintRef.current) {
                setTicketOrder(e.detail);
                setTimeout(() => window.print(), 800);
            }
        };
        window.addEventListener('newOrderReceived', handleNewOrderEvent);
        return () => window.removeEventListener('newOrderReceived', handleNewOrderEvent);
    }, []);

    const showToast = useCallback((msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); }, []);
    const acknowledgeNewOrder = () => { setHasNewOrder(false); alertSound.pause(); alertSound.currentTime = 0; };

    // Acciones de Login y Configuración
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setLoginErrorState(false);
        try { await login(email, password); } 
        catch (err) { setLoginErrorState(true); } 
        finally { setIsLoggingIn(false); }
    };

    const toggleStore = async () => { 
        const newState = !tienda.abierto; 
        updateStoreConfig({ abierto: newState });
        try {
            const { error } = await supabase.from('tiendas').update({ abierto: newState }).eq('id', tiendaId); 
            if(error) throw error;
            showToast(newState ? "✅ Tienda ABIERTA" : "🛑 Tienda CERRADA");
        } catch (err) {
            showToast("Error de red."); 
            updateStoreConfig({ abierto: !newState });
        }
    };

    // Acciones de Pedidos
    const handleCompleteOrder = async (id) => { 
        setOrders(prev => prev.filter(o => o.id !== id)); 
        await supabase.from('pedidos').update({ estado: 'despachado' }).eq('id', id); 
        loadHistory();
    };

    const handleCancelOrder = async (id) => { 
        setOrders(prev => prev.filter(o => o.id !== id)); 
        await supabase.from('pedidos').update({ estado: 'cancelado' }).eq('id', id); 
        showToast("Pedido Cancelado");
        loadHistory();
    };
    const handlePrint = (order) => { setTicketOrder(order); setTimeout(() => window.print(), 500); };

    // Acciones de Inventario
    const toggleProduct = async (id, currentStatus) => { 
        updateLocalProducts(products.map(p => p.id === id ? { ...p, disponible: !currentStatus } : p)); 
        await supabase.from('menu_items').update({ disponible: !currentStatus }).eq('id', id); 
    };
    
    const guardarPrecio = async (id, nuevoPrecio) => { 
        if(isNaN(nuevoPrecio)) return; 
        updateLocalProducts(products.map(p => p.id === id ? { ...p, precio: nuevoPrecio } : p));
        await supabase.from('menu_items').update({ precio: nuevoPrecio }).eq('id', id); 
    };
    
    const deleteProduct = async (item) => { 
        if(!confirm("¿Borrar producto?")) return; 
        if (item.image_url) await supabase.storage.from('productos').remove([item.image_url.split('/').pop()]);
        updateLocalProducts(products.filter(p => p.id !== item.id)); 
        await supabase.from('menu_items').delete().eq('id', item.id); 
    };
    
    const deleteCategory = async (id) => { 
        if(!confirm("¿Borrar categoría y TODOS sus productos?")) return; 
        await supabase.from('categorias').delete().eq('id', id); 
        updateLocalCategories(categories.filter(c => c.id !== id)); 
    };
    
    const saveItem = async (data, editId) => {
        if (editId) {
            const table = modal.type === 'category' ? 'categorias' : 'menu_items';
            await supabase.from(table).update(data).eq('id', editId);
        } else {
            if (modal.type === 'category') {
                const maxOrd = categories.length > 0 ? Math.max(...categories.map(c => c.orden)) : 0;
                await supabase.from('categorias').insert([{ ...data, tienda_id: tiendaId, orden: maxOrd + 1 }]);
            } else {
                const maxOrd = products.length > 0 ? Math.max(...products.map(p => p.orden)) : 0;
                await supabase.from('menu_items').insert([{ ...data, tienda_id: tiendaId, disponible: true, orden: maxOrd + 1 }]);
            }
        }
        fetchTiendaData();
    };

    const handleDragStart = (e, catId) => { e.dataTransfer.setData('catId', catId); };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = async (e, targetCatId) => {
        e.preventDefault();
        const draggedCatId = Number(e.dataTransfer.getData('catId'));
        if (!draggedCatId || draggedCatId === targetCatId) return;

        const newCategories = [...categories];
        const draggedIdx = newCategories.findIndex(c => c.id === draggedCatId);
        const targetIdx = newCategories.findIndex(c => c.id === targetCatId);

        if (draggedIdx === -1 || targetIdx === -1) return;

        const [draggedItem] = newCategories.splice(draggedIdx, 1);
        newCategories.splice(targetIdx, 0, draggedItem);

        const updatedCategories = newCategories.map((c, i) => ({ ...c, orden: i + 1 }));
        updateLocalCategories(updatedCategories);

        try {
            await Promise.all(updatedCategories.map(c => supabase.from('categorias').update({ orden: c.orden }).eq('id', c.id)));
            showToast("✅ Orden de categorías guardado");
        } catch (err) {
            showToast("Error reordenando base de datos");
            fetchTiendaData(); 
        }
    };

    // Acciones de Ajustes Generales
    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return showToast("Solo se permiten imágenes (PNG, JPG)");
        setUploadingLogo(true);
        setLogoUploadProgress(10);
        const progressInterval = setInterval(() => setLogoUploadProgress(p => p > 90 ? 90 : p + 15), 300);
        try {
            if (configForm.logo_url) await supabase.storage.from('logos').remove([configForm.logo_url.split('/').pop()]);
            const fileName = `logo_${tiendaId}_${Date.now()}.${file.name.split('.').pop()}`;
            const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, file);
            if (uploadError) throw uploadError;
            clearInterval(progressInterval);
            setLogoUploadProgress(100);
            const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
            setTimeout(() => {
                setConfigForm(prev => ({ ...prev, logo_url: publicUrl }));
                showToast('Logo subido exitosamente.');
                setUploadingLogo(false); setLogoUploadProgress(0);
            }, 500);
        } catch (err) {
            clearInterval(progressInterval);
            showToast('Error al subir imagen.');
            setUploadingLogo(false); setLogoUploadProgress(0);
        }
    };

    const handleRemoveLogo = async () => {
        if(!confirm("¿Eliminar logo actual?")) return;
        try {
            if (configForm.logo_url) await supabase.storage.from('logos').remove([configForm.logo_url.split('/').pop()]);
            setConfigForm(prev => ({ ...prev, logo_url: null }));
            showToast("Logo eliminado. Guarda los ajustes.");
        } catch (e) { showToast("Error al borrar el logo."); }
    };

    const saveStoreSettings = async (e) => {
        e.preventDefault();
        const updateData = {
            nombre: configForm.nombre, telefono_whatsapp: configForm.telefono_whatsapp, logo_url: configForm.logo_url,
            mensaje_bienvenida: configForm.mensaje_bienvenida, mensaje_cerrado: configForm.mensaje_cerrado,
            pedido_minimo: parseFloat(configForm.pedido_minimo) || 0,
            color_primario: configForm.color_primario, color_secundario: configForm.color_secundario, 
            color_fondo: configForm.color_fondo, color_delivery: configForm.color_delivery, color_pickup: configForm.color_pickup,
            latitud: parseFloat(configForm.latitud), longitud: parseFloat(configForm.longitud), max_delivery_radius: parseFloat(configForm.max_delivery_radius),
            delivery_tiers: Array.isArray(configForm.delivery_tiers) ? configForm.delivery_tiers : []
        };
        try {
            const { error } = await supabase.from('tiendas').update(updateData).eq('id', tiendaId);
            if (error) throw error;
            updateStoreConfig(updateData);
            showToast('¡Ajustes guardados correctamente!');
        } catch (err) { alert(err.message || 'Error al guardar.'); }
    };

    const handleTierChange = (index, field, value) => {
        const newTiers = [...(configForm.delivery_tiers || [])];
        newTiers[index] = { ...newTiers[index] };
        newTiers[index][field] = field === 'name' ? value : parseFloat(value) || 0;
        setConfigForm({...configForm, delivery_tiers: newTiers});
    };

    // Procesadores de Datos para Vistas
    const processedInventory = useMemo(() => {
        if (!categories.length) return [];
        if (search.trim() !== '') {
            const searchLower = search.toLowerCase();
            return categories.map(cat => {
                let items = products.filter(p => p.categoria_id === cat.id && p.nombre.toLowerCase().includes(searchLower));
                items.sort((a, b) => a.orden - b.orden);
                return { ...cat, items };
            }).filter(c => c.items.length > 0);
        }
        
        if (activeCat === 'Todas') {
            return categories.map(cat => {
                let items = products.filter(p => p.categoria_id === cat.id);
                items.sort((a, b) => a.orden - b.orden);
                return { ...cat, items };
            }).filter(c => c.items.length > 0);
        } else {
            return categories.filter(c => c.nombre === activeCat).map(cat => {
                let items = products.filter(p => p.categoria_id === cat.id);
                items.sort((a, b) => a.orden - b.orden);
                return { ...cat, items };
            });
        }
    }, [categories, products, activeCat, search]);

    const filteredHistoryList = useMemo(() => {
        const now = new Date();
        return historyOrders.filter(o => {
            if (o.estado === 'pendiente') return false; 
            if (historyFilterStatus !== 'todos' && o.estado !== historyFilterStatus) return false;
            const orderDate = new Date(o.created_at);
            const diffDays = Math.ceil(Math.abs(now - orderDate) / (1000 * 60 * 60 * 24));
            return diffDays <= historyFilterDays;
        });
    }, [historyOrders, historyFilterDays, historyFilterStatus]);

    // RENDERIZADO CONDICIONAL DE ARRANQUE
    if (loadingAuth || (isAuthenticated && loadingData)) return <div className="min-h-screen flex items-center justify-center bg-gray-900"><div className="loader"></div></div>;
    if (authError) return <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-950 text-white text-center"><div className="text-6xl mb-4">🛑</div><h1 className="text-2xl font-black mb-2 uppercase">Acceso Denegado</h1><p className="text-gray-400">{authError}</p></div>;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950 text-white">
                <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl max-w-md w-full shadow-2xl text-center animate-card">
                    <div className="w-16 h-16 bg-orange-600/20 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-orange-600/30"><AdminIcons.Lock /></div>
                    <h1 className="text-2xl font-black tracking-wide mb-2">Panel Administrativo</h1>
                    <p className="text-gray-400 text-sm mb-6">Ingresa con tu correo y contraseña</p>
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <input type="email" required placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white text-center outline-none focus:border-orange-500 shadow-inner" disabled={isLoggingIn} />
                        <input type="password" required placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white text-center outline-none focus:border-orange-500 shadow-inner" disabled={isLoggingIn} />
                        {loginErrorState && <p className="text-red-500 text-xs font-bold">Credenciales incorrectas o sin acceso a esta tienda.</p>}
                        <button type="submit" disabled={isLoggingIn} className="w-full bg-orange-600 hover:bg-orange-500 font-bold py-4 rounded-xl shadow-lg transition-all text-lg active:scale-95 disabled:opacity-50">
                            {isLoggingIn ? 'Verificando...' : 'INGRESAR AL PANEL'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const identificador = tienda?.slug || tiendaId;
    const linkMenuQR = premium ? `https://${cleanHostname}/menu` : `https://${window.location.hostname}/menu?tienda=${identificador}`;

    // RENDERIZADO DEL ENRUTADOR PRINCIPAL
    return (
        <div className="pb-20 text-white font-sans bg-gray-900 min-h-screen">
            {toastMsg && <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-[9999] font-bold animate-card">{toastMsg}</div>}
            
            {hasNewOrder && (
                <div className="fixed inset-0 z-[99999] bg-green-900/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-green-600 border-8 border-white p-8 md:p-12 rounded-[3rem] shadow-[0_0_100px_rgba(255,255,255,0.5)] text-center flex flex-col items-center animate-pulse">
                        <div className="text-7xl mb-4">🛎️</div>
                        <h1 className="text-4xl md:text-6xl font-black mb-8 tracking-widest uppercase drop-shadow-lg">¡Nuevo Pedido!</h1>
                        <button onClick={acknowledgeNewOrder} className="bg-white text-green-600 font-black text-xl md:text-3xl px-10 py-6 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl">✅ ENTERADO</button>
                    </div>
                </div>
            )}

            <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50 p-4 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 w-full">
                    <div>
                        <h1 className="text-xl font-black tracking-widest flex items-center gap-2">ADMIN <span className="text-[10px] bg-orange-900/50 border border-orange-700 text-orange-200 px-2 py-1 rounded ml-2">Tienda #{tiendaId}</span></h1>
                        <p className="text-xs text-gray-400">{tienda?.nombre}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg border border-gray-700">
                            <AdminIcons.Printer />
                            <span className={`text-xs font-bold ${autoPrint ? 'text-blue-400' : 'text-gray-500'}`}>AUTO-PRINT</span>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" id="togglePrint" checked={autoPrint} onChange={() => setAutoPrint(!autoPrint)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 transform translate-x-0 checked:translate-x-full checked:border-blue-400"/>
                                <label htmlFor="togglePrint" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${autoPrint ? 'bg-blue-400' : 'bg-gray-600'}`}></label>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg border border-gray-700">
                            <span className={`text-xs font-bold ${tienda?.abierto ? 'text-green-500' : 'text-red-500'}`}>{tienda?.abierto ? 'ABIERTO' : 'CERRADO'}</span>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" id="toggleStore" checked={tienda?.abierto || false} onChange={toggleStore} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 transform translate-x-0 checked:translate-x-full checked:border-green-400"/>
                                <label htmlFor="toggleStore" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${tienda?.abierto ? 'bg-green-400' : 'bg-gray-600'}`}></label>
                            </div>
                        </div>

                        <button onClick={logout} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/50 px-3 py-2 rounded-lg text-xs font-bold transition-all">SALIR</button>
                    </div>
                </div>
                
                <div className="flex gap-2 overflow-x-auto no-scrollbar w-full">
                    <button onClick={()=>setView('orders')} className={`flex-shrink-0 flex-1 min-w-[100px] py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${view==='orders' ? 'bg-orange-600' : 'bg-gray-700 text-gray-400'}`}><AdminIcons.Moto/> PEDIDOS {orders.length > 0 && <span className="bg-red-600 px-2 py-0.5 rounded-full animate-pulse">{orders.length}</span>}</button>
                    <button onClick={()=>setView('inventory')} className={`flex-shrink-0 flex-1 min-w-[100px] py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${view==='inventory' ? 'bg-orange-600' : 'bg-gray-700 text-gray-400'}`}><AdminIcons.Menu/> INVENTARIO</button>
                    <button onClick={()=>setView('stats')} className={`flex-shrink-0 flex-1 min-w-[100px] py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${view==='stats' ? 'bg-orange-600' : 'bg-gray-700 text-gray-400'}`}><AdminIcons.Chart/> MÉTRICAS</button>
                    <button onClick={()=>setView('settings')} className={`flex-shrink-0 flex-1 min-w-[100px] py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${view==='settings' ? 'bg-orange-600' : 'bg-gray-700 text-gray-400'}`}><AdminIcons.Settings/> AJUSTES</button>
                </div>
            </header>

            {/* ENRUTAMIENTO DINÁMICO DE VISTAS */}
            {view === 'orders' && (
                <div className="p-4 animate-card max-w-2xl mx-auto w-full">
                    <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Pedidos Entrantes</h2>
                    {orders.length === 0 ? (
                        <div className="text-center py-20 text-gray-600"><p>No hay pedidos pendientes</p></div>
                    ) : (
                        orders.map(order => <OrderCard key={order.id} order={order} tienda={tienda} onComplete={handleCompleteOrder} onCancel={handleCancelOrder} onPrint={handlePrint} />)
                    )}
                </div>
            )}

            {view === 'inventory' && (
                <InventoryView 
                    search={search} setSearch={setSearch} 
                    activeCat={activeCat} setActiveCat={setActiveCat} 
                    categories={categories} processedInventory={processedInventory} 
                    setModal={setModal} deleteCategory={deleteCategory} 
                    deleteProduct={deleteProduct} toggleProduct={toggleProduct} 
                    guardarPrecio={guardarPrecio} handleDragStart={handleDragStart} 
                    handleDragOver={handleDragOver} handleDrop={handleDrop} 
                />
            )}

            {view === 'stats' && (
                <div className="p-4 animate-card max-w-4xl mx-auto space-y-6 w-full">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-4 gap-4">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-wider">Métricas</h2>
                            <p className="text-gray-400 text-sm">Resumen de ingresos y movimientos</p>
                        </div>
                        <div className="flex gap-2">
                            <select value={metricsDateFilter} onChange={(e) => setMetricsDateFilter(e.target.value)} className="bg-gray-800 text-white border border-gray-700 rounded-lg p-2 text-sm outline-none focus:border-orange-500">
                                <option value="mes_actual">Mes Actual Completo</option>
                                <option value="cuarto_1">Semana 1 (Días 1 al 7)</option>
                                <option value="cuarto_2">Semana 2 (Días 8 al 14)</option>
                                <option value="cuarto_3">Semana 3 (Días 15 al 21)</option>
                                <option value="cuarto_4">Semana 4 (Días 22 al final)</option>
                                <option value="mes_pasado">Mes Anterior</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800 p-6 rounded-2xl border border-green-700/50 shadow-lg">
                            <h3 className="text-green-400 font-bold text-xs mb-1 uppercase tracking-widest">Ingresos Aprobados</h3>
                            <p className="text-2xl sm:text-4xl font-black">${stats.ventas.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-2xl border border-red-700/50 shadow-lg">
                            <h3 className="text-red-400 font-bold text-xs mb-1 uppercase tracking-widest">Pedidos Cancelados</h3>
                            <p className="text-2xl sm:text-4xl font-black">{stats.cancelados} <span className="text-base font-normal text-gray-500">tickets</span></p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-orange-700/50 shadow-lg">
                            <h3 className="text-orange-400 font-bold text-sm mb-4 uppercase flex justify-between">
                                <span>🔥 TOP 5 MÁS VENDIDOS</span>
                            </h3>
                            <div className="space-y-3">
                                {stats.top5.length > 0 ? stats.top5.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center border-b border-gray-700/50 pb-2">
                                        <span className="text-gray-200 text-sm truncate pr-2"><span className="text-orange-500 font-bold mr-2">#{i+1}</span>{item.nombre}</span>
                                        <span className="font-mono bg-gray-900 px-2 rounded border border-gray-700 text-orange-300">{item.vendidos}</span>
                                    </div>
                                )) : <p className="text-gray-500 text-sm">Sin datos suficientes</p>}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-blue-900/50 shadow-lg">
                            <h3 className="text-blue-400 font-bold text-sm mb-4 uppercase flex justify-between">
                                <span>🧊 TOP 5 MENOS VENDIDOS</span>
                            </h3>
                            <div className="space-y-3">
                                {stats.bottom5.length > 0 ? stats.bottom5.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center border-b border-gray-700/50 pb-2">
                                        <span className="text-gray-400 text-sm truncate pr-2"><span className="text-blue-500/50 font-bold mr-2">🔻</span>{item.nombre}</span>
                                        <span className="font-mono bg-gray-900 px-2 rounded border border-gray-700 text-blue-300">{item.vendidos}</span>
                                    </div>
                                )) : <p className="text-gray-500 text-sm">Sin datos suficientes o todos los productos tienen 0 ventas</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mt-8 overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                            <h3 className="text-lg font-bold uppercase tracking-wider">📋 Historial de Órdenes</h3>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <select value={historyFilterDays} onChange={(e)=>setHistoryFilterDays(Number(e.target.value))} className="bg-gray-900 text-sm border border-gray-700 rounded-lg p-2 outline-none focus:border-orange-500 flex-1">
                                    <option value={1}>Hoy (24h)</option>
                                    <option value={7}>Últimos 7 días</option>
                                    <option value={30}>Últimos 30 días</option>
                                </select>
                                <select value={historyFilterStatus} onChange={(e)=>setHistoryFilterStatus(e.target.value)} className="bg-gray-900 text-sm border border-gray-700 rounded-lg p-2 outline-none focus:border-orange-500 flex-1">
                                    <option value="todos">Todos</option>
                                    <option value="despachado">Despachados</option>
                                    <option value="cancelado">Cancelados</option>
                                </select>
                            </div>
                        </div>

                        {filteredHistoryList.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 text-sm">No hay registros con los filtros seleccionados.</div>
                        ) : (
                            <div className="block w-full overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-400 min-w-max">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-900/50">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg">Fecha</th>
                                            <th className="px-4 py-3">Cliente / Folio</th>
                                            <th className="px-4 py-3">Estado</th>
                                            <th className="px-4 py-3 text-right rounded-tr-lg">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistoryList.map((orden) => (
                                            <tr key={orden.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {new Date(orden.created_at).toLocaleDateString('es-MX')} <br/>
                                                    <span className="text-xs text-gray-500">{new Date(orden.created_at).toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'})}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-bold text-gray-200">{limpiarTexto(orden.cliente_nombre)}</span> <br/>
                                                    <span className="text-xs bg-gray-900 px-2 py-0.5 rounded text-gray-500 border border-gray-700">#{orden.id}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${orden.estado === 'despachado' ? 'bg-green-900/20 text-green-500 border-green-800' : 'bg-red-900/20 text-red-500 border-red-800'}`}>
                                                        {orden.estado}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-gray-300 font-bold">
                                                    ${parseFloat(orden.total_final).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {view === 'settings' && (
                <SettingsView 
                    configForm={configForm} setConfigForm={setConfigForm} 
                    saveStoreSettings={saveStoreSettings} handleLogoUpload={handleLogoUpload} 
                    handleRemoveLogo={handleRemoveLogo} uploadingLogo={uploadingLogo} 
                    logoUploadProgress={logoUploadProgress} linkMenuQR={linkMenuQR} 
                    handleTierChange={handleTierChange} 
                />
            )}

            {/* Modales y Utilidades Inyectadas */}
            <AdminModal isOpen={modal.open} type={modal.type} editItem={modal.editItem} categories={categories} products={products} tienda={tienda} onClose={()=>setModal({open:false, type:null, editItem:null})} onSave={saveItem} />
            <Ticket order={ticketOrder} tienda={tienda}/>
        </div>
    );
}