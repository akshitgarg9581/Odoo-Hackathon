const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ message: 'TransitOps API is running!' });
});

// GET all Vehicles
app.get('/api/vehicles', async (req, res) => {
    try {
        const vehicles = await prisma.vehicle.findMany();
        res.json(vehicles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
