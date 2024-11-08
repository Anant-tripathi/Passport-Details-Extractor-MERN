
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 5000;
const API_KEY = process.env.API_KEY;
const OCR_API_URL = process.env.OCR_API_URL;
const CORS_ORIGIN = process.env.CORS_ORIGIN;

app.use(cors({
    origin: CORS_ORIGIN,
}));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'passport.png');
    }
});

const upload = multer({ storage: storage });

async function sendFileToOCR(filePath) {
    const form = new FormData();
    form.append('apikey', API_KEY);
    form.append('file', fs.createReadStream(filePath));

    try {
        const response = await axios.post(OCR_API_URL, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        // console.log('OCR Response:', response.data);

        const ocrResult = response.data;
        
        if (!ocrResult.ParsedResults || ocrResult.ParsedResults.length === 0) {
            throw new Error('No text detected in the document');
        }

        const data = ocrResult.ParsedResults[0].ParsedText;

        const nameRegex = /(?:Given Nam«s\))\r\n([A-Z\s]+)/;
        const documentNumberRegex = /Passport No\.\r\n([A-Z0-9\s]+)/;
        const dateRegex = /\b\d{2}\/\d{2}\/\d{4}\b/g;

        const nameMatch = data.match(nameRegex);
        const name = nameMatch ? nameMatch[1].trim() : null;

        const documentNumberMatch = data.match(documentNumberRegex);
        const documentNumber = documentNumberMatch ? documentNumberMatch[1].trim() : null;

        const dateMatches = data.match(dateRegex);
        const expiryDate = dateMatches ? dateMatches[dateMatches.length - 1] : null;

        return { name, documentNumber, expiryDate };
    } catch (error) {
        console.error('Error uploading file to OCR API:', error.message);
        throw new Error('OCR processing failed');
    }
}

app.post('/api/process-document', upload.single('document'), async (req, res) => {
    try {
        const { file } = req;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const result = await sendFileToOCR(file.path);

        fs.unlinkSync(file.path);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error processing document:', error.message);
        res.status(500).json({ error: 'Error processing document. Please try again.' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
