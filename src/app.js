const express = require('express');
const path = require('path');
const app = express();

// Configuration
const PORT = process.env.PORT || 3000;

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Files
// Serve contents of 'public' directory at the root path '/'
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'Lumina: Orbital Command',
        // Pass any dynamic data here if needed in future
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 Lumina Server Online!`);
    console.log(`📡 Satellite Uplink Established: http://localhost:${PORT}`);
});
