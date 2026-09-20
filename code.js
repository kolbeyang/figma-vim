const UI_WIDTH = 120;
const UI_HEIGHT = 40;
const { x, y, width } = figma.viewport.bounds;

figma.showUI(__html__, {
  width: UI_WIDTH,
  height: UI_HEIGHT,
  position: {
    x: x + width / 2 - UI_WIDTH / 2,
    y: y + 10,
  },
  title: " ",
  themeColors: true,
});

function getAutoLayoutFrames() {
  const nodes = figma.currentPage.selection;
  const frames = [];
  for (const node of nodes) {
    if ("layoutMode" in node && node.layoutMode !== "NONE") {
      frames.push(node);
    }
  }
  return frames;
}

function getSelectedNodes() {
  return figma.currentPage.selection.slice();
}

// Cycle alignment: MIN <-> CENTER <-> MAX
const ALIGN_ORDER = ["MIN", "CENTER", "MAX"];

function cycleAlign(current, step) {
  let idx = ALIGN_ORDER.indexOf(current);
  if (idx === -1) idx = 0;
  idx = Math.max(0, Math.min(ALIGN_ORDER.length - 1, idx + step));
  return ALIGN_ORDER[idx];
}

figma.ui.onmessage = (msg) => {
  if (msg.type === "close") {
    figma.closePlugin();
    return;
  }

  if (msg.type === "resize") {
    figma.ui.resize(msg.width, msg.height);
    return;
  }

  if (msg.type === "cycle-align") {
    const frames = getAutoLayoutFrames();
    if (frames.length === 0) {
      figma.notify("No auto-layout frame selected", { error: true });
      return;
    }

    for (const frame of frames) {
      const isHorizontal = frame.layoutMode === "HORIZONTAL";

      if (msg.axis === "horizontal") {
        if (isHorizontal) {
          frame.primaryAxisAlignItems = cycleAlign(
            frame.primaryAxisAlignItems,
            msg.step
          );
        } else {
          frame.counterAxisAlignItems = cycleAlign(
            frame.counterAxisAlignItems,
            msg.step
          );
        }
      } else {
        if (isHorizontal) {
          frame.counterAxisAlignItems = cycleAlign(
            frame.counterAxisAlignItems,
            msg.step
          );
        } else {
          frame.primaryAxisAlignItems = cycleAlign(
            frame.primaryAxisAlignItems,
            msg.step
          );
        }
      }
    }

    return;
  }

  if (msg.type === "cmd") {
    const result = executeCommand(msg.cmd, msg.value);
    if (result.error) {
      figma.notify(result.message, { error: true });
      return;
    }
    figma.closePlugin();
    return;
  }

  if (msg.type === "cmd-batch") {
    for (const c of msg.cmds) {
      const result = executeCommand(c.cmd, c.value);
      if (result.error) {
        figma.notify(result.message, { error: true });
        return;
      }
    }
    figma.closePlugin();
    return;
  }
};

