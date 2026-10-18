# Gestor de pendientes (app de escritorio para Windows)

App personal para organizar pendientes por **áreas** (cada área es un post-it), con tareas y subtareas. Solo para un usuario, sin login, sin servidor: los datos viven en un archivo en el PC.

> **Instrucciones para Claude Code:** lee este README y el archivo `CLAUDE.md` completos antes de empezar. Trabaja **una fase cada vez**. Al terminar cada fase: haz commit, explica en lenguaje simple (el usuario no sabe programar) qué has hecho y cómo comprobarlo, y **detente a esperar el OK** antes de pasar a la siguiente. No avances por tu cuenta.

---

## 1. Qué es la app

- App de escritorio (Windows) con instalador.
- Todo en español.
- Modo claro y oscuro.
- Sin cuentas, sin internet, sin base de datos externa.
- El diseño visual se define **después** de que la estructura funcione (fase 10). Hasta entonces, un aspecto limpio y neutro.

## 2. Stack

| Pieza | Elección | Motivo |
|---|---|---|
| App de escritorio | Electron (con electron-vite) | Solo requiere Node.js |
| Interfaz | React + TypeScript | Estándar, bien soportado |
| Estilos | Tailwind CSS + shadcn/ui | Componentes listos |
| Estado | Zustand | Simple |
| Arrastrar y soltar | @dnd-kit | Reordenar tareas y post-its |
| Fechas | date-fns (locale `es`) | Calendario y tiempo restante |
| Instalador | electron-builder (NSIS, Windows) | Genera el `.exe` |
| Datos | Archivo JSON local | Sin base de datos |

## 3. Modelo de datos

```
Área
  id, nombre, nota (opcional), orden (posición del post-it),
  criterioOrden: "prioridad" | "tiempoRestante" | "fechaCreacion" | "personalizado"  (por defecto "prioridad")

Tarea (pertenece a un área)
  id, areaId, título, nota (opcional),
  prioridad: 0 (sin prioridad) | 1 (!) | 2 (!!) | 3 (!!!),
  fechaLimite (solo fecha, sin hora; opcional),
  fechaCreacion, completada, fechaCompletada,
  ordenPersonal (posición dentro del área para el orden personalizado),
  subtareas[]

Subtarea (pertenece a una tarea; un solo nivel, nada por debajo)
  id, título, nota (opcional), completada
```

Las tres entidades (área, tarea, subtarea) pueden tener nota.

## 4. Reglas de comportamiento

**Completar tareas**
- Tarea **sin** subtareas: se completa con su casilla, directamente desde el post-it.
- Tarea **con** subtareas: se completa sola cuando todas las subtareas están completadas. Si se desmarca una subtarea, la tarea vuelve a estar pendiente.
- Al completarse, la tarea pasa al **Archivo** (con aviso "Deshacer" unos segundos).

**Orden de tareas dentro de cada área** (cada área recuerda su criterio)
1. **Prioridad** (por defecto): !!! primero, luego !!, !, sin prioridad. Empates: fecha límite más cercana, luego más antigua.
2. **Tiempo restante**: fecha límite más cercana primero; las vencidas arriba; las que no tienen fecha, al final.
3. **Fecha de creación**: las más antiguas primero.
4. **Personalizado**: el usuario arrastra cada tarea para formar su propio orden. Al arrastrar manualmente, el área pasa a este criterio.

**Áreas**: crear, renombrar, borrar (con confirmación; avisa de cuántas tareas se borran) y reordenar arrastrando los post-its.

**Archivo**: sección donde ver las tareas completadas, restaurarlas o borrarlas definitivamente.

## 5. Vistas

1. **Lista** (principal): post-its uno al lado del otro. Cada post-it muestra el nombre del área en grande, su nota y el listado de tareas con sus subtareas.
2. **Cuadrícula**: post-its **cuadrados y comprimidos** en 2, 3 o 4 columnas según el número de áreas (propuesta: hasta 4 áreas → 2 columnas; de 5 a 9 → 3; 10 o más → 4; con opción manual para cambiarlo). Cada post-it cuadrado muestra el título y la nota del área y, debajo, **las tareas que quepan** en el cuadrado (si no caben todas, se indica "+N más"). Clic en el post-it para abrirlo completo.
3. **Calendario**: vista mensual; las tareas con fecha límite aparecen en su día (solo fecha, sin hora; no se muestran las completadas). Las tareas **sin fecha límite** aparecen en una zona debajo del calendario.

---

## 6. Fases (con punto de aprobación al final de cada una)

### Fase 0 — Preparación (la hace el usuario con ayuda de Claude Code)
- Instalar **Node.js LTS** y **Git** en Windows (si no están).
- Crear un repositorio vacío en GitHub (privado) y clonarlo; colocar en la carpeta raíz este `README.md` y `CLAUDE.md`.
- Claude Code: comprobar que Node y Git funcionan y explicar cualquier problema en lenguaje simple.
- Crear `.claude/skills/` e incorporar la skill **frontend-design** del repositorio oficial de skills de Anthropic (`github.com/anthropics/skills`). Si no la encuentra, decirlo y continuar sin ella.
- **✅ Punto de aprobación:** el usuario confirma que todo está instalado.

