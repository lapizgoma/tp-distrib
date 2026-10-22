import express from 'express';
import comparisonRoutes from './routes/comparison.js';
// import toursRoutes from './routes/tours.js';                    // caso 1
// import recommendationsRoutes from './routes/recommendations.js'; // caso 3
// import explorationRoutes from './routes/exploration.js';         // caso 4

// No importa los clientes reales: los recibe por parámetro (así los tests no tocan los .proto).
export function createApp(deps) {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // ---- RUTAS: una línea por caso de uso ----
  app.use('/api/hito2', comparisonRoutes(deps));   // caso 2
  // app.use('/api/hito2', toursRoutes(deps));           // caso 1
  // app.use('/api/hito2', recommendationsRoutes(deps)); // caso 3
  // app.use('/api/hito2', explorationRoutes(deps));     // caso 4

  app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

  // JSON mal formado y otros errores de Express
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}