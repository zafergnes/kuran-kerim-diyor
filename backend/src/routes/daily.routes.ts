import { Router } from 'express';
import { getDailyContext, getRandomContext, getVerseByRef } from '../controllers/daily.controller';

const router = Router();

router.get('/', getDailyContext);
router.get('/random', getRandomContext);
router.get('/verse/:surah/:ayah', getVerseByRef);

export default router;
