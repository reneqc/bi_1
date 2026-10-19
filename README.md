# BI Lab — Fundamentos de Business Intelligence

Sitio educativo de dos páginas: fundamentos de BI con un cuestionario gamificado y un dashboard interactivo de datos simulados de la Liga Pro Ecuador 2026.

## Estructura

- `index.html`: conceptos de BI, proceso ETL, casos de uso y cuestionario.
- `dashboard.html`: indicadores, gráficos y tabla de posiciones con filtro por jornada.
- `css/`: estilos globales y estilos del dashboard.
- `js/`: lógica del cuestionario, datos de la liga y lógica del dashboard.
- `img/`: reservado para imágenes y logos si se añaden posteriormente.

## Ejecutar en Codespaces

Desde la raíz del proyecto, crea las carpetas de recursos (si aún no existen):

```bash
mkdir -p css js img
```

Abre `index.html` en Visual Studio Code y selecciona **Open with Live Server**. También puedes iniciar Live Server desde la paleta de comandos de VS Code. Navega entre los fundamentos y el dashboard usando la barra superior.

El mejor puntaje del cuestionario se guarda localmente en el navegador. Los gráficos usan Chart.js 4 y los estilos de layout utilizan Bootstrap 5; ambos, junto con la tipografía Inter, se cargan por CDN y requieren conexión a Internet.
