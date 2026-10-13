MANUAL DE ARQUITECTURA Y MANTENIMIENTO: SaaS Menús Digitales
1. Visión General del Sistema
Aplicación web progresiva orientada a restaurantes (Multi-Tenant). Permite la visualización de menús digitales dinámicos, gestión de carritos en memoria local, validación de zonas de entrega por geolocalización y procesamiento de pedidos mediante dos vías simultáneas: guardado transaccional en base de datos e inyección de datos a WhatsApp (Fallback de comunicación).

2. Stack Tecnológico y Estándares (2026)
Frontend: React (Hooks funcionales), Vite (Build tool / esbuild para minificación extrema).

Estilos: Tailwind CSS (Arquitectura basada en utilidades). Las variables de color dinámicas (pickupColor, deliveryColor) se inyectan en línea solo cuando dependen de la configuración del Tenant.

Backend as a Service (BaaS): Supabase (PostgreSQL).

Arquitectura de Estado: Hooks personalizados para separación de responsabilidades (SRP - Single Responsibility Principle).

Persistencia: Caché selectiva en localStorage (exclusiva para datos de identidad del usuario).

3. Patrón Multi-Tenant (Inquilinos)
La aplicación no tiene un backend aislado por restaurante. Utiliza un modelo de base de datos compartida con discriminación por parámetro URL (?tienda=slug).

Punto de entrada: Menu.jsx intercepta el parámetro tienda y lo pasa a useStoreData.

Seguridad Estricta: Las consultas a Supabase deben estar siempre filtradas por tienda_id. El frontend nunca asume que los datos están protegidos; la protección real recae en las políticas RLS (Row Level Security) configuradas en PostgreSQL.

4. Estructura de Módulos Core (Single Source of Truth)
4.1. Capa de Datos (/hooks)
Ningún componente de UI debe hacer llamadas directas a Supabase. Todo pasa por la capa de abstracción de Hooks:

useStoreData.js: Responsable del Fetching inicial. Descarga la configuración del tenant, procesa las categorías y activa los loaders.

useCart.js: Motor de estado de compras. Calcula subtotales estáticos y maneja la adición/eliminación de productos.

useDeliveryZone.js: Motor geoespacial. Extrae coordenadas del cliente, las compara contra storeConfig.latitud/longitud usando la fórmula de Haversine y bloquea/permite el pedido según la distancia.

useCheckout.js: Controlador transaccional final. Valida rangos, mínimos de compra, ensambla el Payload seguro (evitando inyecciones en el objeto JSON de detalles) y ejecuta supabase.insert.

4.2. Capa de Presentación (/components)
La UI está estrictamente separada de la lógica de negocio.

Menu.jsx: Orquestador principal. Renderiza el catálogo. Controla la visibilidad de los modales mediante montajes persistentes (CSS opacidad/pointer-events) para evitar la destrucción del estado local.

CartCheckout.jsx: Aislado en capa z-[150] (Modal/Drawer). Renderiza condicionalmente campos de transferencias o efectivos basándose en variables de estado derivadas. Aquí vive la inicialización perezosa de la caché de identidad (localStorage.getItem('menu_cliente_identidad')).

OrderCard.jsx (Módulo Admin): Estructurado bajo Programación Defensiva. Todo dato inyectado asume que puede ser null, undefined o NaN. Utiliza try/catch para fechas y validaciones estrictas antes de parsear operaciones matemáticas.

5. Reglas Inquebrantables de Desarrollo (No Romper)
Cero Inyección de Supabase en UI: Prohibido importar supabase directamente dentro de un archivo .jsx para hacer operaciones de lectura/escritura (salvo el hook de useCheckout o endpoints centralizados).

Manejo de Modales (Z-Index): Todo modal crítico (como el checkout) se renderiza con fixed inset-0 para aislarlo del flujo de renderizado del navegador (DOM normal) y evitar "saltos" en la pantalla.

Código Muerto (Tree Shaking manual): No se permiten variables sin uso ni funciones comentadas que no aporten al flujo. (Ej. Lógicas fallidas de Upsell fueron purgadas permanentemente).

Seguridad de Formularios (Fail-Safes): Todo input, especialmente los numéricos (como customer.paymentAmount), debe ser sanitizado con parseFloat y validado contra NaN antes de enviarse a la base de datos o generar el mensaje de WhatsApp.

Regla de Persistencia: NO GUARDAR métodos de pago, totales, tarjetas o propinas en localStorage. La caché se limita estrictamente a la fricción de entrada: name y phone.