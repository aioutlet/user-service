import express from 'express';
import { health, readiness, liveness, metrics } from '../controllers/operational.controller.js';

const router = express.Router();

// Health check endpoints
router.get('/health', health);
router.get('/readiness', readiness);
router.get('/liveness', liveness);
router.get('/metrics', metrics);

export default router;
