const express = require('express');
const cors = require('cors');
const { fetchAvailableCourts } = require('./fetchAvailableCourts');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

app.use(express.json());

app.post('/courts', async (req, res) => {
  try {
    console.log('Received request with body:', req.body);
    const { startDate, selectedRecintos, daysToIterate, selectedCanchas } = req.body;
    console.log('Fetching courts with params:', { startDate, selectedRecintos, daysToIterate, selectedCanchas });
    const courts = await fetchAvailableCourts(startDate, selectedRecintos, daysToIterate, selectedCanchas);
    console.log('Fetched courts:', courts);
    res.json(courts);
  } catch (error) {
    console.error('Error in /courts:', error);
    res.status(500).json({ error: 'Error fetching courts', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});