// Returns { message, label, error } — label is the short form for batch summary
function executeCommand(cmd, val) {
  // Auto-layout-only commands
  if (cmd === "g") {
    const frames = getAutoLayoutFrames();
    if (frames.length === 0) return autoLayoutError();
    for (const f of frames) f.itemSpacing = val;
    return { message: "Gap → " + val, label: "g" + val };
  }
  if (cmd === "p") {
    const frames = getAutoLayoutFrames();
    if (frames.length === 0) return autoLayoutError();
    for (const f of frames) {
      f.paddingTop = val; f.paddingBottom = val;
      f.paddingLeft = val; f.paddingRight = val;
    }
    return { message: "Padding → " + val, label: "p" + val };
  }
  if (cmd === "px") {
    const frames = getAutoLayoutFrames();
    if (frames.length === 0) return autoLayoutError();
    for (const f of frames) { f.paddingLeft = val; f.paddingRight = val; }
    return { message: "Padding X → " + val, label: "px" + val };
  }
  if (cmd === "py") {
    const frames = getAutoLayoutFrames();
    if (frames.length === 0) return autoLayoutError();
    for (const f of frames) { f.paddingTop = val; f.paddingBottom = val; }
    return { message: "Padding Y → " + val, label: "py" + val };
  }
  if (cmd === "pl") {
    const frames = getAutoLayoutFrames();
    if (frames.length === 0) return autoLayoutError();
    for (const f of frames) f.paddingLeft = val;
    return { message: "Padding L → " + val, label: "pl" + val };
  }
  if (cmd === "pr") {
    const frames = getAutoLayoutFrames();
    if (frames.length === 0) return autoLayoutError();
    for (const f of frames) f.paddingRight = val;
    return { message: "Padding R → " + val, label: "pr" + val };
  }
  if (cmd === "pt") {
    const frames = getAutoLayoutFrames();
    if (frames.length === 0) return autoLayoutError();
    for (const f of frames) f.paddingTop = val;
    return { message: "Padding T → " + val, label: "pt" + val };
  }
  if (cmd === "pb") {
    const frames = getAutoLayoutFrames();
    if (frames.length === 0) return autoLayoutError();
    for (const f of frames) f.paddingBottom = val;
    return { message: "Padding B → " + val, label: "pb" + val };
  }

  // Node commands
  if (cmd === "a") {
    const nodes = getSelectedNodes();
    if (nodes.length === 0) return nothingSelectedError();
    let setTo;
    for (const n of nodes) {
      if ("layoutPositioning" in n) {
        if (!setTo) setTo = n.layoutPositioning === "ABSOLUTE" ? "AUTO" : "ABSOLUTE";
        n.layoutPositioning = setTo;
      }
    }
    return { message: setTo === "ABSOLUTE" ? "Set absolute" : "Set auto", label: "a" };
  }
  if (cmd === "fr") {
    const frames = getAutoLayoutFrames();
    if (frames.length === 0) return autoLayoutError();
    for (const f of frames) f.layoutMode = "HORIZONTAL";
    return { message: "Flex → Row", label: "fr" };
  }
  if (cmd === "fc") {
    const frames = getAutoLayoutFrames();
    if (frames.length === 0) return autoLayoutError();
    for (const f of frames) f.layoutMode = "VERTICAL";
    return { message: "Flex → Col", label: "fc" };
  }
  if (cmd === "x") {
    const frames = getAutoLayoutFrames();
    if (frames.length === 0) return autoLayoutError();
    for (const f of frames) {
      if (f.primaryAxisAlignItems === "SPACE_BETWEEN") {
        f.primaryAxisAlignItems = "MIN";
      } else {
        f.primaryAxisAlignItems = "SPACE_BETWEEN";
      }
    }
    return { message: "Toggle auto gap", label: "x" };
  }
  if (cmd === "hf") {
    const nodes = getSelectedNodes();
    if (nodes.length === 0) return nothingSelectedError();
    for (const n of nodes) if ("layoutSizingVertical" in n) n.layoutSizingVertical = "FILL";
    return { message: "Height → Fill", label: "hf" };
  }
  if (cmd === "hh") {
    const nodes = getSelectedNodes();
    if (nodes.length === 0) return nothingSelectedError();
    for (const n of nodes) if ("layoutSizingVertical" in n) n.layoutSizingVertical = "HUG";
    return { message: "Height → Hug", label: "hh" };
  }
  if (cmd === "wf") {
    const nodes = getSelectedNodes();
    if (nodes.length === 0) return nothingSelectedError();
    for (const n of nodes) if ("layoutSizingHorizontal" in n) n.layoutSizingHorizontal = "FILL";
    return { message: "Width → Fill", label: "wf" };
  }
  if (cmd === "wh") {
    const nodes = getSelectedNodes();
    if (nodes.length === 0) return nothingSelectedError();
    for (const n of nodes) if ("layoutSizingHorizontal" in n) n.layoutSizingHorizontal = "HUG";
    return { message: "Width → Hug", label: "wh" };
  }
  if (cmd === "r") {
    const nodes = getSelectedNodes();
    if (nodes.length === 0) return nothingSelectedError();
    for (const n of nodes) if ("cornerRadius" in n) n.cornerRadius = val;
    return { message: "Radius → " + val, label: "r" + val };
  }

  if (cmd === "w") {
    const nodes = getSelectedNodes();
    if (nodes.length === 0) return nothingSelectedError();
    for (const n of nodes) {
      if ("resize" in n) {
        // Force sizing to FIXED first, otherwise FILL/HUG overrides resize
        if ("layoutSizingHorizontal" in n) n.layoutSizingHorizontal = "FIXED";
        n.resize(val, n.height);
      }
    }
    return { message: "Width → " + val, label: "w" + val };
  }

  if (cmd === "h") {
    const nodes = getSelectedNodes();
    if (nodes.length === 0) return nothingSelectedError();
    for (const n of nodes) {
      if ("resize" in n) {
        if ("layoutSizingVertical" in n) n.layoutSizingVertical = "FIXED";
        n.resize(n.width, val);
      }
    }
    return { message: "Height → " + val, label: "h" + val };
  }

  return { message: "Unknown command: " + cmd, label: cmd, error: true };
}

function autoLayoutError() {
  return { message: "No auto-layout frame selected", label: "", error: true };
}

function nothingSelectedError() {
  return { message: "Nothing selected", label: "", error: true };
}
