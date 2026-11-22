<p align="center">
  <img src="./assets/logo.svg" alt="Token Usage Logo" width="88" height="88" />
</p>

<h1 align="center">Token Usage</h1>

<p align="center">
  <strong>Analítica en tiempo real de tokens, contexto, costos y salud de sesiones para <a href="https://antigravity.google">Antigravity</a> — 100% local, cero dependencias, privacidad primero.</strong>
</p>

<p align="center">
  <a href="./README.md">English</a> ·
  <a href="./README.zh-CN.md">简体中文</a> ·
  <a href="./README.ja.md">日本語</a> ·
  <a href="./README.ko.md">한국어</a> ·
  <strong>Español</strong>
</p>

<p align="center">
  <a href="./plugin.json"><img src="https://img.shields.io/badge/version-1.1.0-blue.svg" alt="Version" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-yellow.svg" alt="MIT License" /></a>
  <a href="./sidecars/token_panel/package.json"><img src="https://img.shields.io/badge/dependencies-zero-brightgreen.svg" alt="Zero Dependencies" /></a>
  <a href="#-privacidad-y-seguridad"><img src="https://img.shields.io/badge/privacy-100%25%20local-emerald.svg" alt="100% Local" /></a>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg" alt="Cross-Platform" />
</p>

---

## ⚡ Instalación Rápida (Recomendado: Una Sola Frase al Agente)

No necesitas abrir una terminal, clonar repositorios ni copiar archivos manualmente. **Solo pega la siguiente frase directamente en el chat de Antigravity** y deja que el Agente instale, verifique y te guíe para activarlo:

> ```text
> Instala el plugin de Antigravity desde https://github.com/RanFeng/token-usage en ~/.gemini/config/plugins/token-usage (ejecuta sync.sh si está disponible), verifica los archivos instalados y dame el enlace para habilitar y abrir el panel de Token Usage.
> ```

**Qué hará el Agente automáticamente:**
1. Clonar `https://github.com/RanFeng/token-usage` en tu equipo.
2. Sincronizar los archivos del plugin (`plugin.json`, `assets/`, `sidecars/`, `skills/`) en `~/.gemini/config/plugins/token-usage`.
3. Verificar la instalación y entregarte el enlace directo a **Customizations / Plugins** para activar **Token Usage** con un clic.

### 🔄 Actualizar en Una Sola Frase

Cuando haya una nueva versión disponible, solo dile a Antigravity:

> ```text
> Actualiza mi plugin token-usage desde https://github.com/RanFeng/token-usage a la última versión y sincronízalo en ~/.gemini/config/plugins/token-usage.
> ```

<details>
<summary><strong>🛠️ ¿Prefieres instalación manual (CLI)? Haz clic para expandir</strong></summary>

#### Requisitos previos
- **Antigravity** instalado
- **Node.js 18+** (ejecuta el panel web Sidecar sin dependencias)
- **Python 3.8+** (ejecuta el Skill de chat y el script CLI)

#### macOS / Linux (Recomendado con `sync.sh`)
```bash
git clone https://github.com/RanFeng/token-usage.git
cd token-usage
./sync.sh
```
O clona directamente en el directorio de plugins de Antigravity:
```bash
git clone https://github.com/RanFeng/token-usage.git ~/.gemini/config/plugins/token-usage
```

#### Windows (PowerShell)
```powershell
git clone https://github.com/RanFeng/token-usage.git "$env:USERPROFILE\.gemini\config\plugins\token-usage"
```

#### Activar el Plugin
1. Abre **Antigravity** → **Customizations / Plugins**.
2. Activa **Token Usage** (se aplica al instante, sin reiniciar).
3. Abre el panel lateral auxiliar (**Aux Pane**) de **Token Usage** en la barra lateral.

</details>

---

## 📖 Guía de Uso Detallada

Token Usage ofrece **tres formas de uso** para adaptarse a tu flujo de trabajo.

