import express from 'express';
import QRCode from 'qrcode';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const url = `${req.protocol}://${req.get('host')}`;
        
        // Generate QR Code (Data URI)
        const qrCodeData = await QRCode.toDataURL(url, {
            errorCorrectionLevel: 'H', // High error correction for logo overlay
            type: 'image/png',
            margin: 1, // Minimized margin
            color: {
                dark: '#38bdf8',  // Cyan Neon
                light: '#00000000' // Transparent
            }
        });

        res.render('index', {
            title: 'Lumina: Celestial Command',
            qrCodeData: qrCodeData
        });
    } catch (err) {
        console.error('QR Gen Error:', err);
        res.render('index', {
            title: 'Lumina: Celestial Command',
            qrCodeData: '' // Fallback (empty)
        });
    }
});

export default router;
