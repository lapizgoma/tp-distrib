import config from './config.js';
import { clients, call } from './grpc/clients.js';
import { createApp } from './app.js';

if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET');
  process.exit(1);
}

const app = createApp({ clients, call });
app.listen(config.port, () => console.log(`API Gateway escuchando en :${config.port}`));