### Fase 1 — Esqueleto de la app
- Crear el proyecto con electron-vite (React + TypeScript), añadir Tailwind y shadcn/ui.
- Que al ejecutar `npm run dev` se abra una ventana con el título "Pendientes".
- Primer commit y subida a GitHub. Crear `.gitignore` adecuado.
- **✅ Comprobación del usuario:** se abre la ventana.

### Fase 2 — Datos y guardado
- Definir los tipos del modelo de datos (sección 3).
- Guardado automático en un archivo JSON en la carpeta de datos de la app de Windows (`userData`), con escritura segura (escribir a un archivo temporal y renombrar) y una copia de seguridad rotativa automática.
- Si el archivo no existe o está dañado, arrancar vacío sin romper la app (y conservar el archivo dañado aparte).
- Estado global con Zustand conectado al guardado.
- **✅ Comprobación:** crear algo de prueba, cerrar la app, abrirla y que siga ahí.

### Fase 3 — Áreas como post-its (Vista Lista)
- Barra superior con selector de vista (de momento solo Lista) y botón "Nueva área".
- Crear, renombrar, editar la nota y borrar áreas (con confirmación).
- Post-its uno al lado del otro; nombre del área en grande y su nota.
- **✅ Comprobación:** crear varias áreas, editarlas y borrarlas.

### Fase 4 — Tareas y subtareas
- Añadir tareas dentro de cada post-it (título rápido con Enter; detalle con nota, prioridad y fecha límite).
- Subtareas (un solo nivel) con título, nota y casilla.
- Reglas de completado (sección 4). Editar y borrar tareas y subtareas.
- Mostrar prioridad (!, !!, !!!), fecha límite y aviso visual de vencida.
- **✅ Comprobación:** crear tareas con y sin subtareas, completarlas y ver que las reglas se cumplen.

### Fase 5 — Orden
- Selector de criterio de orden por área (prioridad, tiempo restante, fecha de creación, personalizado).
- Orden personalizado arrastrando tareas con @dnd-kit.
- Reordenar los post-its arrastrándolos.
- **✅ Comprobación:** cada criterio ordena como se describe; el orden personalizado se conserva al cerrar la app.

### Fase 6 — Archivo
- Las tareas completadas pasan al Archivo (con "Deshacer").
- Sección Archivo: ver completadas, restaurar y borrar definitivamente (con confirmación).
- **✅ Comprobación:** completar, ver en Archivo, restaurar y borrar.

### Fase 7 — Vista Cuadrícula
- Post-its cuadrados y comprimidos con 2/3/4 columnas (sección 5).
- Título y nota del área + tareas que quepan + "+N más".
- Clic para abrir el post-it completo.
- **✅ Comprobación:** con pocas y con muchas áreas, la cuadrícula se adapta bien.

### Fase 8 — Vista Calendario
- Calendario mensual en español con navegación entre meses y botón "Hoy".
- Tareas con fecha límite en su día (no completadas); tareas sin fecha debajo.
- Abrir/editar una tarea desde el calendario.
- **✅ Comprobación:** las fechas coinciden y las tareas sin fecha aparecen abajo.

### Fase 9 — Tema claro/oscuro y copias de seguridad
- Interruptor de modo claro/oscuro (por defecto, el del sistema) que se recuerda.
- Botones **Exportar copia de seguridad** (guarda un archivo) e **Importar copia** (con confirmación, porque sustituye los datos actuales).
- **✅ Comprobación:** cambiar de tema, exportar, borrar algo, importar y recuperarlo.

### Fase 10 — Diseño visual
- **Antes de empezar, Claude Code debe preguntar al usuario** qué estilo quiere (referencias, colores, tipografía, estética de post-it). Usar la skill frontend-design.
- Aplicar el diseño a las tres vistas, ambos temas y estados vacíos.
- Revisión de accesibilidad básica (contraste, foco con teclado, tamaños).
- **✅ Comprobación:** el usuario valida el aspecto.

### Fase 11 — Instalador para Windows
- Configurar electron-builder para generar el instalador `.exe`.
- Icono de la app y nombre.
- Comprobar que los datos se conservan al actualizar/reinstalar.
- Explicar al usuario cómo instalarla y dónde se guardan sus datos.
- **✅ Comprobación:** instalar en el PC y usarla sin la terminal.

### Más adelante (fuera de esta entrega)
- Recordatorios y notificaciones.
- Versión móvil (iPhone): requeriría sincronización entre dispositivos; la estructura de datos actual permite añadirla sin rehacer la app.
- Búsqueda y atajos de teclado.

---

## 7. Cómo trabajar (para el usuario)

1. Abre Claude Code en la carpeta del proyecto.
2. Escribe: *"Lee README.md y CLAUDE.md y empieza por la Fase 0."*
3. Al final de cada fase, prueba lo que se indica en "Comprobación". Si está bien, responde *"OK, siguiente fase"*. Si algo falla o no te gusta, dilo con tus palabras y se corrige antes de avanzar.
4. Si algo se rompe, Claude Code puede volver al último commit.
