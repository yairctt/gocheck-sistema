# Guía de Despliegue en Red Local (LAN) — GoCheck

Esta guía explica cómo configurar el sistema para que funcione con una computadora central (**Master**) y varias computadoras o tablets conectadas (**Slaves/Clientes**) a través de un router.

## 1. Arquitectura del Sistema
- **PC Master (Servidor)**: Aloja la base de datos (MySQL), el Backend (Node.js) y el Frontend (Archivos estáticos).
- **PC Slave (Terminal Checador)**: Computadora o tablet en la entrada para que los empleados chequen.
- **PC Cliente (Administrador)**: Computadora de la oficina para revisar reportes y dashboard.

---

## 2. Preparación en la PC Master (Servidor)

### A. Obtener la dirección IP Local
1. Abre una terminal (CMD o PowerShell).
2. Escribe `ipconfig`.
3. Busca "Dirección IPv4" (ejemplo: `192.168.1.50`). **Esta será la dirección que usarán todas las demás PCs.**

### B. Configurar el Backend
Asegúrate de que el backend esté escuchando en todas las interfaces de red (0.0.0.0). En tu archivo de servidor principal:
```javascript
app.listen(3000, '0.0.0.0', () => {
  console.log('Servidor corriendo en puerto 3000');
});
```

### C. Abrir el Firewall
Debes permitir el tráfico en los puertos que vas a usar (ejemplo: 3000 para backend, 8080 para frontend).
- Ve a **Firewall de Windows** > **Configuración Avanzada** > **Reglas de Entrada**.
- Crea una "Nueva Regla" para el Puerto 3000 y otra para el 8080.

---

## 3. Configuración del Frontend

En la PC Master, antes de que los demás se conecten, debes editar el archivo `assets/js/main.js` para que apunte a la IP de la Master:

```javascript
// assets/js/main.js
window.APP_CONFIG = {
  apiBase: 'http://192.168.1.50:3000/api', // <-- USA LA IP DE LA MASTER AQUÍ
  appName: 'GoCheck',
  // ...
};
```

---

## 4. Ejecución del Sistema

### En la PC Master:
1. Inicia la base de datos MySQL.
2. Inicia el backend: `npm run dev` (desde la carpeta backend).
3. Inicia el servidor del frontend: 
   ```bash
   npx http-server . -p 8080 --cors
   ```

---

## 5. Acceso desde las PCs Slaves y Clientes

Cualquier dispositivo conectado al mismo router puede acceder simplemente abriendo el navegador:

1. **Para la Terminal (PC Slave)**:
   Ingresa a: `http://192.168.1.50:8080/login.html` (y navega a `checador.html`).

2. **Para el Dashboard (PC Cliente)**:
   Ingresa a: `http://192.168.1.50:8080/login.html`.

---

## 6. Recomendación de Oro: IP Estática
Para que no tengas que cambiar la IP cada vez que se reinicie el router:
1. Ve a la configuración de red de la **PC Master**.
2. Asigna una **IP fija** (Manual) en lugar de automática (DHCP).
   - Ejemplo: IP `192.168.1.50`, Máscara `255.255.255.0`, Puerta de enlace `192.168.1.1`.
