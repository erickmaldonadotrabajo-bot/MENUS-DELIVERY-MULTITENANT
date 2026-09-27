import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function SuperAdmin() {
    // 🔐 Auth real con Supabase (reemplaza la contraseña maestra hardcodeada)
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);

    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState('');
    
    const [form, setForm] = useState({
        nombre: '', slug: '', telefono_whatsapp: '', latitud: '19.3082', longitud: '-99.0812', abierto: true
    });

    const [bulkModal, setBulkModal] = useState({ open: false, storeId: null, storeName: '' });
    const [jsonInput, setJsonInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [copied, setCopied] = useState(false);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    // Verificar si ya hay una sesión activa con rol superadmin al montar
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: perfil } = await supabase
                    .from('perfiles')
                    .select('rol')
                    .eq('id', session.user.id)
                    .single();

                if (perfil?.rol === 'superadmin') {
                    setIsAuthenticated(true);
                } else {
                    // Sesión válida pero sin permiso de superadmin: cerrarla para evitar confusión
                    await supabase.auth.signOut();
                }
            }
            setCheckingSession(false);
        };
        checkSession();
    }, []);

    useEffect(() => {
        if (isAuthenticated) fetchStores();
    }, [isAuthenticated]);

    const fetchStores = async () => {
        const { data, error } = await supabase.from('tiendas').select('*').order('id', { ascending: false });
        if (!error) setStores(data || []);
        setLoading(false);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoggingIn(true);

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });

        if (authError || !authData.user) {
            setLoginError('Correo o contraseña incorrectos.');
            setLoggingIn(false);
            return;
        }

        const { data: perfil, error: perfilError } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', authData.user.id)
            .single();

        if (perfilError || perfil?.rol !== 'superadmin') {
            setLoginError('Esta cuenta no tiene permisos.');
            setLoggingIn(false);
            await supabase.auth.signOut();
            return;
        }

        setIsAuthenticated(true);
        setLoggingIn(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setEmail('');
        setPassword('');
    };

    const createStore = async (e) => {
        e.preventDefault();
        const cleanSlug = form.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

        const { error } = await supabase.from('tiendas').insert([{
            nombre: form.nombre, slug: cleanSlug,
            telefono_whatsapp: form.telefono_whatsapp,
            latitud: parseFloat(form.latitud), longitud: parseFloat(form.longitud),
            abierto: form.abierto,
            color_primario: '#f97316', color_secundario: '#ef4444', color_fondo: '#111827',
            color_delivery: '#f97316', color_pickup: '#a855f7',
            max_delivery_radius: 5,
            delivery_tiers: [{ maxDistance: 5, cost: 30, name: "Zona General" }]
        }]);

        if (!error) {
            showToast('✅ Tienda creada exitosamente');
            setForm({ nombre: '', slug: '', telefono_whatsapp: '', latitud: '19.3082', longitud: '-99.0812', abierto: true });
            fetchStores();
        } else {
            showToast('❌ Error: ' + error.message);
        }
    };

    const toggleStoreStatus = async (id, currentStatus) => {
        const { error } = await supabase.from('tiendas').update({ abierto: !currentStatus }).eq('id', id);
        if (!error) fetchStores();
    };

    const executeBulkImport = async () => {
        if (!jsonInput.trim()) { alert("Pega el JSON primero"); return; }
        setIsUploading(true);

        try {
            const data = JSON.parse(jsonInput);
            if (!Array.isArray(data)) throw new Error("El JSON debe ser un Array (empezar con corchete '[' )");

            for (let i = 0; i < data.length; i++) {
                const catInfo = data[i];
                const { data: catData, error: catErr } = await supabase.from('categorias').insert({
                    tienda_id: bulkModal.storeId, nombre: catInfo.categoria,
                    nota_preparacion: catInfo.nota_preparacion || null, orden: i + 1
                }).select().single();

                if (catErr) throw catErr;

                if (catInfo.productos && Array.isArray(catInfo.productos) && catInfo.productos.length > 0) {
                    const productosParaInsertar = catInfo.productos.map((prod, idx) => ({
                        tienda_id: bulkModal.storeId, categoria_id: catData.id,
                        nombre: prod.nombre, descripcion: prod.descripcion || null,
                        precio: parseFloat(prod.precio) || 0, disponible: true,
                        has_extra: (prod.extras && prod.extras.length > 0),
                        extras: prod.extras || [], removables: prod.removables || [], orden: idx + 1
                    }));

                    const { error: prodErr } = await supabase.from('menu_items').insert(productosParaInsertar);
                    if (prodErr) throw prodErr;
                }
            }

            showToast("🚀 ¡Menú subido y configurado con éxito!");
            setBulkModal({ open: false, storeId: null, storeName: '' });
            setJsonInput('');
        } catch (err) {
            alert("Error en la subida. Verifica tu JSON: \n" + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    // EL PROMPT MÁGICO PARA LA IA
    const aiPrompt = `Actúa como un estructurador de datos experto. Te pasaré un menú de restaurante (en texto o imagen/PDF). Extrae todas las categorías, descripciones, productos, ingredientes removibles (cosas que se pueden quitar), opciones extras con su precio, y el precio base del producto.

Devuélveme ÚNICAMENTE un archivo JSON puro con esta estructura exacta, sin texto adicional ni formato markdown (sin \`\`\`json):

[
  {
    "categoria": "Nombre de la Categoría",
    "nota_preparacion": "Descripción de categoría (opcional)",
    "productos": [
      {
        "nombre": "Nombre del Producto",
        "descripcion": "Descripción detallada (opcional)",
        "precio": 0,
        "removables": ["Ingrediente 1", "Ingrediente 2"],
        "extras": [
          {"nombre": "Extra 1", "precio": 10},
          {"nombre": "Extra 2", "precio": 15}
        ]
      }
    ]
  }
]

Aquí está el menú a procesar:
[PEGA TU TEXTO AQUÍ O ADJUNTA EL PDF/FOTO]`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(aiPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Pantalla de carga mientras se verifica si ya hay sesión activa
    if (checkingSession) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">Verificando sesión...</div>;
    }

    // 🔐 PANTALLA LOGIN (email + contraseña real de Supabase Auth)
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
                <form onSubmit={handleLogin} className="bg-gray-900 p-8 rounded-2xl border border-red-900 shadow-2xl max-w-sm w-full text-center">
                    <h1 className="text-red-500 text-2xl font-black mb-2 uppercase">Acceso Restringido</h1>
                    <p className="text-gray-500 text-sm mb-6">Solo personal autorizado</p>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico" className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-3 outline-none focus:border-red-500 mb-3 text-center" disabled={loggingIn} />
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-3 outline-none focus:border-red-500 mb-4 text-center" disabled={loggingIn} />
                    {loginError && <p className="text-red-500 text-xs font-bold mb-4">{loginError}</p>}
                    <button type="submit" disabled={loggingIn} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg disabled:opacity-50">{loggingIn ? 'VERIFICANDO...' : 'ENTRAR'}</button>
                </form>
            </div>
        );
    }

    if (loading) return <div className="text-center py-20 text-white">Cargando panel maestro...</div>;

    return (
        <div className="bg-gray-950 text-white min-h-screen font-sans p-6 pb-20">
            <div className="max-w-5xl mx-auto space-y-8">
                {toast && <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl font-bold z-[9999]">{toast}</div>}
                
                <header className="border-b border-gray-800 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-wider text-orange-500">SUPER ADMIN SAAS</h1>
                        <p className="text-sm text-gray-400">Control central de arrendatarios y comercios</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="bg-gray-900 border border-gray-800 text-orange-400 px-4 py-2 rounded-lg text-sm font-black shadow">Total Tiendas: {stores.length}</span>
                        <button onClick={handleLogout} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/50 px-4 py-2 rounded-lg text-sm font-bold transition-all">SALIR</button>
                    </div>
                </header>

                {/* FORMULARIO */}
                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-2xl">
                    <h2 className="text-lg font-bold mb-4 text-orange-400 flex items-center gap-2"><span>➕</span> Registrar Nueva Tienda</h2>
                    <form onSubmit={createStore} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block text-xs text-gray-400 mb-1">Nombre Comercial</label><input type="text" required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 outline-none focus:border-orange-500" /></div>
                        <div><label className="block text-xs text-gray-400 mb-1">Slug (URL)</label><input type="text" required value={form.slug} onChange={e => setForm({...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})} className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 outline-none focus:border-orange-500" /></div>
                        <div><label className="block text-xs text-gray-400 mb-1">WhatsApp (con código país)</label><input type="text" required value={form.telefono_whatsapp} onChange={e => setForm({...form, telefono_whatsapp: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 outline-none focus:border-orange-500" /></div>
                        <div><label className="block text-xs text-gray-400 mb-1">Latitud Base</label><input type="number" step="any" required value={form.latitud} onChange={e => setForm({...form, latitud: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 outline-none focus:border-orange-500" /></div>
                        <div><label className="block text-xs text-gray-400 mb-1">Longitud Base</label><input type="number" step="any" required value={form.longitud} onChange={e => setForm({...form, longitud: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 outline-none focus:border-orange-500" /></div>
                        <div className="md:col-span-3 flex justify-between items-center mt-2 border-t border-gray-800 pt-4">
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="abiertoCheck" checked={form.abierto} onChange={e => setForm({...form, abierto: e.target.checked})} className="w-5 h-5 accent-orange-500 cursor-pointer" />
                                <label htmlFor="abiertoCheck" className="text-sm font-bold cursor-pointer">Iniciar tienda ABIERTA</label>
                            </div>
                            <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform active:scale-95">CREAR SISTEMA</button>
                        </div>
                    </form>
                </div>

                {/* LISTADO DE TIENDAS */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-gray-800 bg-gray-950/50">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Comercios Instalados</h2>
                    </div>
                    <div className="divide-y divide-gray-800">
                        {stores.map(store => (
                            <div key={store.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-800/40 transition-colors">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="bg-orange-900/50 text-orange-400 border border-orange-700 text-xs font-mono font-bold px-2 py-1 rounded">ID: {store.id}</span>
                                        <h3 className="font-black text-xl text-white">{store.nombre}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${store.abierto ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
                                            {store.abierto ? 'ONLINE' : 'OFFLINE'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        <span className="text-gray-500">Slug:</span> /{store.slug} | <span className="text-gray-500">Tel:</span> {store.telefono_whatsapp}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                                    <button onClick={() => toggleStoreStatus(store.id, store.abierto)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-xs font-bold border border-gray-600">ON/OFF</button>
                                    <button onClick={() => setBulkModal({open: true, storeId: store.id, storeName: store.nombre})} className="bg-blue-900/50 hover:bg-blue-600 text-blue-300 hover:text-white px-3 py-2 rounded-lg text-xs font-bold border border-blue-700 transition">⚙️ SUBIR MENÚ</button>
                                    <a href={`/admin?tienda=${store.slug}`} target="_blank" rel="noreferrer" className="bg-orange-600/20 hover:bg-orange-600 text-orange-500 hover:text-white px-3 py-2 rounded-lg text-xs font-bold border border-orange-600/50 transition">Panel Admin</a>
                                    <a href={`/?tienda=${store.slug}`} target="_blank" rel="noreferrer" className="bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white px-3 py-2 rounded-lg text-xs font-bold border border-green-600/50 transition">Ver App</a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODAL DE SUBIDA MASIVA DE MENÚ */}
            {bulkModal.open && (
                <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-blue-900 p-6 rounded-2xl w-full max-w-4xl shadow-2xl overflow-y-auto max-h-[95vh]">
                        <h2 className="text-2xl font-black text-white mb-2">Importar Menú a: <span className="text-blue-400">{bulkModal.storeName}</span></h2>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            {/* COLUMNA 1: INSTRUCCIONES PARA LA IA */}
                            <div className="bg-gray-950 p-5 rounded-xl border border-gray-800">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-gray-300">🤖 Prompt Mágico (Pídeselo a una IA)</h3>
                                    <button onClick={copyToClipboard} className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all border border-blue-600/50">
                                        {copied ? '✅ ¡Copiado!' : '📋 Copiar Prompt'}
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-500 mb-3">Pégale este texto a ChatGPT, Claude o Gemini junto con el PDF o foto del menú de tu cliente para que te devuelva el código listo para subir.</p>
                                <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 overflow-y-auto max-h-60 custom-scrollbar text-[11px] text-gray-400 whitespace-pre-wrap font-mono">
                                    {aiPrompt}
                                </div>
                            </div>

                            {/* COLUMNA 2: PEGAR RESULTADO Y SUBIR */}
                            <div className="flex flex-col">
                                <h3 className="text-sm font-bold text-gray-300 mb-3">📦 Pegar Resultado (JSON)</h3>
                                <textarea 
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                    disabled={isUploading}
                                    className="flex-1 w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-green-400 font-mono text-xs outline-none focus:border-blue-500 mb-4 min-h-[250px]"
                                    placeholder='Pega aquí el código que te devuelva la IA...'
                                ></textarea>
                                
                                <div className="flex justify-end gap-3 mt-auto">
                                    <button onClick={() => !isUploading && setBulkModal({open: false, storeId: null, storeName: ''})} className="px-4 py-3 text-gray-400 hover:text-white font-bold transition-colors">Cancelar</button>
                                    <button onClick={executeBulkImport} disabled={isUploading} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl disabled:opacity-50 shadow-lg active:scale-95 transition-transform">
                                        {isUploading ? 'Procesando inserción...' : 'INJECTAR MENÚ'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}