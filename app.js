const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();

app.use(bodyParser.json());
app.use(express.json({ limit: '50mb' }));

//
const upload = multer({ dest: 'uploads/' });

app.post('/convert', upload.single('file'), (req, res) => {
  if (!req.body || !req.body.fileBase64) {
    return res
      .status(400)
      .send('No se ha proporcionado archivo en formato base64.');
  }

  const fileBase64 = req.body.fileBase64;

  // Decodificar la cadena base64 a un buffer
  const buffer = Buffer.from(fileBase64, 'base64');

  // Crear un archivo temporal para la conversiÔøΩn
  const tempDir = 'uploads';
  const inputFilePath = path.join(tempDir, 'tempFile.xlsx');
  const outputFilePath = path.join(tempDir, 'outputFile.pdf');

  // Asegurarse de que el directorio 'uploads' existe
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Escribir el buffer en un archivo
  fs.writeFileSync(inputFilePath, buffer);

  // Ejecutar el comando de conversi√≥n
  exec(
    `unoconvert --convert-to pdf ${inputFilePath} ${outputFilePath}`,
    (err, stdout, stderr) => {
      if (err) {
        // Limpiar: eliminar el archivo de entrada
        // fs.unlinkSync(inputFilePath);
        return res
          .status(500)
          .send(`Error durante la conversi√≥n: ${err.message}`);
      }
      // Enviar el archivo PDF convertido
      res.download(outputFilePath, () => {
        // Limpiar: eliminar los archivos de entrada y salida
        fs.unlinkSync(inputFilePath);
        fs.unlinkSync(outputFilePath);
      });
    },
  );
});

app.listen(3000, () => console.log('Servidor ejecut√°ndose en el puerto 3000'));
