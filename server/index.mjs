import { createRoyaleServer } from './server.mjs';

function integer(name, fallback, min, max) {
  const value=Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${name} must be ${min}–${max}`);
  return value;
}
const game=createRoyaleServer({
  host:process.env.HOST || '127.0.0.1',
  port:integer('PORT',4180,1,65535),
  maxRooms:integer('MAX_ROOMS',6,1,32),
  maxConnections:integer('MAX_CONNECTIONS',120,1,1600),
  allowedOrigins:(process.env.ALLOWED_ORIGINS || '').split(',').map(value=>value.trim()).filter(Boolean),
});
const address=await game.listen();
console.log(`Island Royale server listening at ${address.url}`);
let stopping=false;
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,async()=>{
  if(stopping)return;stopping=true;
  const deadline=setTimeout(()=>process.exit(1),5000);deadline.unref();
  await game.close();process.exit(0);
});
