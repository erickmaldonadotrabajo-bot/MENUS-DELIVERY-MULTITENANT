import React from 'react';
import { AdminIcons } from './AdminIcons';

export const SettingsView = ({ 
    configForm, setConfigForm, saveStoreSettings, 
    handleLogoUpload, handleRemoveLogo, uploadingLogo, logoUploadProgress, 
    linkMenuQR, handleTierChange 
}) => {
    if (!configForm) return null;
    const safeTiers = Array.isArray(configForm.delivery_tiers) ? configForm.delivery_tiers : [];

    return (
        <div className="p-4 animate-card max-w-2xl mx-auto space-y-6 w-full">
            <form onSubmit={saveStoreSettings}>
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
                                    <AdminIcons.Upload />
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

                <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg mb-6 w-full overflow-hidden">
                    <h3 className="text-orange-400 font-bold mb-4 uppercase tracking-widest text-sm border-b border-gray-700 pb-2">Datos Generales</h3>
                    <div className="space-y-4">
                        <div><label className="block text-gray-400 text-xs mb-1">Nombre Comercial</label><input type="text" required value={configForm.nombre} onChange={e=>setConfigForm({...configForm, nombre: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 outline-none focus:border-orange-500" /></div>
                        <div><label className="block text-gray-400 text-xs mb-1">Teléfono (WhatsApp Recepción)</label><input type="text" required value={configForm.telefono_whatsapp} onChange={e=>setConfigForm({...configForm, telefono_whatsapp: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 outline-none focus:border-orange-500" /></div>
                        <div><label className="block text-gray-400 text-xs mb-1">Pedido Mínimo a Domicilio ($)</label><input type="number" step="any" required value={configForm.pedido_minimo || 0} onChange={e=>setConfigForm({...configForm, pedido_minimo: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 outline-none focus:border-orange-500" /></div>
                        <div><label className="block text-gray-400 text-xs mb-1">Mensaje de Bienvenida (Top App)</label><input type="text" value={configForm.mensaje_bienvenida || ''} onChange={e=>setConfigForm({...configForm, mensaje_bienvenida: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 outline-none focus:border-orange-500" /></div>
                        <div><label className="block text-gray-400 text-xs mb-1">Mensaje de Cierre (Cuando apagas la tienda)</label><input type="text" value={configForm.mensaje_cerrado || ''} onChange={e=>setConfigForm({...configForm, mensaje_cerrado: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 outline-none focus:border-orange-500" /></div>
                    </div>
                </div>

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

                <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg mb-6 w-full overflow-hidden">
                    <h3 className="text-orange-400 font-bold mb-4 uppercase tracking-widest text-sm border-b border-gray-700 pb-2">Ubicación y Costos de Envío (GPS)</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="block text-gray-400 text-xs mb-1">Latitud Origen</label><input type="number" step="any" required value={configForm.latitud || 0} onChange={e=>setConfigForm({...configForm, latitud: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 outline-none" /></div>
                            <div><label className="block text-gray-400 text-xs mb-1">Longitud Origen</label><input type="number" step="any" required value={configForm.longitud || 0} onChange={e=>setConfigForm({...configForm, longitud: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 outline-none" /></div>
                        </div>
                        <div><label className="block text-gray-400 text-xs mb-1">Radio Máximo de Entrega (km)</label><input type="number" step="0.1" required value={configForm.max_delivery_radius || 0} onChange={e=>setConfigForm({...configForm, max_delivery_radius: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 outline-none" /></div>
                        
                        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 w-full overflow-hidden">
                            <label className="block text-gray-400 text-xs mb-3 font-bold">Zonas y Tarifas de Envío</label>
                            {safeTiers.map((tier, index) => (
                                <div key={index} className="flex flex-wrap sm:flex-nowrap gap-2 mb-2 items-center w-full">
                                    <input type="number" step="0.1" placeholder="Km máx" title="Distancia Máxima en Km" value={tier.maxDistance} onChange={e => handleTierChange(index, 'maxDistance', e.target.value)} className="w-20 sm:w-24 bg-gray-800 border border-gray-600 rounded p-2 text-sm" />
                                    <input type="number" step="0.1" placeholder="$ Costo" title="Costo del envío" value={tier.cost} onChange={e => handleTierChange(index, 'cost', e.target.value)} className="w-20 sm:w-24 bg-gray-800 border border-gray-600 rounded p-2 text-sm" />
                                    <input type="text" placeholder="Nombre Zona (Ej: Cerca)" title="Nombre de la zona para tu referencia" value={tier.name} onChange={e => handleTierChange(index, 'name', e.target.value)} className="flex-1 w-full sm:w-auto min-w-0 bg-gray-800 border border-gray-600 rounded p-2 text-sm" />
                                    <button type="button" onClick={() => setConfigForm({...configForm, delivery_tiers: configForm.delivery_tiers.filter((_, i) => i !== index)})} className="text-red-500 p-2 shrink-0"><AdminIcons.X /></button>
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
    );
};