import React from 'react';
import { AdminIcons } from './AdminIcons';

export const InventoryView = ({ 
    search, setSearch, activeCat, setActiveCat, categories, 
    processedInventory, setModal, deleteCategory, deleteProduct, toggleProduct, guardarPrecio,
    handleDragStart, handleDragOver, handleDrop
}) => {
    return (
        <div className="p-4 animate-card max-w-4xl mx-auto w-full">
            <div className="sticky top-[130px] z-40 bg-gray-900/95 backdrop-blur py-3 -mx-4 px-4 border-b border-gray-800 flex flex-col gap-3">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input type="text" placeholder="Buscar producto en vivo..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full bg-gray-800 p-3 pl-10 rounded-xl border border-gray-700 focus:border-orange-500 outline-none"/>
                        <div className="absolute left-3 top-3.5 text-gray-500"><AdminIcons.Search/></div>
                        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-3.5 text-gray-500 hover:text-white"><AdminIcons.X/></button>}
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
                            <button 
                                key={c.id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, c.id)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, c.id)}
                                onClick={()=>setActiveCat(c.nombre)} 
                                className={`cursor-grab active:cursor-grabbing whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${activeCat === c.nombre ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-600'}`}
                            >
                                {c.nombre}
                            </button>
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
                            <div className="flex items-center gap-3">
                                <div>
                                    <h2 className="text-orange-500 font-bold text-lg break-words">{cat.nombre}</h2>
                                    {cat.nota_preparacion && <p className="text-xs text-gray-500 break-words">{cat.nota_preparacion}</p>}
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button onClick={()=>setModal({open:true, type:'category', editItem:cat})} className="bg-blue-900/20 text-blue-500 p-2 rounded-lg hover:bg-blue-900/40"><AdminIcons.Edit/></button>
                                <button onClick={()=>deleteCategory(cat.id)} className="bg-red-900/20 text-red-500 p-2 rounded-lg hover:bg-red-900/40"><AdminIcons.Trash/></button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {cat.items.map(item => (
                                <div key={item.id} className={`relative p-3 rounded-xl border flex flex-col justify-between ${item.disponible ? 'bg-gray-800 border-gray-700' : 'bg-gray-900 border-red-900/50 opacity-60'}`}>
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <button onClick={()=>setModal({open:true, type:'product', editItem:item})} className="text-gray-500 hover:text-blue-500 p-1"><AdminIcons.Edit/></button>
                                        <button onClick={()=>deleteProduct(item)} className="text-gray-500 hover:text-red-500 p-1"><AdminIcons.Trash/></button>
                                    </div>
                                    <div className="mb-2 pr-12 min-w-0 break-words">
                                        <h3 className="font-bold leading-tight text-sm">
                                            {item.nombre}
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
                                            <p className="text-[10px] text-gray-500 mt-2 italic">Contiene {item.extras.length} extra config.</p>
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
    );
};