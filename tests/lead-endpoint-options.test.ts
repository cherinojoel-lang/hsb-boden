import { describe, expect, it } from "vitest";
import { OPTIONS } from "../src/pages/api/lead";
import type { APIContext } from "astro";

describe("OPTIONS /api/lead", () => {
  it("returns 204 for allowed origins", async () => {
    const request = new Request("http://localhost/api/lead", {
      headers: { Origin: "https://hsb-boden.de" },
    });
    const context = { request } as APIContext;
    const response = await OPTIONS(context);
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://hsb-boden.de",
    );
  });

  it("returns 403 for forbidden origins", async () => {
    const request = new Request("http://localhost/api/lead", {
      headers: { Origin: "https://evil.com" },
    });
    const context = { request } as APIContext;
    const response = await OPTIONS(context);
    expect(response.status).toBe(403);
  });
});
