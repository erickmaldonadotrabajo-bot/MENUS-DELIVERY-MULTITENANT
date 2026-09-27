import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';

// Sonido de alerta
const alertSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3');
alertSound.loop = true;

// Iconos SVG
const Icons = {
    Menu: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
    Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    Plus: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    Trash: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    Edit: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
    Moto: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Printer: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
    MapPin: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
    Upload: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
    Settings: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Lock: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>,
    Cancel: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
    Chart: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002-2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
};

const limpiarTexto = (t) => t ? String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "").trim() : "";

const getCleanDomain = () => {
    let hostname = window.location.hostname;
    hostname = hostname.replace(/^www\./, ''); 
    hostname = hostname.split(':')[0]; 
    return hostname.trim().toLowerCase(); 
};

// COMPONENTES SECUNDARIOS (sin cambios)
const Ticket = ({ order, tienda }) => {
    if (!order || !tienda) return null;
    const date = new Date(order.created_at).toLocaleString('es-MX');
    const isDelivery = order.tipo_entrega === 'delivery';

    return (
        <div id="ticket-area" style={{ position: 'fixed', top: 0, left: '-9999px', width: '58mm', backgroundColor: 'white', color: 'black', zIndex: -1 }}>
            <div className="ticket-header" style={{ textAlign: 'center', marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {tienda.logo_url && <img src={tienda.logo_url} alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '5px', filter: 'grayscale(100%)', objectFit: 'cover' }} />}
                <h2 style={{fontSize: '20px', fontWeight: 'bold', margin:0}}>{tienda.nombre}</h2>
                <p style={{fontWeight:'bold', fontSize:'16px', margin:'5px 0'}}>{isDelivery ? 'DOMICILIO' : 'PICKUP'}</p>
                <p style={{fontSize:'12px', margin:0}}>{date}</p>
                <p style={{fontSize:'12px', fontWeight:'bold', margin:0}}>FOLIO: #{order.id}</p>
            </div>
            <div style={{ borderBottom: '2px dashed #000', margin: '5px 0', width: '100%' }}></div>
            <div style={{ fontSize: '16px' }}>
                <p style={{ margin:0 }}><strong>CTE:</strong> {limpiarTexto(order.cliente_nombre)}</p>
                <p style={{ margin:0 }}><strong>TEL:</strong> {order.cliente_telefono}</p>
                {order.respuestas_checkout && Object.keys(order.respuestas_checkout).map(k => (
                    <p key={k} style={{marginTop:'5px', fontWeight:'bold', margin:0}}>{limpiarTexto(k).toUpperCase()}: {limpiarTexto(order.respuestas_checkout[k]).toUpperCase()}</p>
                ))}
            </div>
            <div style={{ borderBottom: '2px dashed #000', margin: '5px 0', width: '100%' }}></div>
            {order.nota_cliente && (
                <div style={{ border: '2px solid #000', padding: '5px', margin: '5px 0', fontWeight: 'bold', fontSize: '11px' }}>
                    <p style={{margin:0}}>NOTAS:</p>
                    <p style={{fontSize:'18px', margin:0}}>{limpiarTexto(order.nota_cliente)}</p>
                </div>
            )}
            <div style={{width: '100%', fontSize: '18px'}}>
                {order.detalle_json && order.detalle_json.map((item, i) => (
                    <div key={i} style={{marginBottom: '5px', display: 'flex', alignItems: 'flex-start'}}>
                        <div style={{flex: '1', paddingRight: '5px'}}>
                            <span style={{fontWeight:'bold'}}>-{item.qty} {limpiarTexto(item.nombre)}</span>
                            {item.isExtra && <div style={{fontSize: '14px', fontWeight: 'bold'}}>+ {item.extraAppliedName}</div>}
                            {item.details && <div style={{fontSize: '14px', fontStyle: 'italic'}}>{limpiarTexto(item.details)}</div>}
                        </div>
                        <div style={{width: '50px', textAlign: 'right', fontWeight: 'bold'}}>${(item.price * item.qty).toFixed(0)}</div>
                    </div>
                ))}
            </div>
            <div style={{ borderBottom: '2px dashed #000', margin: '5px 0', width: '100%' }}></div>
            <div style={{ textAlign: 'right', marginTop: '5px', borderTop: '1px solid #000', paddingTop: '5px', fontSize: '16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span>SUBTOTAL:</span><span>${parseFloat(order.total_subtotal).toFixed(2)}</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span>ENVIO:</span><span>{isDelivery ? `$${parseFloat(order.total_envio).toFixed(2)}` : 'N/A'}</span></div>
                {order.total_propina > 0 && <div style={{ display:'flex', justifyContent:'space-between' }}><span>PROPINA:</span><span>${parseFloat(order.total_propina).toFixed(2)}</span></div>}
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'16px', borderTop:'2px solid #000', marginTop:'2px', paddingTop:'2px' }}><span>TOTAL:</span><span>${parseFloat(order.total_final).toFixed(2)}</span></div>
            </div>
            <div style={{textAlign: 'center', marginTop: '10px', fontSize: '14px'}}>
                <p style={{margin:0}}>PAGO: {limpiarTexto(order.metodo_pago)}</p>
                {String(order.metodo_pago).toLowerCase().includes('efectivo') && order.pago_con && (
                    <div style={{margin: '5px 0'}}>
                        <p style={{margin:0}}>PAGA CON: ${order.pago_con}</p>
                        <p style={{fontWeight: 'bold', margin:0}}>CAMBIO: ${(order.pago_con - order.total_final).toFixed(2)}</p>
                    </div>
                )}
            </div>
            <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '16px', paddingBottom: '10px' }}>
                <p>GRACIAS POR SU PREFERENCIA!</p>
            </div>
        </div>
    );
};

