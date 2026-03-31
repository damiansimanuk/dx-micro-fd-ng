const ws = new WebSocket('ws://localhost:8181');

// Mantiene el proceso vivo hasta que ocurra un evento
ws.onopen = () => {
    console.log('✅ Conectado');
    ws.send('Hola servidor');
};

ws.onmessage = (event) => {
    console.log('📩 Respuesta:', event.data);
};

ws.onerror = (err) => {
    console.error('❌ Error de conexión:', err.message);
};

ws.onclose = () => {
    console.log('🔌 Conexión cerrada');
};

// Evita que el script se cierre por 10 segundos para dar tiempo a conectar
setTimeout(() => {}, 10000);

