import { serveDir } from "jsr:@std/http@^1.1.3/file-server";

Deno.serve((req) => {
  const pathname = new URL(req.url).pathname;

  if (req.method === "GET" && pathname === "/welcome-message") {
    return new Response("きらめきは、まだまだ増やせる。");
  }

  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true,
  });
});
