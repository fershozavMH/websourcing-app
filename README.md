# WebSourcing Live - Machinery Hunters

Plataforma de Inteligencia de Adquisición y Dashboard en tiempo real para el equipo de Sourcing de Machinery Hunters. 

Este proyecto visualiza el inventario rentable de maquinaria pesada (Excavadoras, Grúas, Camiones, Bombas de Concreto) extraído automáticamente de la red y portales especializados mediante scrapers de Python.

## Arquitectura del Sistema

El ecosistema se divide en dos partes principales (Microservicios):
1. **Frontend (Este repositorio):** Aplicación React/Next.js que consume los datos en tiempo real.
2. **Backend/Scrapers (Externo):** Scripts en Python (Playwright) que extraen, validan y suben la maquinaria a Firebase.

### Stack Tecnológico
* **Framework:** [Next.js](https://nextjs.org/) (App Router / Pages)
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
* **Base de Datos & Storage:** [Firebase](https://firebase.google.com/) (Firestore)
* **Carruseles:** [Swiper React](https://swiperjs.com/)

---

## Guía de Instalación Local

### 1. Requisitos Previos
* [Node.js](https://nodejs.org/) (v18 o superior)
* npm, yarn o pnpm
* Credenciales del proyecto de Firebase (`mh-sourcing-sandbox`).

### 2. Configuración de Variables de Entorno
Por seguridad, las llaves de Firebase no están en el código fuente. Debes crear un archivo `.env.local` en la raíz del proyecto y agregar las siguientes variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="TU_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="mh-sourcing-sandbox.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="mh-sourcing-sandbox"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="mh-sourcing-sandbox.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="TU_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="TU_APP_ID"
```

### 3. Instalación y Ejecución
Instala las dependencias del proyecto:
npm install

### Inicia el servidor de desarrollo:
npm run dev
Abre http://localhost:3000 en tu navegador para ver el Dashboard.

### 4. Reglas de Seguridad (Firebase)
El frontend opera en modo de Lectura Única. Ningún usuario desde la web puede modificar o eliminar el inventario. Las escrituras (Create, Update, Delete) están restringidas exclusivamente a las llaves de administrador (Service Accounts) utilizadas por los scrapers de Python.

### 5. Despliegue (Producción)
Este proyecto está optimizado para ser desplegado en Vercel. Asegúrate de inyectar las mismas variables de entorno del archivo 
.env en el panel de configuración de Vercel antes de compilar.