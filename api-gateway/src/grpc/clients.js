import path from 'node:path';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import config from '../config.js';

function loadPackage(protoFile) {
  const def = protoLoader.loadSync(path.join(config.protosDir, protoFile), {
    keepCase: true, 
    longs: String,  
    defaults: true,
  });
  return grpc.loadPackageDefinition(def);
}

function createClient(Service, url) {
  return new Service(url, grpc.credentials.createInsecure());
}
const works = createClient(loadPackage('work.proto').museum.works.WorkService, config.grpc.worksUrl);
const events = createClient(loadPackage('event.proto').museum.events.EventService, config.grpc.eventsUrl);


export const clients = { works, events };

// Convierte el callback gRPC en promesa, con deadline y metadata del usuario.
export function call(client, method, request, user) {
  return new Promise((resolve, reject) => {
    const metadata = new grpc.Metadata();
    metadata.set('x-user-id', String(user.id));
    metadata.set('x-user-rol', String(user.rol));
    const deadline = new Date(Date.now() + config.grpc.deadlineMs);

    client[method](request, metadata, { deadline }, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}