const OrderCard = ({ order, tienda, onComplete, onPrint, onCancel }) => {
    const date = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const handleComplete = () => { if(confirm("¿PEDIDO DESPACHADO?")) onComplete(order.id); };
    
    const handleCancelClick = () => {
        if (confirm("¿Seguro que quieres CANCELAR este pedido?")) {
            onCancel(order.id);
        }
    };

    const mapLink = (order.latitud && order.longitud) ? `https://www.google.com/maps/search/?api=1&query=${order.latitud},${order.longitud}` : null;
    
    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden mb-6 max-w-full w-full">
            <div className="bg-gray-900/50 p-4 border-b border-gray-700 flex justify-between items-center flex-wrap gap-2">
                <div>
                    <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded mr-2">#{order.id}</span>
                    <span className="text-gray-400 text-sm">{date}</span>
                </div>
                <span className={`text-xs font-bold uppercase px-2 py-1 rounded border ${order.tipo_entrega==='delivery'?'text-orange-400 border-orange-900 bg-orange-900/20':'text-purple-400 border-purple-900 bg-purple-900/20'}`}>
                    {order.tipo_entrega === 'delivery' ? 'DOMICILIO' : 'PICKUP'}
                </span>
            </div>

            <div className="p-4">
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-white leading-none break-words">{limpiarTexto(order.cliente_nombre)}</h3>
                    <a href={`tel:${order.cliente_telefono}`} className="text-orange-400 text-sm hover:underline flex items-center gap-1 mt-1 break-words">TEL: {order.cliente_telefono}</a>
                    {order.respuestas_checkout && Object.keys(order.respuestas_checkout).map(k => (
                        <div key={k} className="mt-2 mr-2 inline-block bg-blue-900/50 border border-blue-700 text-blue-200 text-xs font-black px-2 py-1 rounded-lg uppercase tracking-wide break-words max-w-full">{k}: {order.respuestas_checkout[k]}</div>
                    ))}
                </div>
                
                <div className="bg-gray-900/50 rounded-lg p-3 mb-4 space-y-2 border border-gray-700/50 w-full overflow-hidden">
                    {order.detalle_json && order.detalle_json.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-sm border-b border-gray-700/50 pb-2 last:border-0 last:pb-0">
                            <div className="text-gray-200 break-words pr-2"><span className="font-bold text-orange-500 mr-1">{item.qty}x</span> {limpiarTexto(item.nombre)}{item.isExtra && <span className="text-yellow-500 text-xs ml-1 font-bold break-words">+{item.extraAppliedName}</span>}{item.details && <p className="text-gray-500 text-xs pl-6 italic break-words">{limpiarTexto(item.details)}</p>}</div>
                            <span className="font-mono text-gray-400 whitespace-nowrap pl-2">${(item.price * item.qty).toFixed(2)}</span>
                        </div>
                    ))}
                    {order.nota_cliente && <div className="mt-2 bg-yellow-900/20 text-yellow-200 text-xs p-2 rounded border border-yellow-900/30 break-words">NOTA: <strong>{limpiarTexto(order.nota_cliente)}</strong></div>}
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 border-t border-gray-700 pt-3 gap-2">
                    <div className="text-sm">
                        <p className="text-gray-400 uppercase font-bold text-xs">Pago</p>
                        <p className="text-white font-medium flex items-center gap-1"><Icons.Check /> {limpiarTexto(order.metodo_pago).toUpperCase()}</p>
                        {String(order.metodo_pago).toLowerCase().includes('efectivo') && order.pago_con && <p className="text-green-400 text-xs font-bold mt-1">Cambio: <span className="text-white">${(order.pago_con - order.total_final).toFixed(2)}</span></p>}
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                        <p className="text-3xl font-black text-white tracking-tighter">${parseFloat(order.total_final).toFixed(2)}</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    <button onClick={handleCancelClick} className="col-span-1 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/50 rounded-xl flex flex-col items-center justify-center p-2 transition-all w-full">
                        <Icons.Cancel />
                        <span className="text-[10px] font-bold mt-1">CANCELAR</span>
                    </button>
                    
                    {mapLink ? (
                        <a href={mapLink} target="_blank" rel="noreferrer" className="col-span-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-600/50 rounded-xl flex flex-col items-center justify-center p-2 transition-all w-full">
                            <Icons.MapPin />
                            <span className="text-[10px] font-bold mt-1">MAPA</span>
                        </a>
                    ) : (
                        <div className="col-span-1 bg-gray-700/50 text-gray-500 rounded-xl flex flex-col items-center justify-center p-2 opacity-50 cursor-not-allowed w-full">
                            <Icons.MapPin />
                            <span className="text-[10px] font-bold mt-1">SIN GPS</span>
                        </div>
                    )}

                    <button onClick={() => onPrint(order)} className="col-span-1 bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 rounded-xl flex flex-col items-center justify-center p-2 transition-all w-full">
                        <Icons.Printer />
                        <span className="text-[10px] font-bold mt-1">IMPRIMIR</span>
                    </button>

                    <button onClick={handleComplete} className="col-span-1 bg-orange-600/20 hover:bg-orange-600 text-orange-500 hover:text-white border border-orange-600/50 rounded-xl flex flex-col items-center justify-center p-2 transition-all w-full">
                        <Icons.Check />
                        <span className="text-[10px] font-bold mt-1">LISTO</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const Modal = ({isOpen, onClose, type, editItem, categories, onSave, tiendaId}) => {
    const [form, setForm] = useState({});
    const [newTopping, setNewTopping] = useState("");
    const [toppingsList, setToppingsList] = useState([]);
    const [extrasList, setExtrasList] = useState([]);
    
    const [uploadingField, setUploadingField] = useState(null); 
    
    useEffect(() => {
        if (isOpen) {
            if (editItem) { 
                setForm(editItem); 
                setToppingsList(editItem.removables || []); 
                setExtrasList(editItem.extras || []);
            } else { 
                setForm(type === 'product' ? { categoria_id: categories[0]?.id } : {}); 
                setToppingsList([]); 
                setExtrasList([]);
            }
            setNewTopping("");
            setUploadingField(null);
        }
    }, [isOpen, type, categories, editItem]);
    
    if (!isOpen) return null;
    
    const handleAddTopping = () => { 
        if (newTopping.trim() !== "") { 
            setToppingsList([...toppingsList, newTopping.trim()]); 
            setNewTopping(""); 
        } 
    };
    const removeTopping = (idx) => { setToppingsList(toppingsList.filter((_, i) => i !== idx)); };

    const handleAddExtra = () => {
        if (extrasList.length < 15) setExtrasList([...extrasList, { nombre: '', precio: '' }]);
    };
    const updateExtra = (index, field, value) => {
        const newExtras = [...extrasList];
        newExtras[index][field] = field === 'precio' ? (value ? parseFloat(value) : '') : value;
        setExtrasList(newExtras);
    };
    const removeExtra = (index) => { setExtrasList(extrasList.filter((_, i) => i !== index)); };

    const deleteOldFileFromBucket = async (url) => {
        if (!url) return;
        try {
            const urlParts = url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            if (fileName) await supabase.storage.from('productos').remove([fileName]);
        } catch (e) { console.error("Fallo al intentar borrar archivo antiguo", e); }
    };

    const handleRemoveMedia = async (field) => {
        const currentUrl = form[field];
        if (currentUrl) {
            if (confirm(`¿Estás seguro de eliminar este ${field === 'video_url' ? 'video' : 'imagen'}?`)) {
                await deleteOldFileFromBucket(currentUrl);
                setForm(prev => ({ ...prev, [field]: null }));
            }
        }
    };

    const handleMediaUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        if (field === 'video_url' && !file.type.startsWith('video/')) {
            alert("Error: Por favor selecciona un archivo de VIDEO válido (mp4, webm, mov).");
            e.target.value = null; return;
        }
        if (field === 'image_url' && !file.type.startsWith('image/')) {
            alert("Error: Por favor selecciona un archivo de IMAGEN válido (jpg, png).");
            e.target.value = null; return;
        }

        if (file.size > 49 * 1024 * 1024) { 
            alert("Tu archivo es muy pesado (máximo 49 MB).");
            e.target.value = null; return;
        }

        setUploadingField(field);

        try {
            if (field === 'video_url') {
                const videoNode = document.createElement('video');
                videoNode.preload = 'metadata';
                videoNode.src = URL.createObjectURL(file);
                await new Promise((resolve, reject) => {
                    videoNode.onloadedmetadata = () => {
                        URL.revokeObjectURL(videoNode.src);
                        if (videoNode.duration > 15) reject("El video no puede durar más de 15 segundos.");
                        else resolve();
                    };
                    videoNode.onerror = () => {
                        URL.revokeObjectURL(videoNode.src);
                        reject("Archivo de video corrupto o formato no soportado.");
                    };
                });
            }

            if (form[field]) { await deleteOldFileFromBucket(form[field]); }

            const fileExt = file.name.split('.').pop();
            const fileName = `${field === 'video_url' ? 'vid' : 'img'}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage.from('productos').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(fileName);

            setForm(prev => ({ ...prev, [field]: publicUrl }));
            setUploadingField(null);
            
        } catch (err) {
            alert(`Error al procesar/subir: ${err.message || err}`);
            setUploadingField(null);
        }
    };
    
    const handleSubmit = (e) => { 
        e.preventDefault(); 
        const cleanExtras = extrasList.filter(ext => ext.nombre.trim() !== '');

        let finalData;
        if (type === 'category') {
            finalData = { nombre: form.nombre, nota_preparacion: form.nota_preparacion };
        } else {
            finalData = { ...form, extras: cleanExtras, has_extra: cleanExtras.length > 0, removables: toppingsList };
        }
        
        onSave(finalData, editItem?.id); 
        onClose(); 
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 w-full h-full overflow-hidden">
            <div className="bg-gray-800 w-full max-w-md rounded-2xl p-6 border border-gray-700 shadow-2xl overflow-y-auto max-h-[90vh]">
                <h2 className="text-2xl font-bold text-white mb-4">{editItem ? 'Editar' : 'Nuevo'} {type === 'category' ? 'Categoría' : 'Producto'}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Nombre</label>
                        <input required value={form.nombre || ''} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-orange-500 outline-none" onChange={e => setForm({...form, nombre: e.target.value})} disabled={uploadingField !== null} />
                    </div>
                    
                    {type === 'category' && (
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Descripción / Nota</label>
                            <input value={form.nota_preparacion || ''} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none" placeholder="Ej: Especialidad de la casa..." onChange={e => setForm({...form, nota_preparacion: e.target.value})} disabled={uploadingField !== null} />
                        </div>
                    )}
                    
                    {type === 'product' && (
                        <React.Fragment>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Descripción del producto</label>
                                <textarea value={form.descripcion || ''} onChange={e => setForm({...form, descripcion: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none focus:border-orange-500" rows="2" placeholder="Ej: Deliciosa combinación de..." disabled={uploadingField !== null}></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-gray-400 text-sm mb-1">Precio Base</label><input required type="number" value={form.precio || ''} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none" onChange={e => setForm({...form, precio: e.target.value})} disabled={uploadingField !== null} /></div>
                            </div>
                            
                            <div className="p-3 bg-gray-900 rounded-xl border border-gray-700">
                                <label className="block text-orange-400 text-sm font-bold mb-2">Ingredientes Removibles</label>
                                <div className="flex gap-2 mb-2">
                                    <input className="flex-1 min-w-0 bg-gray-800 border border-gray-600 rounded-lg p-2 text-white text-sm outline-none" placeholder="Ej: Cebolla" value={newTopping} onChange={(e) => setNewTopping(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopping())} disabled={uploadingField !== null} />
                                    <button type="button" onClick={handleAddTopping} className="bg-gray-700 px-3 rounded-lg text-white hover:bg-gray-600" disabled={uploadingField !== null}><Icons.Plus /></button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {toppingsList.map((t, i) => (
                                        <span key={i} className="bg-orange-600/20 text-orange-200 text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-orange-600/40">{t}<button type="button" onClick={() => removeTopping(i)} className="hover:text-white" disabled={uploadingField !== null}><Icons.X /></button></span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-1">URL del Video (Opcional - máx 15 seg)</label>
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <input type="text" value={form.video_url || ''} className="flex-1 bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-500 outline-none focus:border-orange-500 min-w-0" placeholder="https://..." readOnly />
                                        
                                        {form.video_url && (
                                            <button type="button" onClick={() => handleRemoveMedia('video_url')} className="bg-red-900/50 border border-red-700 rounded-lg px-3 text-red-400 hover:bg-red-800 transition shrink-0" title="Eliminar Video">
                                                <Icons.Trash />
                                            </button>
                                        )}

                                        <label className={`bg-gray-800 border border-gray-600 rounded-lg px-4 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition shrink-0 ${uploadingField !== null && uploadingField !== 'video_url' ? 'opacity-50 pointer-events-none' : ''}`} title={form.video_url ? "Reemplazar Video" : "Subir Video"}>
                                            {uploadingField === 'video_url' ? <span className="text-xs text-orange-400 font-bold animate-pulse">Subiendo...</span> : <Icons.Upload />}
                                            <input type="file" accept="video/mp4, video/webm, video/quicktime" className="hidden" onChange={(e) => handleMediaUpload(e, 'video_url')} disabled={uploadingField !== null} />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-1">URL de Imagen (Opcional)</label>
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <input type="text" value={form.image_url || ''} className="flex-1 bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-500 outline-none focus:border-orange-500 min-w-0" placeholder="https://..." readOnly />
                                        
                                        {form.image_url && (
                                            <button type="button" onClick={() => handleRemoveMedia('image_url')} className="bg-red-900/50 border border-red-700 rounded-lg px-3 text-red-400 hover:bg-red-800 transition shrink-0" title="Eliminar Imagen">
                                                <Icons.Trash />
                                            </button>
                                        )}

                                        <label className={`bg-gray-800 border border-gray-600 rounded-lg px-4 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition shrink-0 ${uploadingField !== null && uploadingField !== 'image_url' ? 'opacity-50 pointer-events-none' : ''}`} title={form.image_url ? "Reemplazar Imagen" : "Subir Imagen"}>
                                            {uploadingField === 'image_url' ? <span className="text-xs text-orange-400 font-bold animate-pulse">Subiendo...</span> : <Icons.Upload />}
                                            <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={(e) => handleMediaUpload(e, 'image_url')} disabled={uploadingField !== null} />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-900 p-3 rounded-xl border border-gray-700">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-orange-400 text-sm font-bold">Extras del Producto (Máx 15)</label>
                                    {extrasList.length < 15 && (
                                        <button type="button" onClick={handleAddExtra} className="text-[10px] bg-orange-600 hover:bg-orange-500 px-2 py-1 rounded text-white font-bold transition-all shadow" disabled={uploadingField !== null}>+ AGREGAR</button>
                                    )}
                                </div>
                                
                                {extrasList.length === 0 && <p className="text-xs text-gray-500 italic mb-2">Sin extras configurados.</p>}

                                <div className="space-y-2">
                                    {extrasList.map((ext, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <input type="text" placeholder="Ej: Queso Extra" value={ext.nombre} onChange={e => updateExtra(i, 'nombre', e.target.value)} className="flex-1 bg-gray-800 border border-gray-600 p-2 rounded-lg text-white text-sm outline-none focus:border-orange-500 min-w-0" disabled={uploadingField !== null} />
                                            <div className="relative w-20 sm:w-24 shrink-0">
                                                <span className="absolute left-2 top-2 text-gray-500 text-sm">$</span>
                                                <input type="number" placeholder="0" value={ext.precio} onChange={e => updateExtra(i, 'precio', e.target.value)} className="w-full bg-gray-800 border border-gray-600 py-2 pr-2 pl-6 rounded-lg text-white text-sm outline-none focus:border-orange-500" disabled={uploadingField !== null} />
                                            </div>
                                            <button type="button" onClick={() => removeExtra(i)} className="text-red-500 hover:text-red-400 p-1 shrink-0" disabled={uploadingField !== null}><Icons.Trash /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Categoría</label>
                                <select value={form.categoria_id || ''} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none" onChange={e => setForm({...form, categoria_id: e.target.value})} disabled={uploadingField !== null}>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                            </div>
                        </React.Fragment>
                    )}
                    
                    <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl mt-4 shadow-lg disabled:opacity-50" disabled={uploadingField !== null}>GUARDAR {type === 'category' ? 'CATEGORÍA' : 'PRODUCTO'}</button>
                    <button type="button" onClick={onClose} className="w-full text-gray-400 py-2 hover:text-white transition-colors" disabled={uploadingField !== null}>Cancelar</button>
                </form>
            </div>
        </div>
    );
};

// COMPONENTE PRINCIPAL
export default function Admin() {
    const [searchParams] = useSearchParams();
    const parametroTienda = searchParams.get('tienda');
    const cleanHostname = getCleanDomain();
    
    const isPremiumDomain = cleanHostname !== 'localhost' 
                         && cleanHostname !== '127.0.0.1' 
                         && !cleanHostname.endsWith('netlify.app')
                         && !cleanHostname.endsWith('netlify.com')
                         && !cleanHostname.endsWith('vercel.app');

    const [tiendaError, setTiendaError] = useState(null);
    const [tiendaId, setTiendaId] = useState(null);

    // 🔐 Auth real con Supabase (reemplaza el PIN)
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(false);

    const [view, setView] = useState('orders');
    const [tienda, setTienda] = useState(null);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    
    const [activeCat, setActiveCat] = useState('Todas');
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState({open: false, type: null, editItem: null});
    const [loading, setLoading] = useState(true);
    const [ticketOrder, setTicketOrder] = useState(null);
    const [toastMsg, setToastMsg] = useState('');
    const [hasNewOrder, setHasNewOrder] = useState(false);

    // Estados para las Métricas Avanzadas
    const [metricsDateFilter, setMetricsDateFilter] = useState('30_dias');
    const [stats, setStats] = useState({ ventas: 0, cancelados: 0, top5: [], bottom5: [] });
    
    // Estados para el Historial
    const [historyOrders, setHistoryOrders] = useState([]); 
    const [historyFilterDays, setHistoryFilterDays] = useState(1);
    const [historyFilterStatus, setHistoryFilterStatus] = useState('todos');

    // Formulario de Ajustes
    const [configForm, setConfigForm] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [logoUploadProgress, setLogoUploadProgress] = useState(0); 

    const [autoPrint, setAutoPrint] = useState(() => localStorage.getItem('saas_autoprint') === 'true');
    const autoPrintRef = useRef(autoPrint);

    // Inyectar CSS global al montar (Ticket CSS)
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

    // 1. Resolver Tienda ID y verificar si ya hay sesión activa de Supabase Auth con permiso
    useEffect(() => {
        const resolveTienda = async () => {
            try {
                let data = null;
                if (isPremiumDomain) {
                    const { data: resData, error } = await supabase.from('tiendas').select('id, slug').ilike('dominio_personal', cleanHostname).maybeSingle();
                    if (error) throw error;
                    if (!resData) throw new Error("Dominio no asignado");
                    data = resData;
                } else {
                    if (!parametroTienda) throw new Error("Falta parámetro tienda");
                    let query = supabase.from('tiendas').select('id, slug');
                    query = /^\d+$/.test(parametroTienda) ? query.eq('id', parseInt(parametroTienda)) : query.eq('slug', parametroTienda);
                    const { data: resData, error } = await query.single();
                    if (error || !resData) throw new Error("Tienda no encontrada");
                    data = resData;
                }
                setTiendaId(data.id);

                // Si ya hay una sesión de Supabase Auth activa, verificamos que tenga permiso sobre esta tienda
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { data: perfil } = await supabase
                        .from('perfiles')
                        .select('rol, tienda_id')
                        .eq('id', session.user.id)
                        .single();

                    if (perfil && (perfil.rol === 'superadmin' || perfil.tienda_id === data.id)) {
                        setIsAuthenticated(true);
                    }
                }
                setLoading(false);
            } catch (err) {
                setTiendaError(err.message);
                setLoading(false);
            }
        };
        resolveTienda();
    }, [isPremiumDomain, cleanHostname, parametroTienda]);
    
    useEffect(() => {
        localStorage.setItem('saas_autoprint', autoPrint);
        autoPrintRef.current = autoPrint;
    }, [autoPrint]);

    const showToast = useCallback((msg) => { 
        setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); 
    }, []);

    const fetchTiendaData = useCallback(async () => {
        if (!tiendaId) return;
        
        const { data: t } = await supabase.from('tiendas').select('*').eq('id', tiendaId).single();
        setTienda(t);
        setConfigForm(t);
        
        const { data: cats } = await supabase.from('categorias').select('*').eq('tienda_id', tiendaId).order('orden');
        const { data: prods } = await supabase.from('menu_items').select('*').eq('tienda_id', tiendaId).order('orden');
        
        setCategories(cats || []); 
        setProducts(prods || []);
        
        const { data: ords } = await supabase.from('pedidos').select('*').eq('tienda_id', tiendaId).eq('estado', 'pendiente').order('created_at', {ascending: false});
        setOrders(ords || []);
        
        setLoading(false);
    }, [tiendaId]);

    // Función para Cargar Métricas con Fechas Específicas
    const loadStats = useCallback(async () => {
        if (!tiendaId || !products.length) return;

        try {
            const now = new Date();
            let startDate = new Date();
            let endDate = new Date();

            if (metricsDateFilter === 'semana') {
                startDate.setDate(now.getDate() - now.getDay());
                startDate.setHours(0,0,0,0);
            } else if (metricsDateFilter === 'mes_actual') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (metricsDateFilter === 'mes_anterior') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            } else {
                startDate.setDate(now.getDate() - 30);
            }

            const { data, error } = await supabase
                .from('pedidos')
                .select('estado, total_final, detalle_json, created_at') 
                .eq('tienda_id', tiendaId)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());

            if (error || !data) return;

            let totalVentas = 0; 
            let totalCancelados = 0; 
            let productsCount = {};

            data.forEach(p => {
                if (p.estado === 'despachado') {
                    totalVentas += parseFloat(p.total_final) || 0;
                    const items = Array.isArray(p.detalle_json) ? p.detalle_json : (typeof p.detalle_json === 'string' ? JSON.parse(p.detalle_json) : []);
                    items.forEach(item => { productsCount[item.nombre] = (productsCount[item.nombre] || 0) + (item.qty || 1); });
                } else if (p.estado === 'cancelado') {
                    totalCancelados += 1;
                }
            });

            const allStats = products.map(p => ({ nombre: p.nombre, vendidos: productsCount[p.nombre] || 0 }));
            allStats.sort((a,b) => b.vendidos - a.vendidos);

            const top5 = allStats.slice(0, 5);
            const bottom5 = [...allStats].filter(item => item.vendidos > 0).reverse().slice(0, 5); 

            setStats({ ventas: totalVentas, cancelados: totalCancelados, top5: top5, bottom5: bottom5 });
        } catch (e) { console.error("Error al cargar stats:", e); }
    }, [tiendaId, products, metricsDateFilter]);

    // Cargar Historial Separado
    const loadHistory = useCallback(async () => {
        if(!tiendaId) return;
        const d60 = new Date(); d60.setDate(d60.getDate() - 60);
        const { data } = await supabase
            .from('pedidos')
            .select('id, cliente_nombre, estado, total_final, created_at')
            .eq('tienda_id', tiendaId)
            .gte('created_at', d60.toISOString())
            .order('created_at', { ascending: false });
        if(data) setHistoryOrders(data);
    }, [tiendaId]);

    // Orquestador de carga inicial post-login
    useEffect(() => {
        if (isAuthenticated && tiendaId) {
            setLoading(true); // Reinicia carga al iniciar sesión
            fetchTiendaData();
            loadHistory();
            
            const ordersChannel = supabase.channel('admin_orders_' + tiendaId)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos', filter: `tienda_id=eq.${tiendaId}` }, (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setOrders(prev => [payload.new, ...prev]);
                        setHasNewOrder(true);
                        alertSound.play().catch(e=>console.log("Audio block"));
                        if (autoPrintRef.current) {
                            setTicketOrder(payload.new);
                            setTimeout(() => window.print(), 800);
                        }
                    } else if (payload.eventType === 'UPDATE' && payload.new.estado !== 'pendiente') {
                        setOrders(prev => prev.filter(o => o.id !== payload.new.id));
                    }
                }).subscribe();
                
            return () => { supabase.removeChannel(ordersChannel); };
        }
    }, [isAuthenticated, tiendaId, fetchTiendaData, loadHistory]);

    useEffect(() => {
        if (isAuthenticated && products.length > 0) {
            loadStats();
        }
    }, [metricsDateFilter, products, loadStats, isAuthenticated]);

    const acknowledgeNewOrder = () => { setHasNewOrder(false); alertSound.pause(); alertSound.currentTime = 0; };

    // 🔐 Login real con Supabase Auth + verificación de permiso sobre la tienda actual
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError(false);
        setLoading(true);

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });

        if (authError || !authData.user) {
            setLoginError(true);
            setLoading(false);
            return;
        }

        const { data: perfil, error: perfilError } = await supabase
            .from('perfiles')
            .select('rol, tienda_id')
            .eq('id', authData.user.id)
            .single();

        if (perfilError || !perfil) {
            setLoginError(true);
            setLoading(false);
            await supabase.auth.signOut();
            return;
        }

        const tienePermiso = perfil.rol === 'superadmin' || perfil.tienda_id === tiendaId;

        if (!tienePermiso) {
            setLoginError(true);
            setLoading(false);
            await supabase.auth.signOut();
            return;
        }

        setIsAuthenticated(true);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setEmail('');
        setPassword('');
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast("Solo se permiten imágenes (PNG, JPG)"); return;
        }

        setUploadingLogo(true);
        setLogoUploadProgress(10);

        const progressInterval = setInterval(() => {
            setLogoUploadProgress(prev => (prev > 90 ? 90 : prev + 15));
        }, 300);

        try {
            if (configForm.logo_url) {
                const urlParts = configForm.logo_url.split('/');
                const oldFileName = urlParts[urlParts.length - 1];
                if (oldFileName) await supabase.storage.from('logos').remove([oldFileName]);
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `logo_${tiendaId}_${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, file);
            if (uploadError) throw uploadError;

            clearInterval(progressInterval);
            setLogoUploadProgress(100);

            const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);

            setTimeout(() => {
                setConfigForm(prev => ({ ...prev, logo_url: publicUrl }));
                showToast('Logo subido exitosamente.');
                setUploadingLogo(false);
                setLogoUploadProgress(0);
            }, 500);
        } catch (err) {
            clearInterval(progressInterval);
            showToast('Error al subir imagen.');
            setUploadingLogo(false); setLogoUploadProgress(0);
        }
    };

    const handleRemoveLogo = async () => {
        if(!confirm("¿Eliminar logo actual de la tienda?")) return;
        try {
            if (configForm.logo_url) {
                const urlParts = configForm.logo_url.split('/');
                const oldFileName = urlParts[urlParts.length - 1];
                if (oldFileName) await supabase.storage.from('logos').remove([oldFileName]);
            }
            setConfigForm(prev => ({ ...prev, logo_url: null }));
            showToast("Logo eliminado. Guarda los ajustes.");
        } catch (e) { showToast("Error al borrar el logo."); }
    };

    const saveStoreSettings = async (e) => {
        e.preventDefault();
        
        let formattedSlug = configForm.slug ? configForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') : null;

        const updateData = {
            nombre: configForm.nombre, telefono_whatsapp: configForm.telefono_whatsapp, logo_url: configForm.logo_url,
            mensaje_bienvenida: configForm.mensaje_bienvenida, mensaje_cerrado: configForm.mensaje_cerrado,
            slug: formattedSlug, dominio_personal: configForm.dominio_personal?.trim().toLowerCase(),
            color_primario: configForm.color_primario, color_secundario: configForm.color_secundario, 
            color_fondo: configForm.color_fondo, color_delivery: configForm.color_delivery, color_pickup: configForm.color_pickup,
            latitud: parseFloat(configForm.latitud), longitud: parseFloat(configForm.longitud),
            max_delivery_radius: parseFloat(configForm.max_delivery_radius),
            delivery_tiers: Array.isArray(configForm.delivery_tiers) ? configForm.delivery_tiers : []
        };

        try {
            const { error } = await supabase.from('tiendas').update(updateData).eq('id', tiendaId);
            if (error) {
                if (error.code === '23505') throw new Error("Ese SLUG o Dominio ya está en uso por otra tienda.");
                throw error;
            }
            setTienda({...tienda, ...updateData});
            setConfigForm({...configForm, slug: formattedSlug});
            showToast('¡Ajustes guardados correctamente!');
        } catch (err) { alert(err.message || 'Error al guardar ajustes.'); }
    };

    const handleTierChange = (index, field, value) => {
        const safeTiers = Array.isArray(configForm.delivery_tiers) ? configForm.delivery_tiers : [];
        const newTiers = [...safeTiers];
        newTiers[index] = { ...newTiers[index] };
        newTiers[index][field] = field === 'name' ? value : parseFloat(value) || 0;
        setConfigForm({...configForm, delivery_tiers: newTiers});
    };

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

    const toggleStore = async () => { 
        const newState = !tienda.abierto; 
        setTienda({...tienda, abierto: newState}); 
        try {
            const { error } = await supabase.from('tiendas').update({ abierto: newState }).eq('id', tiendaId); 
            if(error) throw error;
            showToast(newState ? "✅ Tienda ABIERTA" : "🛑 Tienda CERRADA");
        } catch (err) {
            showToast("Error de red."); setTienda({...tienda, abierto: !newState});
        }
    };
    
    const toggleProduct = async (id, currentStatus) => { 
        setProducts(prev => prev.map(p => p.id === id ? { ...p, disponible: !currentStatus } : p)); 
        await supabase.from('menu_items').update({ disponible: !currentStatus }).eq('id', id); 
    };
    
    const guardarPrecio = async (id, nuevoPrecio) => { 
        if(isNaN(nuevoPrecio)) return; 
        setProducts(prev => prev.map(p => p.id === id ? { ...p, precio: nuevoPrecio } : p));
        await supabase.from('menu_items').update({ precio: nuevoPrecio }).eq('id', id); 
    };
    
    const deleteProduct = async (item) => { 
        if(!confirm("¿Borrar producto?")) return; 
        if (item.image_url) {
            const urlParts = item.image_url.split('/');
            await supabase.storage.from('productos').remove([urlParts[urlParts.length - 1]]);
        }
        if (item.video_url) {
            const urlParts = item.video_url.split('/');
            await supabase.storage.from('productos').remove([urlParts[urlParts.length - 1]]);
        }
        setProducts(prev => prev.filter(p => p.id !== item.id)); 
        await supabase.from('menu_items').delete().eq('id', item.id); 
    };
    
    const deleteCategory = async (id) => { 
        if(!confirm("¿Borrar categoría y TODOS sus productos?")) return; 
        await supabase.from('categorias').delete().eq('id', id); 
        setCategories(prev => prev.filter(c => c.id !== id)); 
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

    const handlePrint = (order) => { setTicketOrder(order); setTimeout(() => { window.print(); }, 500); };

    // BÚSQUEDA Y FILTRADO INVENTARIO
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

    // FILTRADO HISTORIAL TABLA
    const filteredHistoryList = useMemo(() => {
        const now = new Date();
        return historyOrders.filter(o => {
            if (o.estado === 'pendiente') return false; 
            if (historyFilterStatus !== 'todos' && o.estado !== historyFilterStatus) return false;
            const orderDate = new Date(o.created_at);
            const diffTime = Math.abs(now - orderDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= historyFilterDays;
        });
    }, [historyOrders, historyFilterDays, historyFilterStatus]);

    // RENDERIZADO PANTALLA CARGA/ERROR
    if (tiendaError) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-950 text-white text-center">
            <div className="text-6xl mb-4">🛑</div>
            <h1 className="text-2xl font-black mb-2 uppercase">Acceso Denegado</h1>
            <p className="text-gray-400">{tiendaError}</p>
        </div>
    );
    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900"><div className="loader"></div></div>;

    // 🔐 PANTALLA LOGIN (email + contraseña real de Supabase Auth)
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950 text-white">
                <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl max-w-md w-full shadow-2xl text-center animate-card">
                    <div className="w-16 h-16 bg-orange-600/20 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-orange-600/30"><Icons.Lock /></div>
                    <h1 className="text-2xl font-black tracking-wide mb-2">Panel Administrativo</h1>
                    <p className="text-gray-400 text-sm mb-6">Ingresa con tu correo y contraseña</p>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input type="email" required placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white text-center outline-none focus:border-orange-500 shadow-inner" disabled={loading} />
                        <input type="password" required placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white text-center outline-none focus:border-orange-500 shadow-inner" disabled={loading} />
                        {loginError && <p className="text-red-500 text-xs font-bold">Correo o contraseña incorrectos, o no tienes acceso a esta tienda.</p>}
                        <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 font-bold py-4 rounded-xl shadow-lg transition-all text-lg active:scale-95 disabled:opacity-50">INGRESAR AL PANEL</button>
                    </form>
                </div>
            </div>
        );
    }

    const safeTiers = configForm && Array.isArray(configForm.delivery_tiers) ? configForm.delivery_tiers : [];
    const identificador = tienda?.slug || tiendaId;
    const linkMenuQR = isPremiumDomain ? `https://${cleanHostname}/menu` : `https://${window.location.hostname}/menu?tienda=${identificador}`;

    // PANEL PRINCIPAL
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
                            <Icons.Printer />
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

                        <button onClick={handleLogout} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/50 px-3 py-2 rounded-lg text-xs font-bold transition-all">SALIR</button>
                    </div>
                </div>
                
                <div className="flex gap-2 overflow-x-auto no-scrollbar w-full">
                    <button onClick={()=>setView('orders')} className={`flex-shrink-0 flex-1 min-w-[100px] py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${view==='orders' ? 'bg-orange-600' : 'bg-gray-700 text-gray-400'}`}><Icons.Moto/> PEDIDOS {orders.length > 0 && <span className="bg-red-600 px-2 py-0.5 rounded-full animate-pulse">{orders.length}</span>}</button>
                    <button onClick={()=>setView('inventory')} className={`flex-shrink-0 flex-1 min-w-[100px] py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${view==='inventory' ? 'bg-orange-600' : 'bg-gray-700 text-gray-400'}`}><Icons.Menu/> INVENTARIO</button>
                    <button onClick={()=>setView('stats')} className={`flex-shrink-0 flex-1 min-w-[100px] py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${view==='stats' ? 'bg-orange-600' : 'bg-gray-700 text-gray-400'}`}><Icons.Chart/> MÉTRICAS</button>
                    <button onClick={()=>setView('settings')} className={`flex-shrink-0 flex-1 min-w-[100px] py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${view==='settings' ? 'bg-orange-600' : 'bg-gray-700 text-gray-400'}`}><Icons.Settings/> AJUSTES</button>
                </div>
            </header>

            {/* VISTA PEDIDOS */}
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

            {/* VISTA MÉTRICAS */}
            {view === 'stats' && (
                <div className="p-4 animate-card max-w-4xl mx-auto space-y-6 w-full">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-4 gap-4">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-wider">Métricas</h2>
                            <p className="text-gray-400 text-sm">Resumen de ingresos y movimientos</p>
                        </div>
                        <div className="flex gap-2">
                            <select value={metricsDateFilter} onChange={(e) => setMetricsDateFilter(e.target.value)} className="bg-gray-800 text-white border border-gray-700 rounded-lg p-2 text-sm outline-none focus:border-orange-500">
                                <option value="semana">Esta semana (Dom-Sab)</option>
                                <option value="30_dias">Últimos 30 días</option>
                                <option value="mes_actual">Mes Actual</option>
                                <option value="mes_anterior">Mes Anterior</option>
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
                                )) : <p className="text-gray-500 text-sm">Sin datos suficientes</p>}
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

            {/* VISTA INVENTARIO */}
            {view === 'inventory' && (
                <div className="p-4 animate-card max-w-4xl mx-auto w-full">
                    <div className="sticky top-[130px] z-40 bg-gray-900/95 backdrop-blur py-3 -mx-4 px-4 border-b border-gray-800 flex flex-col gap-3">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input type="text" placeholder="Buscar producto en vivo..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full bg-gray-800 p-3 pl-10 rounded-xl border border-gray-700 focus:border-orange-500 outline-none"/>
                                <div className="absolute left-3 top-3.5 text-gray-500"><Icons.Search/></div>
                                {search && <button onClick={() => setSearch('')} className="absolute right-3 top-3.5 text-gray-500 hover:text-white"><Icons.X/></button>}
                            </div>
                            <button onClick={()=>setModal({open: true, type: 'category', editItem: null})} className="bg-gray-700 px-4 rounded-xl border border-gray-600 hover:bg-gray-600 transition flex items-center justify-center font-bold text-sm shrink-0">
                                + CAT
                            </button>
                            <button onClick={()=>setModal({open: true, type: 'product', editItem: null})} className="bg-orange-600 px-4 rounded-xl hover:bg-orange-500 transition flex items-center justify-center font-bold text-sm shrink-0">
                                + PROD
                            </button>
                        </div>

                        {!search && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                <button onClick={()=>setActiveCat('Todas')} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${activeCat === 'Todas' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-600'}`}>Todas</button>
                                {categories.map(c => (
                                    <button key={c.id} onClick={()=>setActiveCat(c.nombre)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${activeCat === c.nombre ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-600'}`}>{c.nombre}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-8 mt-4">
                        {processedInventory.length === 0 && search && (
                            <div className="text-center py-10 text-gray-500">No se encontraron productos con "{search}"</div>
                        )}
                        
                        {processedInventory.map(cat => (
                            <div key={cat.id}>
                                <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-3">
                                    <div>
                                        <h2 className="text-orange-500 font-bold text-lg break-words">{cat.nombre}</h2>
                                        {cat.nota_preparacion && <p className="text-xs text-gray-500 break-words">{cat.nota_preparacion}</p>}
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={()=>setModal({open:true, type:'category', editItem:cat})} className="bg-blue-900/20 text-blue-500 p-2 rounded-lg hover:bg-blue-900/40"><Icons.Edit/></button>
                                        <button onClick={()=>deleteCategory(cat.id)} className="bg-red-900/20 text-red-500 p-2 rounded-lg hover:bg-red-900/40"><Icons.Trash/></button>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {cat.items.map(item => (
                                        <div key={item.id} className={`relative p-3 rounded-xl border flex flex-col justify-between ${item.disponible ? 'bg-gray-800 border-gray-700' : 'bg-gray-900 border-red-900/50 opacity-60'}`}>
                                            <div className="absolute top-2 right-2 flex gap-1">
                                                <button onClick={()=>setModal({open:true, type:'product', editItem:item})} className="text-gray-500 hover:text-blue-500 p-1"><Icons.Edit/></button>
                                                <button onClick={()=>deleteProduct(item)} className="text-gray-500 hover:text-red-500 p-1"><Icons.Trash/></button>
                                            </div>
                                            <div className="mb-2 pr-12 min-w-0 break-words">
                                                <h3 className="font-bold leading-tight text-sm">
                                                    {item.nombre}
                                                    {item.video_url && <span className="ml-2 text-[10px] bg-blue-900/50 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800 align-middle inline-block mt-1">🎥 Vid</span>}
                                                    {item.image_url && <span className="ml-1 text-[10px] bg-purple-900/50 text-purple-400 px-1.5 py-0.5 rounded border border-purple-800 align-middle inline-block mt-1">🖼️ Img</span>}
                                                </h3>
                                                
                                                {item.descripcion && <p className="text-gray-500 text-[10px] mt-1 line-clamp-2 leading-tight break-words">{item.descripcion}</p>}
                                                
                                                <div className="flex items-center mt-1">
                                                    <span className="text-gray-500 text-xs">$</span>
                                                    <input type="number" defaultValue={item.precio} onBlur={(e) => { if(e.target.value != item.precio) guardarPrecio(item.id, parseFloat(e.target.value)) }} className="bg-transparent text-gray-400 text-sm font-bold w-16 outline-none border-b border-gray-700 focus:border-orange-500 focus:text-white" />
                                                </div>
                                                
                                                {item.removables && item.removables.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {item.removables.map((t, idx) => <span key={idx} className="text-[9px] bg-gray-700 text-gray-300 px-1.5 rounded border border-gray-600">Sin {t}</span>)}
                                                    </div>
                                                )}
                                                {item.extras && item.extras.length > 0 && (
                                                    <p className="text-[10px] text-gray-500 mt-2 italic">Contiene {item.extras.length} extra(s) config.</p>
                                                )}
                                            </div>
                                            <button onClick={()=>toggleProduct(item.id, item.disponible)} className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${item.disponible ? 'bg-green-600/20 text-green-400 border border-green-600/50' : 'bg-red-600/20 text-red-400 border border-red-600/50'}`}>{item.disponible ? 'DISPONIBLE' : 'AGOTADO'}</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VISTA AJUSTES */}
            {view === 'settings' && configForm && (
                <div className="p-4 animate-card max-w-2xl mx-auto space-y-6 w-full">
                    <form onSubmit={saveStoreSettings}>
                        
                        {/* URLS Y DOMINIO */}
                        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg mb-6 w-full overflow-hidden">
                            <h3 className="text-orange-400 font-bold mb-4 uppercase tracking-widest text-sm border-b border-gray-700 pb-2">Identidad Web</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 text-xs mb-1">Slug (Identificador URL)</label>
                                    <div className="flex flex-col sm:flex-row items-center gap-2">
                                        <span className="text-gray-500 text-sm">dominio.com/menu?tienda=</span>
                                        <input type="text" placeholder="mi-negocio" value={configForm.slug || ''} onChange={e=>setConfigForm({...configForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 outline-none focus:border-orange-500" />
                                    </div>
                                    <p className="text-[11px] text-red-400 mt-1">⚠️ Cuidado: Si cambias esto, los códigos QR antiguos dejarán de funcionar.</p>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs mb-1">Dominio Personal (Premium Opcional)</label>
                                    <input type="text" placeholder="ej: www.mirestaurante.com" value={configForm.dominio_personal || ''} onChange={e=>setConfigForm({...configForm, dominio_personal: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 outline-none focus:border-orange-500" />
                                    <p className="text-[11px] text-gray-500 mt-1">Solo llénalo si has conectado un dominio propio con nosotros.</p>
                                </div>
                            </div>
                        </div>

                        {/* LOGO CON BORRAR */}
                        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg mb-6 w-full overflow-hidden">
                            <h3 className="text-orange-400 font-bold mb-4 uppercase tracking-widest text-sm border-b border-gray-700 pb-2">Logotipo del Restaurante</h3>
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-24 h-24 rounded-full border-2 border-orange-500 overflow-hidden bg-gray-900 flex items-center justify-center shadow-inner flex-shrink-0">
                                        {configForm.logo_url ? (
                                            <img src={configForm.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs text-gray-500">Sin Logo</span>
                                        )}
                                    </div>
                                    {configForm.logo_url && (
                                        <button type="button" onClick={handleRemoveLogo} className="text-[10px] bg-red-900/50 text-red-400 border border-red-800 px-3 py-1 rounded hover:bg-red-800 hover:text-white transition">Eliminar</button>
                                    )}
                                </div>

                                <div className="flex-1 w-full space-y-2">
                                    <label className="block text-gray-400 text-xs">Sube tu imagen (PNG o JPG recomendado)</label>
                                    <div className="flex flex-col gap-2 w-full">
                                        <label className={`flex-1 bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm cursor-pointer hover:border-orange-500 transition-colors flex items-center justify-center gap-2 break-words ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <Icons.Upload />
                                            <span className="truncate">{uploadingLogo ? `Subiendo... ${Math.round(logoUploadProgress)}%` : 'Seleccionar nuevo logo...'}</span>
                                            <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleLogoUpload} disabled={uploadingLogo} className="hidden" />
                                        </label>
                                        
                                        {uploadingLogo && logoUploadProgress > 0 && (
                                            <div className="w-full bg-gray-700 rounded-full h-2 mt-1 overflow-hidden">
                                                <div className="bg-orange-500 h-full rounded-full transition-all duration-300" style={{width: `${logoUploadProgress}%`}}></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* GENERALES */}
                        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg mb-6 w-full overflow-hidden">
                            <h3 className="text-orange-400 font-bold mb-4 uppercase tracking-widest text-sm border-b border-gray-700 pb-2">Datos Generales</h3>
                            <div className="space-y-4">
                                <div><label className="block text-gray-400 text-xs mb-1">Nombre Comercial</label><input type="text" required value={configForm.nombre} onChange={e=>setConfigForm({...configForm, nombre: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 outline-none focus:border-orange-500" /></div>
                                <div><label className="block text-gray-400 text-xs mb-1">Teléfono (WhatsApp Recepción)</label><input type="text" required value={configForm.telefono_whatsapp} onChange={e=>setConfigForm({...configForm, telefono_whatsapp: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 outline-none focus:border-orange-500" /></div>
                                <div><label className="block text-gray-400 text-xs mb-1">Mensaje de Bienvenida (Top App)</label><input type="text" value={configForm.mensaje_bienvenida || ''} onChange={e=>setConfigForm({...configForm, mensaje_bienvenida: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 outline-none focus:border-orange-500" /></div>
                                <div><label className="block text-gray-400 text-xs mb-1">Mensaje de Cierre (Cuando apagas la tienda)</label><input type="text" value={configForm.mensaje_cerrado || ''} onChange={e=>setConfigForm({...configForm, mensaje_cerrado: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 outline-none focus:border-orange-500" /></div>
                            </div>
                        </div>

                        {/* CODIGO QR */}
                        <div className="bg-gray-800 p-6 rounded-xl border border-orange-500/40 shadow-xl mb-6 text-center">
                            <h3 className="text-orange-400 font-bold mb-4 uppercase tracking-widest text-sm border-b border-gray-700 pb-2">Código QR del Menú Digital</h3>
                            <p className="text-gray-400 text-xs mb-4">Apunta a: {linkMenuQR}</p>
                            <div className="bg-white p-4 rounded-2xl shadow-inner inline-block mb-4">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(linkMenuQR)}`} alt="QR Code Menú" className="w-48 h-48 object-contain mx-auto" />
                            </div>
                            <div>
                                <button type="button" onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&data=${encodeURIComponent(linkMenuQR)}`, '_blank')} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95">📥 DESCARGAR QR ALTA CALIDAD</button>
                            </div>
                        </div>

                        {/* COLORES EXPLICADOS */}
                        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg mb-6 w-full overflow-hidden">
                            <h3 className="text-orange-400 font-bold mb-4 uppercase tracking-widest text-sm border-b border-gray-700 pb-2">Apariencia (Colores App Clientes)</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
                                <div className="text-center">
                                    <label className="block text-white text-sm font-bold mb-1">Primario</label>
                                    <p className="text-[10px] text-gray-400 mb-2 h-8">Botones de Carrito, Titulos Principales y Bordes Activos.</p>
                                    <input type="color" value={configForm.color_primario || '#f97316'} onChange={e=>setConfigForm({...configForm, color_primario: e.target.value})} className="w-full h-12 rounded cursor-pointer bg-gray-900 border border-gray-600" />
                                </div>
                                <div className="text-center">
                                    <label className="block text-white text-sm font-bold mb-1">Secundario</label>
                                    <p className="text-[10px] text-gray-400 mb-2 h-8">Acentos en gradientes y botones secundarios (Cerrar, etc).</p>
                                    <input type="color" value={configForm.color_secundario || '#ef4444'} onChange={e=>setConfigForm({...configForm, color_secundario: e.target.value})} className="w-full h-12 rounded cursor-pointer bg-gray-900 border border-gray-600" />
                                </div>
                                <div className="text-center">
                                    <label className="block text-white text-sm font-bold mb-1">Fondo App</label>
                                    <p className="text-[10px] text-gray-400 mb-2 h-8">El color base de fondo de Home y Menú (Recomendado oscuro).</p>
                                    <input type="color" value={configForm.color_fondo || '#111827'} onChange={e=>setConfigForm({...configForm, color_fondo: e.target.value})} className="w-full h-12 rounded cursor-pointer bg-gray-900 border border-gray-600" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-gray-700 pt-6">
                                <div className="text-center">
                                    <label className="block text-orange-400 font-bold mb-1">Color Selector Domicilio</label>
                                    <p className="text-[10px] text-gray-400 mb-2">Color del botón de Domicilio en el selector inicial.</p>
                                    <input type="color" value={configForm.color_delivery || '#f97316'} onChange={e=>setConfigForm({...configForm, color_delivery: e.target.value})} className="w-2/3 mx-auto h-12 rounded cursor-pointer bg-gray-900 border border-gray-600" />
                                </div>
                                <div className="text-center">
                                    <label className="block text-purple-400 font-bold mb-1">Color Selector Pickup</label>
                                    <p className="text-[10px] text-gray-400 mb-2">Color del botón de Pickup en el selector inicial.</p>
                                    <input type="color" value={configForm.color_pickup || '#a855f7'} onChange={e=>setConfigForm({...configForm, color_pickup: e.target.value})} className="w-2/3 mx-auto h-12 rounded cursor-pointer bg-gray-900 border border-gray-600" />
                                </div>
                            </div>
                        </div>

                        {/* GEOLOCALIZACION Y ENVIOS */}
                        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg mb-6 w-full overflow-hidden">
                            <h3 className="text-orange-400 font-bold mb-4 uppercase tracking-widest text-sm border-b border-gray-700 pb-2">Ubicación y Costos de Envío (GPS)</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div><label className="block text-gray-400 text-xs mb-1">Latitud Origen</label><input type="number" step="any" required value={configForm.latitud} onChange={e=>setConfigForm({...configForm, latitud: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 outline-none" /></div>
                                    <div><label className="block text-gray-400 text-xs mb-1">Longitud Origen</label><input type="number" step="any" required value={configForm.longitud} onChange={e=>setConfigForm({...configForm, longitud: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 outline-none" /></div>
                                </div>
                                <div><label className="block text-gray-400 text-xs mb-1">Radio Máximo de Entrega (km)</label><input type="number" step="0.1" required value={configForm.max_delivery_radius} onChange={e=>setConfigForm({...configForm, max_delivery_radius: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 outline-none" /></div>
                                
                                <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 w-full overflow-hidden">
                                    <label className="block text-gray-400 text-xs mb-3 font-bold">Zonas y Tarifas de Envío</label>
                                    {safeTiers.map((tier, index) => (
                                        <div key={index} className="flex flex-wrap sm:flex-nowrap gap-2 mb-2 items-center w-full">
                                            <input type="number" step="0.1" placeholder="Km máx" title="Distancia Máxima en Km" value={tier.maxDistance} onChange={e => handleTierChange(index, 'maxDistance', e.target.value)} className="w-20 sm:w-24 bg-gray-800 border border-gray-600 rounded p-2 text-sm" />
                                            <input type="number" step="0.1" placeholder="$ Costo" title="Costo del envío" value={tier.cost} onChange={e => handleTierChange(index, 'cost', e.target.value)} className="w-20 sm:w-24 bg-gray-800 border border-gray-600 rounded p-2 text-sm" />
                                            <input type="text" placeholder="Nombre Zona (Ej: Cerca)" title="Nombre de la zona para tu referencia" value={tier.name} onChange={e => handleTierChange(index, 'name', e.target.value)} className="flex-1 w-full sm:w-auto min-w-0 bg-gray-800 border border-gray-600 rounded p-2 text-sm" />
                                            <button type="button" onClick={() => setConfigForm({...configForm, delivery_tiers: configForm.delivery_tiers.filter((_, i) => i !== index)})} className="text-red-500 p-2 shrink-0"><Icons.X /></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setConfigForm({...configForm, delivery_tiers: [...safeTiers, {maxDistance: 5, cost: 30, name: "Zona General"}]})} className="mt-2 text-orange-400 text-sm font-bold">+ Agregar Tarifa</button>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-green-600 hover:bg-green-500 font-bold py-4 rounded-xl shadow-lg transition-all text-xl active:scale-95">
                            GUARDAR AJUSTES
                        </button>
                    </form>
                </div>
            )}

            <Modal isOpen={modal.open} type={modal.type} editItem={modal.editItem} categories={categories} onClose={()=>setModal({open:false, type:null, editItem:null})} onSave={saveItem} tiendaId={tiendaId}/>
            <Ticket order={ticketOrder} tienda={tienda}/>
        </div>
    );
}