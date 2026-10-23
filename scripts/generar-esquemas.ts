#!/usr/bin/env tsx

import { ExplorationConfigSchema } from "../src/config/schemas.js";

const schema = ExplorationConfigSchema;

console.log("JSON Schema de exploracion.json:");
console.log(JSON.stringify(schema.jsonSchema?.(), null, 2));
