import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const secret = process.env.JWT_SECRET || '';

const config = {
  port: Number(process.env.PORT) || 8090,
  jwt: {
    secret: process.env.JWT_SECRET_BASE64 === 'true' ? Buffer.from(secret, 'base64') : secret,
    algorithm: process.env.JWT_ALGORITHM || 'HS256',
    claimId: process.env.JWT_CLAIM_ID || 'sub',
    claimRole: process.env.JWT_CLAIM_ROLE || 'role',
  },
  grpc: {
    worksUrl: process.env.GRPC_WORKS_URL || 'localhost:50051',
    usersUrl: process.env.GRPC_USERS_URL || 'localhost:50053',
    eventsUrl: process.env.GRPC_EVENTS_URL || 'localhost:50052',
    deadlineMs: 5000,
  },
  protosDir: process.env.PROTOS_DIR || path.resolve(__dirname, '../../protos'),
};

export default config;