import { Router } from 'express';
import { authMiddleware } from '../auth';
import { exportExcel, exportPDF } from './export.controller';

const router = Router();

// GET /api/export/excel/:id  — download Excel workbook
router.get('/excel/:id', authMiddleware, exportExcel);

// GET /api/export/pdf/:id    — download PDF report
router.get('/pdf/:id',   authMiddleware, exportPDF);

export default router;
