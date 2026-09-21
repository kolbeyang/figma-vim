const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const pluginCode = fs.readFileSync("code.js", "utf8");

function createHarness(fonts) {
  const loadedFonts = new Set();
  const notifications = [];
  let alignment = "LEFT";
  let fontSize = 16;

  function assertFontsLoaded() {
    for (const font of fonts) {
      const key = `${font.family}\u0000${font.style}`;
      if (!loadedFonts.has(key)) {
        throw new Error("Cannot write to node with unloaded font");
      }
    }
  }

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
      assertFontsLoaded();
      alignment = value;
    },
    get fontSize() {
      return fontSize;
    },
    set fontSize(value) {
      assertFontsLoaded();
      fontSize = value;
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
    getFontSize: () => fontSize,
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

  const sizeHarness = createHarness(fonts);
  await sizeHarness.figma.ui.onmessage({
    type: "cmd-batch",
    cmds: [{ cmd: "t", value: 24 }],
  });
  assert.equal(sizeHarness.getFontSize(), 24);
  assert.equal(sizeHarness.loadedFonts.size, 2);
  assert.deepEqual(sizeHarness.notifications, []);

  console.log("text commands load fonts before writing");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
