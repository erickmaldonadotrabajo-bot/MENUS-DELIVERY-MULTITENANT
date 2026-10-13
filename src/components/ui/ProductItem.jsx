// src/components/ui/ProductItem.jsx
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Icons } from './Icons';
import { Button } from './Button';

export const ProductItem = memo(({ item, category, onAdd, config, onShowMedia }) => {
    const [conTodo, setConTodo] = useState(true);
    const [exclusions, setExclusions] = useState({});
    const [selectedExtras, setSelectedExtras] = useState([]); 
    
    const isAvailable = item.disponible;
    const availableToppings = useMemo(() => item.removables || [], [item]);

    const parsedExtras = useMemo(() => {
        if (Array.isArray(item.extras) && item.extras.length > 0) return item.extras;
        if (item.has_extra && item.extra_name) return [{ nombre: item.extra_name, precio: item.extra_precio }];
        return [];
    }, [item.extras, item.has_extra, item.extra_name, item.extra_precio]);

    const extrasTotal = selectedExtras.reduce((sum, ext) => sum + (parseFloat(ext.precio) || 0), 0);
    const currentPrice = parseFloat(item.precio) + extrasTotal;
    
    useEffect(() => { 
        setConTodo(true); 
        setExclusions({}); 
        setSelectedExtras([]);
    }, [item.nombre]);
    
    const toggleConTodo = useCallback(() => { 
        if (!conTodo) { setConTodo(true); setExclusions({}); } 
    }, [conTodo]);
    
    const toggleExclusion = useCallback((topping) => { 
        setExclusions(prev => { 
            const newState = !prev[topping]; 
            const newExclusions = { ...prev, [topping]: newState }; 
            const anyExcluded = Object.values(newExclusions).some(val => val === true); 
            setConTodo(!anyExcluded); 
            return newExclusions; 
        }); 
    }, []);

    const toggleExtra = useCallback((extra) => {
        setSelectedExtras(prev => {
            const isSelected = prev.find(e => e.nombre === extra.nombre);
            if (isSelected) return prev.filter(e => e.nombre !== extra.nombre);
            return [...prev, extra];
        });
    }, []);
    
    const handleAdd = useCallback(() => { 
        let details = ""; 
        const activeExclusions = Object.entries(exclusions).filter(([_, isExcluded]) => isExcluded).map(([name]) => name); 
        
        if (availableToppings.length === 0) details = ""; 
        else if (conTodo) details = " (Con Todo)"; 
        else if (activeExclusions.length === availableToppings.length) details = " (SIN NADA / SOLO)"; 
        else if (activeExclusions.length > 0) details = ` (SIN ${activeExclusions.join(', SIN ')})`; 
        else details = " (Con Todo)"; 
        
        const hasAnyExtra = selectedExtras.length > 0;
        const extrasNombres = selectedExtras.map(e => e.nombre).join(', ');

        onAdd({ 
            ...item, 
            name: item.nombre, 
            price: currentPrice, 
            isExtra: hasAnyExtra, 
            extraAppliedName: extrasNombres, 
            details: details 
        }); 

        setSelectedExtras([]);
        setConTodo(true);
        setExclusions({});
    }, [exclusions, conTodo, availableToppings, onAdd, item, currentPrice, selectedExtras]);

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col animate-slide-up h-full ${!isAvailable ? 'opacity-60 bg-gray-100' : ''}`}>
            <div className="p-2 flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-gray-900 text-xl leading-tight">{item.nombre}</h3>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                        <span className="bg-orange-50 text-[var(--color-primary)] px-3 py-1 rounded-lg font-bold text-lg whitespace-nowrap ml-2 border border-[var(--color-primary)]/20">
                            ${currentPrice.toFixed(2)}
                        </span>
                        {!isAvailable && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded mt-1 font-bold">AGOTADO</span>}
                    </div>
                </div>

                {item.descripcion && (
                    <p className="text-sm text-gray-500 mb-3 leading-snug break-words">{item.descripcion}</p>
                )}

                {item.image_url && (
                    <button 
                        onClick={() => onShowMedia({ url: item.image_url, type: 'image' })} 
                        className="mb-4 flex items-center gap-1 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-orange-600 transition-colors shadow-sm"
                    >
                        <Icons.Eye /> Ver Producto
                    </button>
                )}

                {isAvailable && availableToppings.length > 0 && (
                    <div className="mb-4 flex flex-col gap-2 pt-2 border-t border-gray-300">
                        <p className='text-sm text-black-500 mb-1 font-bold'>Personalizar:</p>
                        <label className="flex items-center gap-3 text-base font-bold text-gray-900 cursor-pointer select-none p-2 rounded bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                            <input type="checkbox" checked={conTodo} onChange={toggleConTodo} className="w-5 h-5 rounded" style={{accentColor: config.color_primario || '#f97316'}} />
                            Con Todo
                        </label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            {availableToppings.map(t => ( 
                                <label key={t} className={`flex items-center gap-2 text-sm cursor-pointer select-none p-2 rounded border transition-colors ${exclusions[t] ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                    <input type="checkbox" checked={exclusions[t] || false} onChange={() => toggleExclusion(t)} className="w-4 h-4 rounded" style={{accentColor: '#dc2626'}} />
                                    Sin {t}
                                </label> 
                            ))}
                        </div>
                    </div>
                )}

                {parsedExtras.length > 0 && isAvailable && (
                    <div className="mb-4 flex flex-col gap-2 border-t border-gray-100 pt-3 mt-2">
                        <p className='text-sm text-black-500 mb-1 font-bold'>Extras disponibles:</p>
                        {parsedExtras.map((ext, idx) => {
                            const isSelected = selectedExtras.some(e => e.nombre === ext.nombre);
                            const extPrice = parseFloat(ext.precio) || 0;
                            return (
                                <div key={idx} onClick={() => toggleExtra(ext)} role="button" className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-[var(--color-primary)] bg-orange-50 ring-1 ring-[var(--color-primary)]' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'bg-white border-gray-400'}`}>
                                            {isSelected && <Icons.Check size={14} className="text-white" />}
                                        </div>
                                        <span className="text-sm font-medium text-gray-800">{ext.nombre}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">+{extPrice > 0 ? `$${extPrice.toFixed(2)}` : 'Gratis'}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <div className="p-4 pt-0 mt-auto">
                <Button onClick={handleAdd} disabled={!isAvailable} className="w-full text-lg py-3" icon={Icons.Plus}>
                    {isAvailable ? 'Agregar' : 'No disponible'}
                </Button>
            </div>
        </div>
    );
});