import grpc from '@grpc/grpc-js';

export const GRPC_TO_HTTP = {
  [grpc.status.INVALID_ARGUMENT]: 400,
  [grpc.status.NOT_FOUND]: 404,
  [grpc.status.DEADLINE_EXCEEDED]: 504,
  [grpc.status.UNAVAILABLE]: 503,
};

export function sendGrpcError(res, err) {
  const status = GRPC_TO_HTTP[err && err.code];
  if (status) {
    return res.status(status).json({ error: err.details || err.message });
  }
  console.error('Error inesperado en la Gateway:', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}