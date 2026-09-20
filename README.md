el objetivo de esta app es proporcionar al usuario una coleccion de legendas urbanas dependiendo de la region que se seleccione
NOTA:
Actualmente la app movil unicamente funciona si la red a la que el dispositivo movil y la computadora es la misma, igualmente el codigo unicamente va a funcionar si el codigo es modificado en los archivos:
auth.service.ts–Linea 15
contact.service.ts–Linea 21
legend.service.ts–Linea 23
config.php–Linea 9
api/README.md–Lineas 14 y 19
Las 3 URLs de Axios y construir la app nuevamente
Esto es debido a que aun se esta investigando cuales son las mejores opciones para remplazar este aspecto en una version mas adelantada