# API de autenticacion

1. Copia esta carpeta a C:\xampp\htdocs\mobiles2-api.
2. Inicia Apache y MySQL desde XAMPP.
3. Importa database.sql en phpMyAdmin.
4. Si MySQL tiene una contrasena para root, actualiza $password en config.php.

La cuenta inicial es:

- Correo: admin@mobiles2.local
- Contrasena: Cambiar123!

El frontend apunta a http://localhost/mobiles2-api/login.php. Para probar desde otro dispositivo,
cambia localhost por la IP del equipo que ejecuta XAMPP en auth.service.ts y agrega ese origen
en config.php.
