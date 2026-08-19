import { serveDir } from "jsr:@std/http@^1.1.3/file-server";

const counterPath = "./visitor-count.json";

async function readCount() {
  try {
    const raw = await Deno.readTextFile(counterPath);
    const parsed = JSON.parse(raw);
    return Number(parsed.count) || 0;
  } catch {
    return 0;
  }
}

async function writeCount(count) {
  await Deno.writeTextFile(counterPath, JSON.stringify({ count }, null, 2));
}

Deno.serve(async (req) => {
  const pathname = new URL(req.url).pathname;

  if (req.method === "GET" && pathname === "/welcome-message") {
    return new Response("きらめきは、まだまだ増やせる。");
  }

  if (req.method === "GET" && (pathname === "/" || pathname === "/index.html")) {
    const count = (await readCount()) + 1;
    await writeCount(count);
  }

  if (req.method === "GET" && pathname === "/site-metrics") {
    const count = await readCount();
    return Response.json({ visitors: count, density: 128 });
  }

  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true,
  });
});
