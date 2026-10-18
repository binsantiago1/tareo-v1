# Cómo instalar Pendientes en Windows

## Generar el instalador (solo hace falta cuando cambie la app)
```
npm run build:win
```
Se crea el archivo `dist\Pendientes-Instalador-1.0.0.exe`.

## Instalar
1. Haz doble clic en `Pendientes-Instalador-1.0.0.exe`.
2. Windows puede mostrar «Windows protegió su PC» porque la app no tiene firma digital de pago. Pulsa **Más información → Ejecutar de todas formas**.
3. Elige la carpeta (o deja la que viene) y pulsa **Instalar**.
4. Se crea un acceso directo en el Escritorio y en el menú Inicio.

## Dónde se guardan tus datos
`C:\Users\<tu usuario>\AppData\Roaming\Pendientes\datos.json`

Junto a ese archivo hay 5 copias de seguridad automáticas (`datos.copia1.json` … `datos.copia5.json`).
Los datos **no se borran** al desinstalar ni al reinstalar o actualizar la app.
Para llevarte tus datos a otro PC usa el botón **Copias → Exportar copia de seguridad**.

## Post-its en el escritorio
En un post-it, pasa el cursor por el título → icono de tres puntos → **Poner en el escritorio**.
- Aparece una ventana flotante con ese post-it (completo y editable). Arrastra el título para moverla.
- La **X** de la esquina superior derecha (aparece al pasar el cursor) la quita del escritorio; el área no se borra.
- Se recuerdan al reiniciar Windows: la app arranca en segundo plano (icono junto al reloj) y solo muestran los post-its. Clic en ese icono para abrir la ventana principal; clic derecho → **Salir** para cerrar todo.
- Solo funciona así en la app **instalada** (el arranque con Windows no se configura al ejecutar `npm run dev`).
