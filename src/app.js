import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mainRouter from './routes/index.js';
import expressLayouts from 'express-ejs-layouts';

// ESM Boilerplate for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout'); // Default layout: views/layout.ejs

// Static Files Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/', mainRouter);

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 Lumina Server Online!`);
    console.log(`📡 Satellite Uplink Established: http://localhost:${PORT}`);
});