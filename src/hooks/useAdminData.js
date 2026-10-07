import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export const useAdminData = (tiendaId, isAuthenticated) => {
    const [tienda, setTienda] = useState(null);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]); 
    const [historyOrders, setHistoryOrders] = useState([]); 
    const [stats, setStats] = useState({ ventas: 0, cancelados: 0, top5: [], bottom5: [] });
    
    const [loadingData, setLoadingData] = useState(true);
    const [hasNewOrder, setHasNewOrder] = useState(false);
    // Cambiamos el valor inicial para que coincida con la nueva estructura
    const [metricsDateFilter, setMetricsDateFilter] = useState('mes_actual');

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

    const loadHistory = useCallback(async () => {
        if(!tiendaId) return;
        const d60 = new Date(); d60.setDate(d60.getDate() - 60);
        
        const { data } = await supabase
            .from('pedidos')
            .select('id, cliente_nombre, estado, total_final, created_at')
            .eq('tienda_id', tiendaId)
            .gte('created_at', d60.toISOString())
            .order('created_at', { ascending: false })
            .range(0, 49); 
            
        if(data) setHistoryOrders(data);
    }, [tiendaId]);

    // LÓGICA DE FILTRADO DE FECHAS MEJORADA (Cuartos Mensuales)
    const loadStats = useCallback(async () => {
        if (!tiendaId || !products.length) return;
        try {
            const now = new Date();
            let startDate = new Date();
            let endDate = new Date();

            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();

            switch (metricsDateFilter) {
                case 'cuarto_1':
                    // Días 1 al 7 del mes actual
                    startDate = new Date(currentYear, currentMonth, 1, 0, 0, 0);
                    endDate = new Date(currentYear, currentMonth, 7, 23, 59, 59);
                    break;
                case 'cuarto_2':
                    // Días 8 al 14 del mes actual
                    startDate = new Date(currentYear, currentMonth, 8, 0, 0, 0);
                    endDate = new Date(currentYear, currentMonth, 14, 23, 59, 59);
                    break;
                case 'cuarto_3':
                    // Días 15 al 21 del mes actual
                    startDate = new Date(currentYear, currentMonth, 15, 0, 0, 0);
                    endDate = new Date(currentYear, currentMonth, 21, 23, 59, 59);
                    break;
                case 'cuarto_4':
                    // Día 22 al final del mes actual
                    startDate = new Date(currentYear, currentMonth, 22, 0, 0, 0);
                    endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
                    break;
                case 'mes_pasado':
                    // Mes completo anterior
                    startDate = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0);
                    endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
                    break;
                case 'mes_actual':
                default:
                    // Mes completo actual
                    startDate = new Date(currentYear, currentMonth, 1, 0, 0, 0);
                    endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
                    break;
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

            // Agrupamos TODOS los productos y ordenamos por ventas
            const allStats = products.map(p => ({ nombre: p.nombre, vendidos: productsCount[p.nombre] || 0 }));
            allStats.sort((a,b) => b.vendidos - a.vendidos);

            // CORRECCIÓN: Filtramos los productos que no se han vendido (> 0) antes de calcular el Bottom 5
            const productosConVentas = allStats.filter(item => item.vendidos > 0);

            setStats({ 
                ventas: totalVentas, 
                cancelados: totalCancelados, 
                top5: allStats.slice(0, 5), 
                bottom5: [...productosConVentas].reverse().slice(0, 5) 
            });
        } catch (e) { console.error("Error stats:", e); }
    }, [tiendaId, products, metricsDateFilter]);

    useEffect(() => {
        if (!isAuthenticated || !tiendaId) return;

        setLoadingData(true);
        fetchTiendaData();
        loadHistory();

        const ordersChannel = supabase.channel('admin_orders_' + tiendaId)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos', filter: `tienda_id=eq.${tiendaId}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setOrders(prev => [payload.new, ...prev]);
                    setHasNewOrder(true);
                    window.dispatchEvent(new CustomEvent('newOrderReceived', { detail: payload.new }));
                } else if (payload.eventType === 'UPDATE' && payload.new.estado !== 'pendiente') {
                    setOrders(prev => prev.filter(o => o.id !== payload.new.id));
                    loadHistory();
                }
            }).subscribe();
            
        return () => { supabase.removeChannel(ordersChannel); };
    }, [isAuthenticated, tiendaId, fetchTiendaData, loadHistory]);

    useEffect(() => {
        if (isAuthenticated && products.length > 0) loadStats();
    }, [metricsDateFilter, products, loadStats, isAuthenticated]);

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