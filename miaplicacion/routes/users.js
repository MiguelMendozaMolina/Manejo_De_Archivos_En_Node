var express = require('express');
var router = express.Router();

/* Funcion que realiza la suma */

function sumar() {
  return 1 + 1;
}


/* GET users listing. */
/* Dentro del enrutador se verifica que exista el resultado de la suma */
router.get('/', (req, res, next) => {
  if (sumar() === 3) {
    res.send('respond with a resource')
  } else {
    res.status(500);
    res.render("error");
  }
});

module.exports = router;