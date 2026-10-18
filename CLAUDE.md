# CLAUDE.md — Reglas del proyecto

Proyecto: app de escritorio (Windows) de pendientes por áreas. Lee `README.md` para el plan completo por fases.

## Sobre el usuario
- No sabe programar; hace "vibecoding". Explica en español, con lenguaje simple, sin jerga. Si usas un término técnico, explícalo en una frase.
- Quiere ver y aprobar cada paso.

## Forma de trabajar
- **Una fase del README cada vez.** Al terminar: commit con mensaje claro en español, resumen breve de lo hecho, cómo comprobarlo, y **parar para esperar el OK**.
- No adelantes funciones de fases posteriores.
- Si una decisión no está en el README y afecta a cómo se ve o se comporta la app, pregunta antes de decidir.
- Antes de borrar o reestructurar algo grande, avisa.
- Si algo falla, explica qué pasó y propón la solución; no ocultes errores.

## Stack y convenciones
- Electron (electron-vite) + React + TypeScript + Tailwind + shadcn/ui + Zustand + @dnd-kit + date-fns (locale `es`).
- Código en TypeScript estricto. Componentes pequeños, nombres descriptivos.
- **Toda la interfaz en español.** Nombres de código en inglés.
- Fechas límite: solo fecha (`YYYY-MM-DD`), sin hora ni zona horaria.
- Los datos se guardan en un JSON local (carpeta `userData`), con escritura atómica y copia de seguridad rotativa. Nunca perder datos: si el archivo está dañado, conservarlo aparte y arrancar vacío.
- No añadir login, servidor, base de datos externa ni telemetría.
- Dependencias: solo las necesarias; justificar cualquier nueva.

## Reglas funcionales clave (resumen)
- Áreas → Tareas → Subtareas (un solo nivel). Las tres pueden tener nota.
- Cada área es un post-it. Tarea sin subtareas: se completa con su casilla. Tarea con subtareas: se completa sola cuando todas están hechas.
- Completadas pasan al Archivo (con "Deshacer"); desde ahí se restauran o se borran definitivamente.
- Orden por área: prioridad (defecto), tiempo restante, fecha de creación (antiguas primero), personalizado (arrastrando).
- Prioridad: sin prioridad, !, !!, !!!.
- Vistas: Lista, Cuadrícula (post-its cuadrados, 2/3/4 columnas), Calendario (con tareas sin fecha debajo).
- Modo claro y oscuro desde el inicio.

## Diseño
- Hasta la Fase 10: aspecto limpio y neutro, sin florituras.
- En la Fase 10: preguntar al usuario por el estilo y usar la skill `frontend-design` (en `.claude/skills/`).
- Siempre: buen contraste, navegación con teclado, estados vacíos con mensaje útil, confirmación antes de acciones destructivas.

## Antes de dar una fase por terminada
- La app arranca sin errores en consola.
- Los datos sobreviven a cerrar y abrir la app.
- Probado en modo claro y oscuro (a partir de la Fase 9).
- Commit hecho y subido a GitHub.
