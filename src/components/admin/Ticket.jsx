import React from 'react';
import { limpiarTexto } from '../../utils/adminHelpers';

export const Ticket = ({ order, tienda }) => {
    if (!order || !tienda) return null;
    const date = new Date(order.created_at).toLocaleString('es-MX');
    const isDelivery = order.tipo_entrega === 'delivery';

    return (
        <div id="ticket-area" style={{ position: 'fixed', top: 0, left: '-9999px', width: '58mm', backgroundColor: 'white', color: 'black', zIndex: -1 }}>
            <div className="ticket-header" style={{ textAlign: 'center', marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {tienda.logo_url && <img src={tienda.logo_url} alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '5px', filter: 'grayscale(100%)', objectFit: 'cover' }} />}
                <h2 style={{fontSize: '20px', fontWeight: 'bold', margin:0}}>{tienda.nombre}</h2>
                <p style={{fontWeight:'bold', fontSize:'18px', margin:'5px 0'}}>{isDelivery ? 'DOMICILIO' : 'PICKUP'}</p>
                <p style={{fontSize:'12px', margin:0}}>{date}</p>
                <p style={{fontSize:'12px', fontWeight:'bold', margin:0}}>FOLIO: #{order.id}</p>
            </div>
            <div style={{ borderBottom: '2px dashed #000', margin: '5px 0', width: '100%' }}></div>
            <div style={{ fontSize: '16px' }}>
                <p style={{ margin:0 }}><strong>CTE:</strong> {limpiarTexto(order.cliente_nombre, 50)}</p>
                <p style={{ margin:0 }}><strong>TEL:</strong> {order.cliente_telefono}</p>
                {order.respuestas_checkout && Object.keys(order.respuestas_checkout).map(k => (
                    <p key={k} style={{marginTop:'5px', fontWeight:'bold', margin:0}}>{limpiarTexto(k).toUpperCase()}: {limpiarTexto(order.respuestas_checkout[k]).toUpperCase()}</p>
                ))}
            </div>
            <div style={{ borderBottom: '2px dashed #000', margin: '5px 0', width: '100%' }}></div>
            {order.nota_cliente && (
                <div style={{ border: '2px solid #000', padding: '5px', margin: '5px 0', fontWeight: 'bold', fontSize: '16px' }}>
                    <p style={{margin:0}}>NOTAS:</p>
                    <p style={{fontSize:'18px', margin:0}}>{limpiarTexto(order.nota_cliente, 200)}</p>
                </div>
            )}
            <div style={{width: '100%', fontSize: '18px'}}>
                {order.detalle_json && order.detalle_json.map((item, i) => (
                    <div key={i} style={{marginBottom: '5px', display: 'flex', alignItems: 'flex-start'}}>
                        <div style={{flex: '1', paddingRight: '5px'}}>
                            <span style={{fontWeight:'bold'}}>-{item.qty} {limpiarTexto(item.nombre, 80)}</span>
                            {item.isExtra && <div style={{fontSize: '16px', fontWeight: 'bold'}}>+ {limpiarTexto(item.extraAppliedName, 100)}</div>}
                            {item.details && <div style={{fontSize: '16px', fontStyle: 'italic'}}>{limpiarTexto(item.details, 100)}</div>}
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
                <p style={{margin:0}}>PAGO: {limpiarTexto(order.metodo_pago, 30)}</p>
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