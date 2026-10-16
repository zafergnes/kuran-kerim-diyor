import { Router } from 'express';
import { getDailyHadith, getHadithById } from '../controllers/hadith.controller';

const router = Router();

router.get('/daily', getDailyHadith);
router.get('/:id', getHadithById);

export default router;
