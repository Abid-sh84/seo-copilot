import { Router } from 'express';
import { authMiddleware } from '../auth';
import { generateBlog, listBlogs, getBlog, deleteBlog } from './blog.controller';

const router = Router();

// POST   /api/blog/generate  → generate blog content from keyword
router.post('/generate', authMiddleware, generateBlog);

// GET    /api/blog            → list all generated blogs
router.get('/',           authMiddleware, listBlogs);

// GET    /api/blog/:id        → get single blog
router.get('/:id',        authMiddleware, getBlog);

// DELETE /api/blog/:id        → delete a blog
router.delete('/:id',     authMiddleware, deleteBlog);

export default router;
