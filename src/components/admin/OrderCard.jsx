import React from 'react';
import { AdminIcons } from './AdminIcons';
import { limpiarTexto } from '../../utils/adminHelpers';

export const OrderCard = ({ order, tienda, onComplete, onPrint, onCancel }) => {
    const date = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const handleComplete = () => { if(confirm("¿PEDIDO DESPACHADO?")) onComplete(order.id); };
    const handleCancelClick = () => { if(confirm("¿Seguro que quieres CANCELAR este pedido?")) onCancel(order.id); };

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
                    <h3 className="text-xl font-bold text-white leading-none break-words">{limpiarTexto(order.cliente_nombre, 50)}</h3>
                    <a href={`tel:${order.cliente_telefono}`} className="text-orange-400 text-sm hover:underline flex items-center gap-1 mt-1 break-words">TEL: {order.cliente_telefono}</a>
                    {order.respuestas_checkout && Object.keys(order.respuestas_checkout).map(k => (
                        <div key={k} className="mt-2 mr-2 inline-block bg-blue-900/50 border border-blue-700 text-blue-200 text-xs font-black px-2 py-1 rounded-lg uppercase tracking-wide break-words max-w-full">{limpiarTexto(k)}: {limpiarTexto(order.respuestas_checkout[k])}</div>
                    ))}
                </div>
                
                <div className="bg-gray-900/50 rounded-lg p-3 mb-4 space-y-2 border border-gray-700/50 w-full overflow-hidden">
                    {order.detalle_json && order.detalle_json.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-sm border-b border-gray-700/50 pb-2 last:border-0 last:pb-0">
                            <div className="text-gray-200 break-words pr-2"><span className="font-bold text-orange-500 mr-1">{item.qty}x</span> {limpiarTexto(item.nombre, 80)}{item.isExtra && <span className="text-yellow-500 text-xs ml-1 font-bold break-words">+{limpiarTexto(item.extraAppliedName, 100)}</span>}{item.details && <p className="text-gray-500 text-xs pl-6 italic break-words">{limpiarTexto(item.details, 150)}</p>}</div>
                            <span className="font-mono text-gray-400 whitespace-nowrap pl-2">${(item.price * item.qty).toFixed(2)}</span>
                        </div>
                    ))}
                    {order.nota_cliente && <div className="mt-2 bg-yellow-900/20 text-yellow-200 text-xs p-2 rounded border border-yellow-900/30 break-words">NOTA: <strong>{limpiarTexto(order.nota_cliente, 200)}</strong></div>}
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 border-t border-gray-700 pt-3 gap-2">
                    <div className="text-sm">
                        <p className="text-gray-400 uppercase font-bold text-xs">Pago</p>
                        <p className="text-white font-medium flex items-center gap-1"><AdminIcons.Check /> {limpiarTexto(order.metodo_pago, 30).toUpperCase()}</p>
                        {String(order.metodo_pago).toLowerCase().includes('efectivo') && order.pago_con && <p className="text-green-400 text-xs font-bold mt-1">Cambio: <span className="text-white">${(order.pago_con - order.total_final).toFixed(2)}</span></p>}
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                        <p className="text-3xl font-black text-white tracking-tighter">${parseFloat(order.total_final).toFixed(2)}</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    <button onClick={handleCancelClick} className="col-span-1 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/50 rounded-xl flex flex-col items-center justify-center p-2 transition-all w-full">
                        <AdminIcons.Cancel />
                        <span className="text-[10px] font-bold mt-1">CANCELAR</span>
                    </button>
                    
                    {mapLink ? (
                        <a href={mapLink} target="_blank" rel="noreferrer" className="col-span-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-600/50 rounded-xl flex flex-col items-center justify-center p-2 transition-all w-full">
                            <AdminIcons.MapPin />
                            <span className="text-[10px] font-bold mt-1">MAPA</span>
                        </a>
                    ) : (
                        <div className="col-span-1 bg-gray-700/50 text-gray-500 rounded-xl flex flex-col items-center justify-center p-2 opacity-50 cursor-not-allowed w-full">
                            <AdminIcons.MapPin />
                            <span className="text-[10px] font-bold mt-1">SIN GPS</span>
                        </div>
                    )}

                    <button onClick={() => onPrint(order)} className="col-span-1 bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 rounded-xl flex flex-col items-center justify-center p-2 transition-all w-full">
                        <AdminIcons.Printer />
                        <span className="text-[10px] font-bold mt-1">IMPRIMIR</span>
                    </button>

                    <button onClick={handleComplete} className="col-span-1 bg-orange-600/20 hover:bg-orange-600 text-orange-500 hover:text-white border border-orange-600/50 rounded-xl flex flex-col items-center justify-center p-2 transition-all w-full">
                        <AdminIcons.Check />
                        <span className="text-[10px] font-bold mt-1">LISTO</span>
                    </button>
                </div>
            </div>
        </div>
    );
};