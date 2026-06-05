# Arduino Blocks Lab Block Pack Format

Block packs are JSON documents, and may be authored as YAML if converted to the same shape before publishing.

```json
{
  "formatVersion": "1.0.0",
  "id": "vendor.sensor-pack",
  "name": "Vendor Sensor Pack",
  "version": "0.1.0",
  "boards": [],
  "components": [],
  "blocks": [],
  "lessons": []
}
```

Each component describes wiring, required Arduino libraries, and code snippets for `include`, global declarations, setup, and loop snippets. Blocks reference those components through typed inputs and emit operations that the code generator can turn into Arduino C++.

The V1 app ships one built-in pack for Uno/Nano/Mega starter hardware. Future packs should be installable without changing the editor source.

The authoritative JSON Schema lives in `docs/extension.schema.json`.