### 1. Panel Lateral en Vivo (Sidecar Aux Pane)

Abre **Token Usage** en la barra lateral auxiliar de Antigravity para obtener analítica visual en tiempo real.

#### 📊 Pestaña Current — Inspector de Sesión en Vivo
- **Medidor de Ventana de Contexto**: Vista en vivo de tokens usados / restantes / límite, acumulados de `input`, `cache_read` y `output`, costo equivalente de API y ahorro por caché.
- **Curva de Crecimiento de Contexto**: Muestra la expansión turno a turno y resalta automáticamente los puntos de compresión **Compact**.
- **Diagnóstico de Salud en Tiempo Real**: Alertas automáticas y descartables para:
  - Contexto cercano a Compact (`≥80%` advertencia / `≥90%` crítico)
  - Bucles consecutivos de errores
  - Picos de tokens en un solo turno
  - Baja tasa de acierto de caché
- **Detección Local Lite DLP de Credenciales**: Escanea transcripciones localmente en busca de 7 tipos de secretos (`API Keys`, `AWS Keys`, `GitHub Tokens`, `Google Keys`, `JWT`, claves privadas, `DB URIs`). Los secretos reales **nunca se almacenan ni se muestran**; solo verás fragmentos enmascarados con salto de un clic al turno exacto.
- **Desglose por Turno y Visor JSON en Árbol**:
  - Divide cada turno en **tiempo de pensamiento del modelo vs. tiempo de ejecución de herramientas**, con atribución por modelo y herramienta.
  - Búsqueda por palabras clave y filtros rápidos (`Todos` / `Alto` / `Errores` / `Multimedia`).
  - **Visor JSON en Árbol** integrado con búsqueda, plegado y copia rápida para inspeccionar argumentos y salidas de herramientas.
- **Tarjeta de Diagnóstico Anonimizada (PNG)**: Exporta o copia una instantánea 2× HiDPI (curva de contexto, tokens, tasa de caché, estadísticas) — **100% anonimizada, sin prompts, rutas, nombres de proyectos ni secretos**.

#### 📈 Pestaña Overview — Más de 12 Analíticas Globales y Tendencias
- **Panel ROI de Suscripción**: Configura tu plan (`$20 Pro` / `$100 Ultra` / `$200 Ultra` o tarifa personalizada, ciclo mensual/semanal y día de reinicio) para ver tu multiplicador ROI, proyección de fin de mes y ahorro total por caché.
- **Actividad y Perfil de Programación**: Mapa de calor de 90 días estilo GitHub, gráfico diario de 14 días, perfil horario de 24 horas y comparativa entre semana/fin de semana, Top 10 global de modelos y herramientas, puntuación de salud de contexto, logros locales y Salón de la Fama.
- **Atribución por Proyecto**: Infiere automáticamente tu Top 10 de espacios de trabajo activos a partir de las rutas de herramientas.
- **Radar Local Multi-Herramienta**: Detección ligera y de solo lectura de sesiones locales de **Claude Code**, **Codex**, **Cursor** y **Gemini CLI**.
- **Tarjeta de Reporte Retina 2× (PNG)**: Genera tarjetas compartibles en tema Oscuro o Claro con módulos configurables; copia directo al portapapeles o guarda en `~/Downloads`.

#### 🕒 Pestaña History y Barra de Herramientas
- **Pestaña History**: Explora y cambia rápidamente a cualquier conversación anterior.
- **Selector de Idioma (`EN / 中`)**: Cambia la interfaz del panel con un clic.
- **Modal de Configuración**:
  - Cambia la moneda entre `USD ($)` y `CNY (¥)` con tipo de cambio editable.
  - Personaliza tarifas por cada millón de tokens para `Pro`, `Flash`, `Claude` y `GPT/Codex`.
  - Comprueba actualizaciones en GitHub Releases.
