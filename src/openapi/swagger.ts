import { Router } from 'express';
import { openApiDocument } from './openapi';

export const openApiRouter = Router();

openApiRouter.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});
