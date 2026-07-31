import { createServer } from "node:http";

const hostname = "127.0.0.1";
const port = 4100;
const operations = [];

const spell = {
  index: "test-spark",
  name: "Test Spark",
  level: 0,
  school: { index: "evocation", name: "Evocation" },
  casting_time: "1 action",
  range: "30 feet",
  duration: "Instantaneous",
  concentration: false,
  ritual: false,
  components: ["V", "S"],
  attack_type: "ranged",
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

  if (request.method !== "POST" || request.url !== "/graphql") {
    return json(response, 404, { error: "Unknown test data-source route" });
  }

  let body = "";
  request.setEncoding("utf8");
  request.on("data", (chunk) => {
    body += chunk;
  });
  request.on("end", () => {
    let query;

    try {
      ({ query } = JSON.parse(body));
    } catch {
      json(response, 400, { error: "Invalid JSON request" });
      return;
    }

    if (typeof query === "string" && /query\s+Spells\b/.test(query)) {
      operations.push("Spells");
      json(response, 200, { data: { spells: [spell] } });
      return;
    }

    operations.push("Unknown");
    json(response, 400, {
      errors: [{ message: "Unexpected GraphQL operation in browser test" }],
    });
  });
});

server.listen(port, hostname, () => {
  process.stdout.write(
    `Mock data source listening at http://${hostname}:${port}\n`,
  );
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
