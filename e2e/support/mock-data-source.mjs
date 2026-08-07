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

const classNames = [
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
];

const classes = classNames.map((name, index) => ({
  key: `srd-2024_${name.toLowerCase()}`,
  name,
  desc: `${name} features and training for an adventurer.`,
  hit_dice: index % 3 === 0 ? "D12" : index % 2 === 0 ? "D10" : "D8",
  caster_type: [
    "Bard",
    "Cleric",
    "Druid",
    "Sorcerer",
    "Warlock",
    "Wizard",
  ].includes(name)
    ? "FULL"
    : "NONE",
  subclass_of: null,
  saving_throws: [{ name: "Strength" }, { name: "Constitution" }],
  hit_points: {
    hit_dice: index % 3 === 0 ? "D12" : index % 2 === 0 ? "D10" : "D8",
    hit_dice_name: `1D10 per ${name} level`,
    hit_points_at_1st_level: "10 + Constitution modifier",
    hit_points_at_higher_levels: "1D10 + Constitution modifier",
  },
  features: [
    {
      key: `srd-2024_${name.toLowerCase()}_feature`,
      name: "Signature feature",
      desc: "Use this feature to recover 1d4 + 2 hit points.",
      feature_type: "CLASS_LEVEL_FEATURE",
      gained_at: [{ level: 1, detail: null }],
      data_for_class_table: [{ level: 1, column_value: "2" }],
    },
  ],
  document: spell.document,
}));

const species = Array.from({ length: 63 }, (_, index) => ({
  key: index === 0 ? "srd-2024_dragonborn" : `srd-2024_species-${index + 1}`,
  name: index === 0 ? "Dragonborn" : `Species ${index + 1}`,
  desc: "A playable people with distinct gifts and traits.",
  is_subspecies: index > 49,
  subspecies_of:
    index > 49 ? { key: "srd-2024_species-2", name: "Species 2" } : null,
  traits:
    index === 0
      ? [
          {
            name: "Size",
            desc: "Medium (about 5–7 feet tall)",
            type: "SIZE",
            order: 1,
          },
          { name: "Speed", desc: "30 feet", type: "SPEED", order: 2 },
          {
            name: "Draconic Ancestry",
            desc: "Your lineage stems from a dragon progenitor. Choose a kind from the table.\n\nTable: Draconic Ancestors\n\n| Dragon | Damage Type |\n|---|---|\n| Black | Acid |\n| Blue | Lightning |\n| Red | Fire |\n| Silver | Cold |",
            type: null,
            order: 3,
          },
          {
            name: "Breath Weapon",
            desc: "Exhale magical energy. A creature takes 1d10 damage on a failed save.",
            type: null,
            order: 4,
          },
        ]
      : [],
  document: spell.document,
}));

const documents = [
  spell.document,
  {
    key: "a5e-ag",
    name: "Adventurer's Guide",
    display_name: "Adventurer's Guide",
    type: "SOURCE",
    publisher: { key: "en-publishing", name: "EN Publishing" },
    gamesystem: { key: "a5e", name: "Advanced 5th Edition" },
    permalink: "https://example.test/a5e-ag",
  },
];

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
  if (request.method === "GET" && url.pathname === "/v2/documents/") {
    operations.push(`${request.method} ${url.pathname}${url.search}`);
    return json(response, 200, {
      count: documents.length,
      next: null,
      previous: null,
      results: documents,
    });
  }

  if (request.method === "GET" && url.pathname === "/v2/spells/") {
    operations.push(`${request.method} ${url.pathname}${url.search}`);
    return json(response, 200, {
      count: 1,
      next: null,
      previous: null,
      results: [spell],
    });
  }

  if (request.method === "GET" && url.pathname === "/v2/classes/") {
    operations.push(`${request.method} ${url.pathname}${url.search}`);
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const query = (url.searchParams.get("name__contains") ?? "").toLowerCase();
    const filtered = classes.filter((item) =>
      item.name.toLowerCase().includes(query),
    );
    const start = (page - 1) * limit;
    return json(response, 200, {
      count: filtered.length,
      next:
        start + limit < filtered.length
          ? `http://${hostname}:${port}/v2/classes/?page=${page + 1}`
          : null,
      previous:
        page > 1
          ? `http://${hostname}:${port}/v2/classes/?page=${page - 1}`
          : null,
      results: filtered.slice(start, start + limit),
    });
  }

  if (request.method === "GET" && url.pathname === "/v2/species/") {
    operations.push(`${request.method} ${url.pathname}${url.search}`);
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const query = (url.searchParams.get("name__icontains") ?? "").toLowerCase();
    const baseOnly = url.searchParams.get("subspecies_of__isnull");
    const filtered = species.filter(
      (item) =>
        item.name.toLowerCase().includes(query) &&
        (baseOnly === null || item.is_subspecies === (baseOnly === "false")),
    );
    const start = (page - 1) * limit;
    return json(response, 200, {
      count: filtered.length,
      next:
        start + limit < filtered.length
          ? `http://${hostname}:${port}/v2/species/?page=${page + 1}`
          : null,
      previous:
        page > 1
          ? `http://${hostname}:${port}/v2/species/?page=${page - 1}`
          : null,
      results: filtered.slice(start, start + limit),
    });
  }

  if (
    request.method === "GET" &&
    url.pathname.startsWith("/v2/species/srd-2024_")
  ) {
    operations.push(`${request.method} ${url.pathname}`);
    const key = url.pathname.split("/").filter(Boolean).at(-1);
    const result = species.find((item) => item.key === key);
    return result
      ? json(response, 200, result)
      : json(response, 404, { error: "Not found" });
  }

  if (
    request.method === "GET" &&
    url.pathname.startsWith("/v2/classes/srd-2024_")
  ) {
    operations.push(`${request.method} ${url.pathname}`);
    const key = url.pathname.split("/").filter(Boolean).at(-1);
    const result = classes.find((item) => item.key === key);
    return result
      ? json(response, 200, result)
      : json(response, 404, { error: "Not found" });
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
