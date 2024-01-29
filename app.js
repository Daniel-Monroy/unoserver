const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();

// Configurar límites para JSON y urlencoded
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.post('/convert', (req, res) => {
  if (!req.body || !req.body.fileBase64) {
    return res.status(400).send('No se ha proporcionado archivo en formato base64.');
  }

  const fileBase64 = req.body.fileBase64;
  const buffer = Buffer.from(fileBase64, 'base64');

  // Directorio para archivos temporales
  const tempDir = 'uploads';
  const inputFilePath = path.join(tempDir, 'tempFile.xlsx');
  const outputFilePath = path.join(tempDir, 'outputFile.pdf');

  // Crear directorio si no existe
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Escribir el buffer en un archivo
  fs.writeFileSync(inputFilePath, buffer);

  // Ejecutar comando de conversión
  exec(`unoconvert --convert-to pdf ${inputFilePath} ${outputFilePath}`, (err, stdout, stderr) => {
    // Limpiar: eliminar el archivo de entrada independientemente del resultado
    if (fs.existsSync(inputFilePath)) {
      fs.unlinkSync(inputFilePath);
    }

    if (err) {
      // Enviar respuesta de error
      return res.status(500).send(`Error durante la conversión: ${err.message}`);
    }

    // Enviar el archivo PDF convertido
    res.download(outputFilePath, () => {
      // Limpiar: eliminar el archivo de salida
      if (fs.existsSync(outputFilePath)) {
        fs.unlinkSync(outputFilePath);
      }
    });
  });
});

app.listen(3000, () => console.log('Servidor ejecutándose en el puerto 3000'));
