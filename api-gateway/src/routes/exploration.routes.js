import express from 'express';
import auth from '../middleware/auth.js';
import { sendGrpcError } from '../utils/grpcErrors.js';

export default function explorationRoutes({ clients, call }) {
  const router = express.Router();

  // Requerimiento 4: Exploración Avanzada por Era
  router.get('/exploration/era/:era', auth(['VISITANTE', 'CURADOR', 'ADMINISTRADOR']), async (req, res) => {
    const era = req.params.era;
    if (!era || !era.trim()) {
      return res.status(400).json({ error: 'El parámetro era es requerido' });
    }

    try {
      // Llamamos en paralelo a grpc-works y grpc-events
      const [worksAndArtists, eventsResponse] = await Promise.all([
        call(clients.works, 'GetWorksAndArtistsByEra', { era: era.trim() }, req.user),
        call(clients.events, 'GetEventsByEra', { era: era.trim() }, req.user),
      ]);

      res.json({
        era: era.trim(),
        works: worksAndArtists.works ?? [],
        artists: worksAndArtists.artists ?? [],
        events: eventsResponse.events ?? [],
      });
    } catch (err) {
      sendGrpcError(res, err);
    }
  });

  return router;
}