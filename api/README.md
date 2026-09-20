# API de autenticacion

1. Copia esta carpeta a C:\xampp\htdocs\mobiles2-api.
2. Inicia Apache y MySQL desde XAMPP.
3. Importa database.sql en phpMyAdmin.
4. Si MySQL tiene una contrasena para root, actualiza $password en config.php.
   En esta instalacion de XAMPP MySQL usa el puerto 8000.

La cuenta inicial es:

- Correo: admin@mobiles2.local
- Contrasena: Cambiar123!

El frontend apunta a http://192.168.1.100:9000/mobiles2-api/login.php. Para probar desde otro dispositivo,
la computadora y el telefono deben estar en la misma red y el origen debe estar permitido en config.php.

El endpoint de leyendas es:

- GET http://192.168.1.100:9000/mobiles2-api/urban_legends.php?region=norteamerica
