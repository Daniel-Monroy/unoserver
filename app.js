const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const winston = require('winston');

const app = express();

// Configurar winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

// Configurar límites para JSON y urlencoded
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.post('/convert', (req, res) => {
  if (!req.body || !req.body.fileBase64) {
    logger.error('No se ha proporcionado archivo en formato base64.');
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
    logger.info(`Directorio temporal creado: ${tempDir}`);
  }

  // Escribir el buffer en un archivo
  fs.writeFileSync(inputFilePath, buffer);
  logger.info(`Archivo temporal creado: ${inputFilePath}`);

  // Ejecutar comando de conversión
  exec(`unoconvert --convert-to pdf ${inputFilePath} ${outputFilePath}`, (err, stdout, stderr) => {
    // Limpiar: eliminar el archivo de entrada independientemente del resultado
    if (fs.existsSync(inputFilePath)) {
      fs.unlinkSync(inputFilePath);
      logger.info(`Archivo temporal eliminado: ${inputFilePath}`);
    }

    if (err) {
      logger.error(`Error durante la conversión: ${err.message}`);
      return res.status(500).send(`Error durante la conversión: ${err.message}`);
    }

    logger.info(`Conversión completada: ${outputFilePath}`);
    // Enviar el archivo PDF convertido
    res.download(outputFilePath, () => {
      // Limpiar: eliminar el archivo de salida
      if (fs.existsSync(outputFilePath)) {
        fs.unlinkSync(outputFilePath);
        logger.info(`Archivo de salida eliminado: ${outputFilePath}`);
      }
    });
  });
});

app.listen(3000, () => console.log('Servidor ejecutándose en el puerto 3000'));
