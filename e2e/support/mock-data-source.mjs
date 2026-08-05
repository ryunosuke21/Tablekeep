import { createServer } from "node:http";

const hostname = "127.0.0.1";
const port = 4100;
const operations = [];

const spell = {
  key: "srd-2024_test-spark",
  name: "Test Spark",
  desc: "A small magical spark.",
  higher_level: "Damage increases with the slot level.",
  level: 0,
  school: { key: "evocation", name: "Evocation" },
  classes: [{ key: "srd-2024_wizard", name: "Wizard" }],
  casting_time: "action",
  reaction_condition: null,
  range: 30,
  range_text: "30 feet",
  range_unit: "feet",
  duration: "instantaneous",
  concentration: false,
  ritual: false,
  verbal: true,
  somatic: true,
  material: false,
  material_specified: null,
  material_cost: null,
  material_consumed: false,
  target_type: "creature",
  target_count: 1,
  saving_throw_ability: "",
  attack_roll: true,
  damage_roll: "1d6",
  damage_types: ["fire"],
  shape_type: null,
  shape_size: null,
  shape_size_unit: null,
  casting_options: [],
  document: {
    key: "srd-2024",
    name: "System Reference Document 5.2",
    display_name: "5e 2024 Rules",
    type: "SOURCE",
    publisher: { key: "wizards-of-the-coast", name: "Wizards of the Coast" },
    gamesystem: { key: "5e-2024", name: "5th Edition 2024" },
    permalink: "https://example.test/srd-2024",
  },
};

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

const server = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    return json(response, 200, { status: "ok" });
  }

  if (request.method === "GET" && request.url === "/requests") {
    return json(response, 200, { operations });
  }

  const url = new URL(request.url ?? "/", `http://${hostname}:${port}`);
  if (request.method === "GET" && url.pathname === "/v2/spells/") {
    operations.push(`${request.method} ${url.pathname}${url.search}`);
    return json(response, 200, {
      count: 1,
      next: null,
      previous: null,
      results: [spell],
    });
  }

  if (
    request.method === "GET" &&
    url.pathname === "/v2/spells/srd-2024_test-spark/"
  ) {
    operations.push(`${request.method} ${url.pathname}`);
    return json(response, 200, spell);
  }

  return json(response, 404, { error: "Unknown test data-source route" });
});

server.listen(port, hostname, () => {
  process.stdout.write(
    `Mock data source listening at http://${hostname}:${port}\n`,
  );
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
