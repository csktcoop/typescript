import { Router } from 'express';
import { prisma } from '../db';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';
import { z } from 'zod';
const router = Router();

/**
 * Helper: validate and normalize numeric IDs from params
 */
function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Helper: get model instance, 404 on not found
 */
async function getProductOrNull(id: number) {
  return prisma.product.findUnique({ where: { id } });
}

/**
 * CREATE
 */
router.post('/', async (req, res, next) => {
  try {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(z.treeifyError(parsed.error));
  
    const product = await prisma.product.create({ data: parsed.data });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

/**
 * READ (all)
 */
router.get('/', async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: 'desc' }
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

/**
 * READ (one)
 */
router.get('/:id', async (req, res, next) => {
  try{
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });

    const product = await getProductOrNull(id);
    if (!product) return res.status(404).json({ error: 'Not found' });

    res.json(product);
  } catch (err) {
    next(err);
  }
});

/**
 * UPDATE
 */
router.put('/:id', async (req, res, next) => {
  try{
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });

    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(z.treeifyError(parsed.error));

    let product = await getProductOrNull(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product = await prisma.product.update({
      where: { id },
      data: parsed.data
    });

    res.json(product);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE
 */
router.delete('/:id', async (req, res, next) => {
  try{
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });

    const product = await getProductOrNull(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
