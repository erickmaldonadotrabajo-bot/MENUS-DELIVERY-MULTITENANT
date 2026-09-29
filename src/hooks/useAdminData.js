import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export const useAdminData = (tiendaId, isAuthenticated) => {
    const [tienda, setTienda] = useState(null);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]); // Pedidos pendientes
    const [historyOrders, setHistoryOrders] = useState([]); // Historial paginado
    const [stats, setStats] = useState({ ventas: 0, cancelados: 0, top5: [], bottom5: [] });
    
    const [loadingData, setLoadingData] = useState(true);
    const [hasNewOrder, setHasNewOrder] = useState(false);
    const [metricsDateFilter, setMetricsDateFilter] = useState('30_dias');

    // 1. CARGA INICIAL DE DATOS
    const fetchTiendaData = useCallback(async () => {
        if (!tiendaId) return;
        
        const [tRes, catsRes, prodsRes, ordsRes] = await Promise.all([
            supabase.from('tiendas').select('*').eq('id', tiendaId).single(),
            supabase.from('categorias').select('*').eq('tienda_id', tiendaId).order('orden'),
            supabase.from('menu_items').select('*').eq('tienda_id', tiendaId).order('orden'),
            supabase.from('pedidos').select('*').eq('tienda_id', tiendaId).eq('estado', 'pendiente').order('created_at', {ascending: false})
        ]);

        if (tRes.data) setTienda(tRes.data);
        if (catsRes.data) setCategories(catsRes.data);
        if (prodsRes.data) setProducts(prodsRes.data);
        if (ordsRes.data) setOrders(ordsRes.data);
        
        setLoadingData(false);
    }, [tiendaId]);

    // 2. CARGA DE HISTORIAL OPTIMIZADA (Límite de 50 para evitar fuga de memoria)
    const loadHistory = useCallback(async () => {
        if(!tiendaId) return;
        const d60 = new Date(); d60.setDate(d60.getDate() - 60);
        
        const { data } = await supabase
            .from('pedidos')
            .select('id, cliente_nombre, estado, total_final, created_at')
            .eq('tienda_id', tiendaId)
            .gte('created_at', d60.toISOString())
            .order('created_at', { ascending: false })
            .range(0, 49); // <-- OPTIMIZACIÓN CRÍTICA: Máximo 50 registros
            
        if(data) setHistoryOrders(data);
    }, [tiendaId]);

    // 3. CARGA DE MÉTRICAS
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
                .select('estado, total_final, detalle_json') 
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

            setStats({ 
                ventas: totalVentas, 
                cancelados: totalCancelados, 
                top5: allStats.slice(0, 5), 
                bottom5: [...allStats].filter(item => item.vendidos > 0).reverse().slice(0, 5) 
            });
        } catch (e) { console.error("Error stats:", e); }
    }, [tiendaId, products, metricsDateFilter]);

    // 4. ORQUESTADOR Y WEBSOCKET (Solo se activa si el usuario está autenticado)
    useEffect(() => {
        if (!isAuthenticated || !tiendaId) return;

        setLoadingData(true);
        fetchTiendaData();
        loadHistory();

        // Escucha en tiempo real SOLO para pedidos nuevos o actualizados de ESTA tienda
        const ordersChannel = supabase.channel('admin_orders_' + tiendaId)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos', filter: `tienda_id=eq.${tiendaId}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setOrders(prev => [payload.new, ...prev]);
                    setHasNewOrder(true);
                    // Emitimos un evento personalizado para que Admin.jsx dispare el sonido y la impresión
                    window.dispatchEvent(new CustomEvent('newOrderReceived', { detail: payload.new }));
                } else if (payload.eventType === 'UPDATE' && payload.new.estado !== 'pendiente') {
                    setOrders(prev => prev.filter(o => o.id !== payload.new.id));
                    loadHistory(); // Actualizamos historial silenciosamente
                }
            }).subscribe();
            
        return () => { supabase.removeChannel(ordersChannel); };
    }, [isAuthenticated, tiendaId, fetchTiendaData, loadHistory]);

    // Actualizar stats cuando cambie el filtro o los productos
    useEffect(() => {
        if (isAuthenticated && products.length > 0) loadStats();
    }, [metricsDateFilter, products, loadStats, isAuthenticated]);

    // Acciones de actualización directa
    const updateStoreConfig = (newData) => setTienda(prev => ({...prev, ...newData}));
    const updateLocalCategories = (cats) => setCategories(cats);
    const updateLocalProducts = (prods) => setProducts(prods);

    return {
        tienda, updateStoreConfig,
        categories, updateLocalCategories,
        products, updateLocalProducts,
        orders, setOrders,
        historyOrders,
        stats,
        loadingData,
        hasNewOrder, setHasNewOrder,
        metricsDateFilter, setMetricsDateFilter,
        fetchTiendaData, loadHistory
    };
};