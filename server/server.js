const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const app = express();
app.use(express.static(PUBLIC_DIR));

app.listen(PORT, () => {
  console.log('Simulador de planificación escuchando en http://localhost:' + PORT);
});
