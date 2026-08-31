import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const ROOT = "/Volumes/T9/project:genlayer/faithful";
const T = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
            ".py":"text/plain; charset=utf-8", ".md":"text/plain; charset=utf-8" };
createServer(async (req,res)=>{
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  try{
    const b = await readFile(ROOT + p);
    res.writeHead(200,{"Content-Type":T[p.slice(p.lastIndexOf("."))]||"application/octet-stream","Cache-Control":"no-store"});
    res.end(b);
  }catch{ res.writeHead(404); res.end("not found"); }
}).listen(8739,()=>console.log("faithful on http://localhost:8739"));
