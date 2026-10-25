# Trabajo Práctico Desarrollo de Software en sistemas distribuidos
Trabajo práctico grupal para la materia "Desarrollo de Software en Sistemas Distribuidos".

## Integrantes
* Luciano Rodriguez
* Ariel Mendoza
* Luca Lazarte
* Julián Valiño

## Instalación y Configuración FRONT

### Requisitos previos
* **Node.js** (v24.18.0)
* **npm**, **pnpm** o **yarn**

### Pasos para usar el proyecto

#### 1. **Clonar el repositorio**
```bash
git clone https://github.com/lapizgoma/tp-distrib.git
```

#### 3. **Levantar el docker-compose de la raíz del proyecto**
   a. Tener abierto Docker Desktop.\
   b. Ejecutar: 
```bash
docker compose --profile full up
```

#### 2. **Levantar el front end**

   a. Ir a la carpeta del front desde la principal
   ```bash
   cd front-react
   ```

   b. Instalar dependencias

   ```bash
   npm install
   ```

   c. Iniciar el servidor de desarrollo

   ```bash
   npm run dev
   ```

   d. **Acceder a la aplicación**
   en tu navegador en http://localhost:5173.

   