import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { AdminIcons } from './AdminIcons';
import { limpiarTexto } from '../../utils/adminHelpers';

export const AdminModal = ({isOpen, onClose, type, editItem, categories, products, tienda, onSave}) => {
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
        if (extrasList.length < 20) setExtrasList([...extrasList, { nombre: '', precio: '' }]);
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
        } catch (e) { console.error("Fallo al intentar borrar archivo", e); }
    };

    const handleRemoveMedia = async (field) => {
        const currentUrl = form[field];
        if (currentUrl) {
            if (confirm(`¿Estás seguro de eliminar esta imagen?`)) {
                await deleteOldFileFromBucket(currentUrl);
                setForm(prev => ({ ...prev, [field]: null }));
            }
        }
    };

    const compressImage = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1000;
                    const MAX_HEIGHT = 1000;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (!blob) return reject(new Error("Falló la compresión"));
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                            type: 'image/webp',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    }, 'image/webp', 0.8);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleMediaUpload = async (e, field) => {
        let file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) return alert("⚠️ Imagen demasiado pesada (Máx 10MB).");
        if (!file.type.startsWith('image/')) return alert("⚠️ Selecciona una IMAGEN válida.");

        const MAX_PHOTOS = tienda?.tiene_panel_admin ? 25 : 10;
        const currentPhotoCount = products.filter(p => p.image_url).length;
        
        if (currentPhotoCount >= MAX_PHOTOS && !form.image_url) {
            alert(`⛔ LÍMITE ALCANZADO: Tu plan actual solo permite ${MAX_PHOTOS} fotos estratégicas para optimizar la velocidad del menú. Elimina fotos de otros productos para subir una nueva.`);
            return;
        }

        setUploadingField(field);
        try {
            file = await compressImage(file);
            const fileName = `${Date.now()}_${file.name}`;
            
            const { data, error } = await supabase.storage.from('productos').upload(fileName, file);
            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(fileName);
            setForm(prev => ({ ...prev, [field]: publicUrl }));

        } catch (error) {
            console.error(error);
            alert("Error al subir la imagen.");
        } finally {
            setUploadingField(null);
        }
    };
    
    const handleSubmit = (e) => { 
        e.preventDefault(); 
        const cleanExtras = extrasList.filter(ext => ext.nombre.trim() !== '').map(ext => ({
            ...ext, nombre: limpiarTexto(ext.nombre, 50)
        }));
        const cleanToppings = toppingsList.map(t => limpiarTexto(t, 50));

        let finalData;
        if (type === 'category') {
            finalData = { 
                nombre: limpiarTexto(form.nombre, 50), 
                nota_preparacion: form.nota_preparacion ? limpiarTexto(form.nota_preparacion, 150) : null 
            };
        } else {
            finalData = { 
                ...form, 
                nombre: limpiarTexto(form.nombre, 80),
                descripcion: form.descripcion ? limpiarTexto(form.descripcion, 250) : null,
                precio: parseFloat(form.precio),
                extras: cleanExtras, 
                has_extra: cleanExtras.length > 0, 
                removables: cleanToppings 
            };
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
                                <div><label className="block text-gray-400 text-sm mb-1">Precio Base</label><input required type="number" step="any" value={form.precio || ''} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none" onChange={e => setForm({...form, precio: e.target.value})} disabled={uploadingField !== null} /></div>
                            </div>
                            <div className="p-3 bg-gray-900 rounded-xl border border-gray-700">
                                <label className="block text-orange-400 text-sm font-bold mb-2">Ingredientes Removibles</label>
                                <div className="flex gap-2 mb-2">
                                    <input className="flex-1 min-w-0 bg-gray-800 border border-gray-600 rounded-lg p-2 text-white text-sm outline-none" placeholder="Ej: Cebolla" value={newTopping} onChange={(e) => setNewTopping(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopping())} disabled={uploadingField !== null} />
                                    <button type="button" onClick={handleAddTopping} className="bg-gray-700 px-3 rounded-lg text-white hover:bg-gray-600" disabled={uploadingField !== null}><AdminIcons.Plus /></button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {toppingsList.map((t, i) => (
                                        <span key={i} className="bg-orange-600/20 text-orange-200 text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-orange-600/40">{t}<button type="button" onClick={() => removeTopping(i)} className="hover:text-white" disabled={uploadingField !== null}><AdminIcons.X /></button></span>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">URL de Imagen (Opcional)</label>
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <input type="text" value={form.image_url || ''} className="flex-1 bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-500 outline-none focus:border-orange-500 min-w-0" placeholder="Sube foto o video..." readOnly />
                                        {form.image_url && (
                                            <button type="button" onClick={() => handleRemoveMedia('image_url')} className="bg-red-900/50 border border-red-700 rounded-lg px-3 text-red-400 hover:bg-red-800 transition shrink-0" title="Eliminar Imagen"><AdminIcons.Trash /></button>
                                        )}
                                        <label className={`bg-gray-800 border border-gray-600 rounded-lg px-4 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition shrink-0 ${uploadingField !== null && uploadingField !== 'image_url' ? 'opacity-50 pointer-events-none' : ''}`} title={form.image_url ? "Reemplazar Imagen" : "Subir Imagen"}>
                                            {uploadingField === 'image_url' ? <span className="text-xs text-orange-400 font-bold animate-pulse">Subiendo...</span> : <AdminIcons.Upload />}
                                            <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={(e) => handleMediaUpload(e, 'image_url')} disabled={uploadingField !== null} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-xl border border-gray-700">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-orange-400 text-sm font-bold">Extras del Producto (Máx 20)</label>
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
                                                <input type="number" step="any" placeholder="0" value={ext.precio} onChange={e => updateExtra(i, 'precio', e.target.value)} className="w-full bg-gray-800 border border-gray-600 py-2 pr-2 pl-6 rounded-lg text-white text-sm outline-none focus:border-orange-500" disabled={uploadingField !== null} />
                                            </div>
                                            <button type="button" onClick={() => removeExtra(i)} className="text-red-500 hover:text-red-400 p-1 shrink-0" disabled={uploadingField !== null}><AdminIcons.Trash /></button>
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