import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { startWebSocketServer } from "./src/lib/websocket-server";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const WS_PORT = parseInt(process.env.WS_PORT || "3001");

app.prepare().then(() => {
  startWebSocketServer(WS_PORT);

  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(parseInt(process.env.PORT || "3000"), () => {
    console.log(`> Ready on http://localhost:${process.env.PORT || "3000"}`);
    console.log(`> WebSocket on ws://localhost:${WS_PORT}`);
  });
});
