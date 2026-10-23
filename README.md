# Pronóstico del clima

Aplicación web estática en TypeScript para consultar las condiciones meteorológicas actuales de una ciudad. Usa las APIs públicas de Open-Meteo y no requiere claves de API.

## Funcionalidades

- Busca ciudades mediante la Geocoding API.
- Muestra temperatura, humedad relativa y precipitación actual con la Forecast API.
- Incluye estados de carga, validación y mensajes de error.

## Requisitos

- Node.js 20 o posterior
- npm

## Desarrollo local

Desde la carpeta del proyecto:

```sh
npm install
npm run dev
```

Vite mostrará la dirección local para abrir la aplicación en el navegador.

## Pruebas y compilación

```sh
npm test
npm run build
```

La compilación de producción se genera en `dist/`. Esa carpeta se crea al compilar y no es necesario subirla al repositorio.

## Publicar el proyecto en GitHub

1. Crea un repositorio nuevo en GitHub **sin** inicializarlo con README, `.gitignore` o licencia.
2. Desde la carpeta del proyecto, ejecuta los siguientes comandos. Reemplaza la URL con la dirección de tu repositorio:

```sh
git add .
git commit -m "Preparar proyecto inicial"
git remote add origin https://github.com/USUARIO/REPOSITORIO.git
git push -u origin main
```

Si ya existe un remoto llamado `origin`, actualízalo en lugar de agregarlo:

```sh
git remote set-url origin https://github.com/USUARIO/REPOSITORIO.git
```

El archivo `.gitignore` excluye dependencias, compilaciones y archivos locales. El `package-lock.json` sí debe mantenerse en el repositorio para instalar dependencias de forma reproducible.
