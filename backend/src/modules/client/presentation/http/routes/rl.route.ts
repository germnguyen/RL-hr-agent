import express from 'express';
import {
  getDatasetsHandler,
  trainDqnHandler,
  simulateScreeningHandler,
  feedbackHandler,
} from '../../../infrastructure/rl/controllers/rl.controller';

const router = express.Router();

router.get('/datasets', getDatasetsHandler);
router.post('/train', trainDqnHandler);
router.post('/simulate', simulateScreeningHandler);
router.post('/feedback', feedbackHandler);

export const rlRoute: express.Router = router;
