const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ message: 'TransitOps API is running!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
