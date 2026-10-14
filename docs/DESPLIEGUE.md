# Despliegue e instalación

La app es estática (`dist/`): no necesita servidor, solo HTTPS (el service worker y la
instalación lo exigen; `localhost` también vale).

## Opción A — GitHub Pages (workflow incluido)

1. Sube el repo a GitHub. El workflow publica desde la rama **`main`** (ahora el trabajo está en
   `master`: renómbrala con `git branch -m master main` o cambia la rama en
   `.github/workflows/deploy.yml`).
2. En el repo: **Settings → Pages → Source: GitHub Actions**.
3. Cada push a `main` pasa typecheck, lint y tests, compila con la ruta base `/<repo>/` y publica en
   `https://<usuario>.github.io/<repo>/`.

La ruta base se pasa con la variable `VITE_BASE` (por defecto `/`). Para probarlo en local:
`VITE_BASE=/gym/ npm run build && npm run preview` y abre `http://localhost:4173/gym/`.
GitHub Pages no reescribe URLs: el workflow copia `index.html` a `404.html` para que abrir
`/…/progreso` directamente siga funcionando.

## Opción B — Netlify (u otro hosting con reescrituras)

- Build command: `npm run build` · Publish directory: `dist`.
- `public/_redirects` ya incluye la reescritura a `index.html` que necesita el router.
- Sin ruta base (`VITE_BASE` sin definir).

## Instalar en el móvil

**Android (Chrome):** abre la URL → menú ⋮ → **Instalar aplicación** (o "Añadir a pantalla de
inicio"). Se abre a pantalla completa y funciona sin conexión.

**iPhone (Safari):** abre la URL → botón Compartir → **Añadir a pantalla de inicio**. Debe ser Safari.

Tras instalar: abre la app una vez con conexión para que se guarde todo y comprueba el modo avión.

## Antes del primer entreno real

- Los datos viven **solo en ese dispositivo y ese navegador** (la app instalada y la pestaña del
  navegador pueden tener datos separados en iOS). Elige uno y úsalo siempre.
- En **Ajustes** pulsa "Proteger mis datos" si aparece, y exporta una copia (JSON) de vez en cuando:
  borrar los datos del sitio o desinstalar la app borra el entrenamiento.
- Cambiar de móvil = exportar en el viejo e importar en el nuevo.
