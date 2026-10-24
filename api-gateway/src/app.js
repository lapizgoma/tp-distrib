import express from 'express';
import comparisonRoutes from './routes/comparison.routes.js';

// No importa los clientes reales: los recibe por parámetro (así los tests no tocan los .proto).
export function createApp(deps) {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/grpc', comparisonRoutes(deps));   

  app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

  // JSON mal formado y otros errores de Express
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}