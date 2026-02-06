import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import QRCode from 'qrcode'; // Keep for API usage if needed, though mostly client-side now or specific API route

const router = express.Router();

// SPA Main Entry Point (Catch-all for SPA routes)
router.get(['/', '/auth', '/setup', '/mission'], async (req, res) => {
    // Generate QR for Desktop Overlay (Server-side generated)
    let qrCodeData = '';
    try {
        const url = `${req.protocol}://${req.get('host')}/`;
        qrCodeData = await QRCode.toDataURL(url, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            margin: 2,
            scale: 10,
            color: {
                dark: '#00f3ff', // Neon Cyan
                light: '#00000000' // Transparent
            }
        });
    } catch (err) {
        console.error('QR Gen Error:', err);
    }

    res.render('index', { 
        title: 'Lumina: Celestial Command',
        qrCodeData: qrCodeData
    });
});

// JSON API for QR (Optional, used by overlay if needed dynamically)
router.get('/api/qr', async (req, res) => {
    try {
        const url = `${req.protocol}://${req.get('host')}/`;
        const qrCodeData = await QRCode.toDataURL(url);
        res.setHeader('Content-Type', 'image/png');
        const buffer = Buffer.from(qrCodeData.split(',')[1], 'base64');
        res.send(buffer);
    } catch (e) {
        res.status(500).send('Error generating QR');
    }
});

export default router;
