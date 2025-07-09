import { NextRequest, NextResponse } from 'next/server';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';

/**
 * Converts raw request body to a stream for NextRequest.
 */
function bodyToStream(body: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const uint8array = encoder.encode(body);

  return new ReadableStream({
    start(controller) {
      controller.enqueue(uint8array);
      controller.close();
    },
  });
}

/**
 * Wraps a Next.js route handler (app router style) for use in tests with Supertest.
 */
export function testServer(handler: { POST?: Function; GET?: Function }) {
  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const method = (req.method ?? 'GET').toUpperCase() as 'POST' | 'GET';

    const url = new URL(req.url ?? '', 'http://localhost');

    const chunks: any[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', async () => {
      const body = Buffer.concat(chunks).toString();

      const nextReq = new NextRequest(url, {
        method,
        body: body ? bodyToStream(body) : undefined,
        headers: req.headers as HeadersInit,
      });

      if (!handler[method]) {
        res.statusCode = 405;
        res.end('Method Not Allowed');
        return;
      }

      const nextRes: NextResponse = await handler[method]!(nextReq);

      res.writeHead(nextRes.status, Object.fromEntries(nextRes.headers));
      const data = await nextRes.text();
      res.end(data);
    });
  });
}
