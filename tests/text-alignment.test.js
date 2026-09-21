const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const pluginCode = fs.readFileSync("code.js", "utf8");

function createHarness(fonts) {
  const loadedFonts = new Set();
  const notifications = [];
  let alignment = "LEFT";

  const textNode = {
    type: "TEXT",
    characters: "Hello",
    getRangeAllFontNames() {
      return fonts;
    },
    get textAlignHorizontal() {
      return alignment;
    },
    set textAlignHorizontal(value) {
      for (const font of fonts) {
        const key = `${font.family}\u0000${font.style}`;
        if (!loadedFonts.has(key)) {
          throw new Error("Cannot write to node with unloaded font");
        }
      }
      alignment = value;
    },
  };

  const figma = {
    mixed: Symbol("mixed"),
    viewport: { bounds: { x: 0, y: 0, width: 1000 } },
    currentPage: { selection: [textNode] },
    showUI() {},
    closePlugin() {},
    notify(message, options) {
      notifications.push({ message, options });
    },
    async loadFontAsync(font) {
      loadedFonts.add(`${font.family}\u0000${font.style}`);
    },
    ui: {},
  };

  vm.runInNewContext(pluginCode, { figma, __html__: "" });

  return {
    figma,
    getAlignment: () => alignment,
    loadedFonts,
    notifications,
  };
}

async function main() {
  const fonts = [
    { family: "Inter", style: "Regular" },
    { family: "Inter", style: "Bold" },
  ];
  const harness = createHarness(fonts);
  const right = { type: "cycle-align", axis: "horizontal", step: 1 };

  await harness.figma.ui.onmessage(right);
  assert.equal(harness.getAlignment(), "CENTER");
  assert.equal(harness.loadedFonts.size, 2);

  await harness.figma.ui.onmessage(right);
  assert.equal(harness.getAlignment(), "RIGHT");
  assert.deepEqual(harness.notifications, []);

  console.log("text alignment loads fonts before writing");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
