const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const driverRoutes = require('./routes/driver.routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ message: 'TransitOps API is running!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
