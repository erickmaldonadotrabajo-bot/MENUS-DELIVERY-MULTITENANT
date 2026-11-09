import React, { useState, useMemo, useCallback, memo } from 'react';
import { Icons } from './Icons';
import { Button } from './Button';

export const ProductItem = memo(({ item, onAdd, themeColor, onShowMedia }) => {
    const [conTodo, setConTodo] = useState(true);
    const [exclusions, setExclusions] = useState({});
    const [selectedExtras, setSelectedExtras] = useState([]); 
    
    // ESTADO: Manejo de Variantes (Opciones Excluyentes)
    const [selectedVariants, setSelectedVariants] = useState({});
    
    const isAvailable = item.disponible;
    const availableToppings = useMemo(() => item.removables || [], [item]);

    const parsedExtras = useMemo(() => {
        if (Array.isArray(item.extras) && item.extras.length > 0) return item.extras;
        if (item.has_extra && item.extra_name) return [{ nombre: item.extra_name, precio: item.extra_precio }];
        return [];
    }, [item.extras, item.has_extra, item.extra_name, item.extra_precio]);

    // PARSEO SEGURO: Nueva columna de variantes
    const parsedVariants = useMemo(() => {
        if (!item.variantes) return [];
        return typeof item.variantes === 'string' ? JSON.parse(item.variantes) : item.variantes;
    }, [item.variantes]);

    // CÁLCULO DE PRECIOS
    const extrasTotal = selectedExtras.reduce((sum, ext) => sum + (parseFloat(ext.precio) || 0), 0);
    const variantsTotal = Object.values(selectedVariants).reduce((sum, alt) => sum + (parseFloat(alt.precio_extra) || 0), 0);
    const finalPrice = parseFloat(item.precio) + extrasTotal + variantsTotal;

    // VALIDACIÓN DE BLOQUEO (Seguridad Frontend)
    const isMissingMandatoryVariant = parsedVariants.some(
        (grupo) => grupo.obligatorio && !selectedVariants[grupo.grupo]
    );
    
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

    // HANDLER: Cambio de Variante
    const handleVariantChange = useCallback((grupoNombre, alternativa) => {
        setSelectedVariants(prev => ({
            ...prev,
            [grupoNombre]: alternativa
        }));
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

        const variantNames = Object.entries(selectedVariants)
            .map(([grupo, alt]) => `${grupo}: ${alt.nombre}`)
            .join(' | ');

        if (variantNames) {
            details = details ? `${variantNames} - ${details}` : variantNames;
        }

        onAdd({ 
            ...item, 
            name: item.nombre, 
            price: finalPrice, 
            isExtra: hasAnyExtra, 
            extraAppliedName: extrasNombres, 
            details: details 
        }); 

        setSelectedExtras([]);
        setConTodo(true);
        setExclusions({});
        setSelectedVariants({});
    }, [exclusions, conTodo, availableToppings, onAdd, item, finalPrice, selectedExtras, selectedVariants]);

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col animate-slide-up h-full ${!isAvailable ? 'opacity-60 bg-gray-100' : ''}`}>
            <div className="p-2 flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-gray-900 text-xl leading-tight">{item.nombre}</h3>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                        <span className="bg-orange-50 text-[var(--color-primary)] px-3 py-1 rounded-lg font-bold text-lg whitespace-nowrap ml-2 border border-[var(--color-primary)]/20">
                            ${finalPrice.toFixed(2)}
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

                {parsedVariants.length > 0 && isAvailable && (
                    <div className="mb-4 flex flex-col gap-4 border-t border-gray-100 pt-3 mt-2">
                        {parsedVariants.map((grupo, gIdx) => (
                            <div key={gIdx} className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <p className='text-sm text-black-500 font-bold'>{grupo.grupo}:</p>
                                    {grupo.obligatorio && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Obligatorio</span>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    {grupo.alternativas.map((alt, aIdx) => {
                                        const isSelected = selectedVariants[grupo.grupo]?.nombre === alt.nombre;
                                        const altPrice = parseFloat(alt.precio_extra) || 0;
                                        return (
                                            <label 
                                                key={aIdx} 
                                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-[var(--color-primary)] bg-orange-50 ring-1 ring-[var(--color-primary)]' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="radio" 
                                                        name={`variant-${item.id}-${gIdx}`} 
                                                        className="w-4 h-4" 
                                                        style={{accentColor: themeColor || '#f97316'}}
                                                        checked={isSelected}
                                                        onChange={() => handleVariantChange(grupo.grupo, alt)}
                                                    />
                                                    <span className="text-sm font-medium text-gray-800">{alt.nombre}</span>
                                                </div>
                                                <span className="text-sm font-bold text-gray-700">{altPrice > 0 ? `+$${altPrice.toFixed(2)}` : ''}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isAvailable && availableToppings.length > 0 && (
                    <div className="mb-4 flex flex-col gap-2 pt-2 border-t border-gray-300">
                        <p className='text-sm text-black-500 mb-1 font-bold'>Personalizar:</p>
                        <label className="flex items-center gap-3 text-base font-bold text-gray-900 cursor-pointer select-none p-2 rounded bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                            <input type="checkbox" checked={conTodo} onChange={toggleConTodo} className="w-5 h-5 rounded" style={{accentColor: themeColor || '#f97316'}} />
                            Con Todo
                        </label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            {availableToppings.map(t => ( 
                                <label key={t} className={`flex items-center gap-2 text-sm cursor-pointer select-none p-2 rounded border transition-colors ${exclusions[t] ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                    <input type="checkbox" checked={exclusions[t] || false} onChange={() => toggleExclusion(t)} className="w-4 h-4 rounded" style={{accentColor: themeColor || '#dc2626'}} />
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
                                    <span className="text-sm font-bold text-gray-700">{extPrice > 0 ? `$${extPrice.toFixed(2)}` : 'Gratis'}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <div className="p-4 pt-0 mt-auto">
                <Button 
                    onClick={handleAdd} 
                    disabled={!isAvailable || isMissingMandatoryVariant} 
                    className={`w-full text-lg py-3 ${(!isAvailable || isMissingMandatoryVariant) ? 'bg-gray-400 border-gray-400 cursor-not-allowed text-white opacity-90' : ''}`}
                    icon={Icons.Plus}
                >
                    {!isAvailable ? 'Agotado' : isMissingMandatoryVariant ? 'Selecciona las opciones' : 'Agregar al carrito'}
                </Button>
            </div>
        </div>
    );
});