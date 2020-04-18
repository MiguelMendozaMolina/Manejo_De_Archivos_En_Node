var express = require('express');
var router = express.Router(); /* inclusion del enrutador */

router.get('/', (req, res, next) => {
    /* Devolucion de una vista */
    res.render('ejemplo');
});

/* Creacion de una subruta
   Para poder acceder a esta subruta se debe acceder de la siguiente forma 
   http://localhost/ejemplo/interno  
*/

router.get('/interno', (req, res, next) => {
    /* Devolucion de una vista */
    res.send('documento interno');
});

module.exports = router;