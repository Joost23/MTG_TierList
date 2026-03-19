/**
 * Cloudflare Worker — Moxfield CORS Proxy
 *
 * Deploys to: https://moxfield-proxy.<your-subdomain>.workers.dev
 *
 * How to deploy:
 *  1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
 *  2. Paste this file, click Deploy
 *  3. Copy the worker URL and update MOXFIELD_PROXY_URL in index.html
 */

const ALLOWED_HOST = "api2.moxfield.com";

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Accept",
        },
      });
    }

    const url = new URL(request.url);
    const target = url.searchParams.get("url");

    if (!target) {
      return new Response(JSON.stringify({ error: "Missing ?url= parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Only allow requests to Moxfield API
    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (targetUrl.hostname !== ALLOWED_HOST) {
      return new Response(JSON.stringify({ error: "Only Moxfield API requests are allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    try {
      const response = await fetch(target, {
        headers: {
          "User-Agent": "PostmanRuntime/7.31.1",
          "Accept": "application/json",
          "Content-Type": "application/json; charset=utf-8",
        },
      });

      const body = await response.text();

      return new Response(body, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Cache-Control": "public, max-age=300", // cache 5 min
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  },
};