- **Modal de Exportación**:
  - Exporta registros filtrados (`Este Mes` / `Últimos 30 Días` / `Todo el Historial`) en **CSV** (UTF-8 BOM) o **JSON**.
  - Exporta la sesión actual en Markdown o resumen anonimizado directamente a `~/Downloads`.

---

### 2. Skill en el Chat (`/token-usage` o Lenguaje Natural)

Una vez activado el plugin, Antigravity carga automáticamente el Skill `token-usage`. Escribe `/token-usage` o pregunta directamente:

- *"Resume el uso de tokens de mis últimas 10 sesiones"*
- *"Muestra el desglose de tokens por turno de la sesión actual"*
- *"Agrupa el consumo total de tokens por modelo"*
- *"¿Cuáles son las 5 sesiones que más tokens consumieron?"*

---

### 3. Script CLI Independiente (`token_stats.py`)

También puedes consultar tus transcripciones locales desde cualquier terminal (solo requiere la biblioteca estándar de Python 3):

```bash
# 1. Resumen de sesiones recientes (--sort: recent | tokens, --limit: por defecto 15)
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py summary --limit 15 --sort recent

# 2. Desglose por turno de una sesión ("latest", prefijo de 8 caracteres o UUID completo)
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py session latest

# 3. Totales globales y por modelo
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py models
```

> **Definición de tokens**: `input` = entrada sin caché, `cache_read` = lecturas desde caché de prompts, `output` = salida generada por el modelo (`total = input + output` por defecto).

---

## 🔒 Privacidad y Seguridad

- **100% Local y de Solo Lectura**: Lee directamente las transcripciones locales de Antigravity (`~/.gemini/antigravity/brain/<conversation-id>/.system_generated/logs/transcript.jsonl`). Nunca modifica binarios ni sube tus conversaciones.
- **Cero Dependencias Externas**: Construido únicamente con módulos nativos de Node.js ESM, HTML/CSS/Canvas/JS estándar y la biblioteca estándar de Python.
- **Compartición Segura**: Las imágenes PNG de diagnóstico eliminan por completo prompts, rutas de archivos, nombres de proyectos y credenciales detectadas.
- **Transparencia de Red**: Cero telemetría. La comprobación opcional de actualizaciones solo consulta la API pública de GitHub Releases (en caché local durante 7 días).

---

## ❓ Preguntas Frecuentes (FAQ)

<details>
<summary><strong>El panel lateral de Token Usage no aparece tras instalar</strong></summary>

1. Verifica que exista el archivo `~/.gemini/config/plugins/token-usage/plugin.json`.
2. Abre Antigravity → **Customizations / Plugins** y confirma que **Token Usage** esté activado.
3. Asegúrate de tener `node` (Node.js 18+) disponible en tu `PATH` para que el servidor Sidecar pueda iniciar.
</details>

<details>
<summary><strong>¿Por qué los costos estimados difieren de mi suscripción o factura de API?</strong></summary>

Los costos mostrados son estimaciones equivalentes de API según tarifas predeterminadas por millón de tokens (`Pro`, `Flash`, `Claude`, `GPT/Codex`). Puedes ajustar cada tarifa, la moneda (`USD`/`CNY`) y los datos de tu suscripción en el modal de **Configuración**.
</details>

<details>
<summary><strong>¿Cómo desinstalo Token Usage?</strong></summary>

Puedes pedirle a Antigravity en una frase (*"Desinstala el plugin token-usage"*), desactivarlo/desinstalarlo en **Customizations / Plugins**, o eliminar manualmente `~/.gemini/config/plugins/token-usage`.
</details>

---

## 📚 Arquitectura y Enlaces

- [Mapa de Arquitectura del Proyecto (`.ai_map.md`)](./.ai_map.md)
- [Repositorio en GitHub](https://github.com/RanFeng/token-usage)
- [Discusiones y Hoja de Ruta](https://github.com/RanFeng/token-usage/discussions)
