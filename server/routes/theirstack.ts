import express from 'express';
import { fetchTheirStackData, postToTheirStack } from '../services/theirstack';

const router = express.Router();

// Example route to fetch data from TheirStack
router.get('/data', async (req, res) => {
  try {
    // Replace 'example-endpoint' with an actual TheirStack API endpoint
    const data = await fetchTheirStackData('example-endpoint', req.query);
    res.json(data);
  } catch (error) {
    console.error('Error in TheirStack data route:', error);
    res.status(500).json({ 
      message: 'Failed to fetch data from TheirStack',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Example route to post data to TheirStack
router.post('/data', async (req, res) => {
  try {
    // Replace 'example-endpoint' with an actual TheirStack API endpoint
    const result = await postToTheirStack('example-endpoint', req.body);
    res.json(result);
  } catch (error) {
    console.error('Error in TheirStack post route:', error);
    res.status(500).json({ 
      message: 'Failed to post data to TheirStack',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router; 