# Figma Vim

A Vim-inspired command palette for Figma. Select a layer, enter a command, and press **Enter**.

## Install

1. Clone the repository and build the plugin:

   ```sh
   git clone https://github.com/kolbeyang/figma-vim.git
   cd figma-vim
   npm install
   npm run build
   ```

2. In Figma, go to **Plugins → Development → Import plugin from manifest**.
3. Select `manifest.json`.

> Tip: Create a macOS app shortcut for **Figma Vim** under **System Settings → Keyboard → Keyboard Shortcuts → App Shortcuts**.

## Commands

Commands can be chained with spaces: `g16 p8 wf`.

### Auto layout

| Command | Action |
| --- | --- |
| `g<n>` | Set gap |
| `p<n>` | Set padding on all sides |
| `px<n>` | Set horizontal padding |
| `py<n>` | Set vertical padding |
| `pl<n>` | Set left padding |
| `pr<n>` | Set right padding |
| `pt<n>` | Set top padding |
| `pb<n>` | Set bottom padding |
| `fr` | Set horizontal direction |
| `fc` | Set vertical direction |
| `x` | Toggle space-between gap |

### Text

| Command | Action |
| --- | --- |
| `t<n>` | Set font size on selected text layers |

### Sizing

| Command | Action |
| --- | --- |
| `w<n>` | Set fixed width |
| `h<n>` | Set fixed height |
| `wf` | Set width to fill |
| `wh` | Set width to hug |
| `hf` | Set height to fill |
| `hh` | Set height to hug |

### Other

| Command | Action |
| --- | --- |
| `r<n>` | Set corner radius |
| `a` | Toggle absolute positioning |
| `q` | Close the plugin |

### Keyboard shortcuts

With an empty input, arrow keys cycle alignment:

- **← / →** — text alignment on text layers, or horizontal alignment on auto-layout frames
- **↑ / ↓** — vertical alignment on auto-layout frames
- **?** — show command help
- **Esc** — close command help

## Development

```sh
npm run watch
```

This watches `src/ui.html` and `src/styles.css` and rebuilds the plugin when they change.
