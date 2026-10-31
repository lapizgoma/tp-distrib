import { STATUS_CODES } from 'node:http';

export function sendProblem(req, res, status, detail) {
  res
    .status(status)
    .set('Content-Type', 'application/problem+json')
    .send(
      JSON.stringify({
        type: 'about:blank',
        title: STATUS_CODES[status],
        status,
        detail,
        instance: req.path,
      }),
    );
}