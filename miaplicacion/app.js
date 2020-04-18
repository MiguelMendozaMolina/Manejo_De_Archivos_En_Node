var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fs = require("fs"); /* Instancia de libreria filesystem*/
const {
  stat,
  createReadStream
} = require("fs"); /* Modulo necesario para el formato de stream , stat permite acceder a partes de la información*/
const {
  promisify
} = require("util"); /* Permite crear promesas dentro de elementos que no las tienen por defecto */

const fileInfo = promisify(stat) /* Convierte a stat en una promesa */

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var ejemploRouter = require('./routes/ejemplo'); /* Ejemplo de inicio de ruta */
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
/* La linea a continuacion define un archivo estatico en express */
app.use(express.static(path.join(__dirname, 'public')));

/* Creacion personalizada de ruta de archivos estaticos 
   Se debe escribir en la url el nombre del archivo al cual se quiere acceder*/

app.use(express.static("files"));

/* request de descarga de documento */

app.get("/descarga/:nombre_usuario", (req, res) => {

  /* acceso a la ruta de escritura del archivo dentro de la carpeta files */
  /* __dirname permite el acceso a la ruta raiz */

  const streamEscritura = fs.createWriteStream(`${__dirname}/files/text2.txt`);

  /* estructura para crear un documento al entrar*/

  streamEscritura.write(
    `Estimado ${req.params.nombre_usuario}:
  aqui está el documento que solicita`,
    () => {
      // res.sendFile(`${__dirname}/files/text2.txt`); /* Esto solo muestra lo que esta escrito en el archivo */
      res.download(`${__dirname}/files/text2.txt`, error => {
        if (error) {
          console.log("ERROR");
          res.status(404).render("error");
        } else {
          console.log("Descarga OK")
        }
      });
      /* Esto hace que el archivo este disponible para descargar
         se agregaron opciones en caso de error y en caso de que la descarga
         que se realice sea la correcta */
    }
  )
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/ejemplo', ejemploRouter); /* creacion de ruta personalizada */

/* Servir video estatico y stream con Express */
app.use('/video-static', (req, res, next) => {

  /* Declaración de la ruta del video */
  const fileName = __dirname + "/public/video/video.mp4"

  /* Se declara el tipo de formato del video y se envia el archivo
     que se encuentra declarado en la constante*/
  res.type("video/mp4");
  res.sendFile(fileName);

})

/* Servir contenido de video en stream , esto tiene como ventaja que en caso 
de ver algunos segundos el contenido solo se utiliza esa cantidad de datos y no el 
total del video , lo cual proporciona una mejor operacion del servidor */

app.use("/video-stream", (req, res, next) => {
  const fileName = "./public/video/video.mp4";

  /* Esta parte es diferente a la anterior , esto se debe a que es un streaming */
  res.writeHead(200, {
    "Content-Type": "video/mp4"
  });

  /* Estructura del streaming */

  createReadStream(fileName).pipe(res);

})

/* Refactorizacion del codigo para mejorar el servicio de stream */
/* Se espera el termino de el tamaño del video , es por ello que es necesario que la funcion 
cuente con async y el llamado a la funcion para conocer el tamaño del video cuente con await*/

app.use("/video-rango", async (req, res, next) => {
  const fileName = "./public/video/video.mp4";
  const {
    size
  } = await fileInfo(fileName); /*Referencia necesaria para conocer el tamaño del video */
  const range = req.headers.range; /* el rango viene desde la peticion del usuario al mover el reproductor */
  console.log(range + " rango");

  if (range) {

    /* Estructura que define el rango */
    let [start, end] = range.replace(/bytes=/, "").split("-");
    start = parseInt(start, 10); /* Rango minimo */
    end = end ? parseInt(end, 10) : size - 1; /* Rango maximo */


    /* Envio de una respuesta */

    res.writeHead(206, {
      /* Formato del video */
      "Content-Type": "video/mp4",
      /* Tamaño del video , segun el rango de selección */
      "Content-Lenght": end - start + 1,
      /* Soporte para los rangos */
      "Accept-Ranges": "bytes",
      /* Sintaxis para que el navegador comprenda el formato*/
      "Content-Range": `bytes ${start}-${end}/${size}`
    });

    /* Salida del streaming dentro del rango en el que el usuario este */
    createReadStream(fileName, {
      start,
      end
    }).pipe(res);


  } else {
    /* Estructura de streaming normal */
    res.writeHead(200, {
      "Content-Type": "video/mp4",
      "Content-Lenght": size
    });
    createReadStream(fileName).pipe(res);
  }

})


















/* Incluir problemas de redireccion permanente http:303*/
app.use((req, res, next) => {
  /* Por medio del req que esta haciendo el usuario se puede tener la url de la peticion*/
  var currentURL = req.originalUrl;

  if (currentURL === '/antiguo-documento') {

    return res.redirect(301, "https://google.com")
  }

  return next();
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;