#!/usr/bin/env python3
"""NBS Template Editor — desktop editor for Narration Beat Switch templates.

Reads and writes the SAME file the extension itself loads at SillyTavern
boot: <SillyTavern folder>/data/<user>/user/narrator_tools/nbs_templates.json
(via the narrator-tools-storage server plugin's on-disk format). Pick a
template from the list (or open any file), edit it, click "Save to
SillyTavern" — reload the SillyTavern browser tab and it's there.

No dependencies — Python 3.8+ standard library (tkinter).

Run:  python nbs_template_editor.py
"""

import json
import re
import sys
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

# ── Theme — matches the nds-tracker SillyTavern extension palette ────────
# (see nds-tracker/style.css: --SmartThemeBlurTintColor / body / accent colors)

BG_MAIN = "#14141c"        # window background (rgba(18,18,28,0.96) flattened)
BG_PANEL = "#1c1c26"       # rows / fields (rgba(255,255,255,0.03) over BG_MAIN)
BG_PANEL_HOVER = "#242430"
BG_INPUT = "#20202c"       # entries / text boxes
BG_TITLEBAR = "#191922"
BORDER = "#34343f"         # rgba(255,255,255,0.14) over dark bg
BORDER_SUBTLE = "#26262f"
FG_MAIN = "#e0e0e0"        # --SmartThemeBodyColor
FG_MUTED = "#9a9aa5"
ACCENT_BLUE = "#7eb8ff"
ACCENT_BLUE_DIM = "#3f5b7a"
ACCENT_GREEN = "#8dffbd"
ACCENT_RED = "#ff8080"
ACCENT_GOLD = "#ffd166"


def apply_theme(root: tk.Tk) -> ttk.Style:
    root.configure(bg=BG_MAIN)
    style = ttk.Style(root)
    style.theme_use("clam")

    style.configure(".", background=BG_MAIN, foreground=FG_MAIN,
                     fieldbackground=BG_INPUT, bordercolor=BORDER,
                     lightcolor=BG_MAIN, darkcolor=BG_MAIN,
                     font=("Segoe UI", 10))
    style.configure("TFrame", background=BG_MAIN)
    style.configure("TLabel", background=BG_MAIN, foreground=FG_MAIN)
    style.configure("Muted.TLabel", background=BG_MAIN, foreground=FG_MUTED, font=("Segoe UI", 9))
    style.configure("Title.TLabel", background=BG_TITLEBAR, foreground=FG_MAIN,
                     font=("Segoe UI", 11, "bold"))
    style.configure("Titlebar.TFrame", background=BG_TITLEBAR)

    style.configure("TEntry", fieldbackground=BG_INPUT, foreground=FG_MAIN,
                     insertcolor=FG_MAIN, bordercolor=BORDER, lightcolor=BORDER,
                     darkcolor=BORDER, padding=4)
    style.map("TEntry", bordercolor=[("focus", ACCENT_BLUE)],
              lightcolor=[("focus", ACCENT_BLUE)])

    style.configure("TButton", background=BG_PANEL, foreground=FG_MAIN,
                     bordercolor=BORDER, lightcolor=BG_PANEL, darkcolor=BG_PANEL,
                     focusthickness=0, padding=(10, 5))
    style.map("TButton",
              background=[("active", BG_PANEL_HOVER), ("pressed", BG_PANEL_HOVER)],
              bordercolor=[("active", ACCENT_BLUE)])

    style.configure("Accent.TButton", foreground="#0b0b12", background=ACCENT_BLUE,
                     bordercolor=ACCENT_BLUE, padding=(10, 5))
    style.map("Accent.TButton", background=[("active", "#93c6ff")])

    style.configure("Danger.TButton", foreground=ACCENT_RED, background=BG_PANEL,
                     bordercolor=ACCENT_RED, padding=(6, 4))
    style.map("Danger.TButton", background=[("active", "#3a2020")])

    style.configure("Vertical.TScrollbar", background=BG_PANEL, troughcolor=BG_MAIN,
                     bordercolor=BG_MAIN, arrowcolor=FG_MUTED, relief="flat")
    style.map("Vertical.TScrollbar", background=[("active", BG_PANEL_HOVER)])

    return style


TEXT_WIDGET_OPTS = dict(
    background=BG_INPUT, foreground=FG_MAIN, insertbackground=ACCENT_BLUE,
    selectbackground=ACCENT_BLUE_DIM, selectforeground=FG_MAIN,
    relief="flat", borderwidth=0, highlightthickness=1,
    highlightbackground=BORDER, highlightcolor=ACCENT_BLUE,
)

LISTBOX_OPTS = dict(
    background=BG_PANEL, foreground=FG_MAIN, selectbackground=ACCENT_BLUE_DIM,
    selectforeground=FG_MAIN, relief="flat", borderwidth=0, highlightthickness=1,
    highlightbackground=BORDER, highlightcolor=ACCENT_BLUE,
    activestyle="none",
)


def _hex_to_colorref(hex_color: str) -> int:
    """#RRGGBB -> Windows COLORREF (0x00BBGGRR) for DwmSetWindowAttribute."""
    hex_color = hex_color.lstrip("#")
    r, g, b = (int(hex_color[i:i + 2], 16) for i in (0, 2, 4))
    return (b << 16) | (g << 8) | r


def apply_windows_dark_titlebar(root: tk.Tk) -> None:
    """Best-effort: dark native title bar on Windows 10 20H1+/11. No-op elsewhere
    or on older Windows — failures are swallowed, the app still runs fine."""
    if sys.platform != "win32":
        return
    try:
        import ctypes
        root.update_idletasks()
        hwnd = ctypes.windll.user32.GetParent(root.winfo_id())
        dwmapi = ctypes.windll.dwmapi

        DWMWA_USE_IMMERSIVE_DARK_MODE = 20
        value = ctypes.c_int(1)
        dwmapi.DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE,
                                      ctypes.byref(value), ctypes.sizeof(value))

        # Windows 11 22000+ only: tint the caption/text to match the app theme.
        DWMWA_CAPTION_COLOR = 35
        DWMWA_TEXT_COLOR = 36
        caption = ctypes.c_int(_hex_to_colorref(BG_TITLEBAR))
        text_color = ctypes.c_int(_hex_to_colorref(FG_MAIN))
        dwmapi.DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR,
                                      ctypes.byref(caption), ctypes.sizeof(caption))
        dwmapi.DwmSetWindowAttribute(hwnd, DWMWA_TEXT_COLOR,
                                      ctypes.byref(text_color), ctypes.sizeof(text_color))
    except Exception:
        pass  # Older Windows / no dwmapi — the window just keeps the default title bar.


LABEL_RE = re.compile(r"^[a-z][a-z0-9_-]*$")
CAPSULE_RE = re.compile(
    r'<capsule\s+label="([^"]+)"\s+trigger="([^"]*)">([\s\S]*?)</capsule>', re.I)
PROSE_STYLE_RE = re.compile(
    r'<prose_style\s+name="([^"]+)">([\s\S]*?)</prose_style>', re.I)
NAME_RE = re.compile(r"^#\s*NBS Template:\s*(.+)$", re.M)

# JS factory template files (library/templates/*.js): capsule bodies are
# `const NAME = \`...\`;` template literals, referenced by variable name from
# a window.NBS.registerDefaultTemplate('Template Name', { capsules: [...] })
# call. Opening these directly lets the desktop editor work on the shipped
# defaults without a separate export/import round trip.
JS_CONST_RE = re.compile(r"const\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*`([\s\S]*?)`\s*;")
JS_REGISTER_RE = re.compile(
    r"registerDefaultTemplate\(\s*'([^']+)'\s*,\s*\{\s*capsules:\s*\[([\s\S]*?)\]\s*,?\s*\}\s*,?\s*\)")
JS_CAPSULE_ENTRY_RE = re.compile(
    r"\{\s*label:\s*'([^']+)'\s*,\s*trigger:\s*'([^']*)'\s*,\s*body:\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}")


# ── Format (parse / serialize / validate) — plain-text <capsule> format ───

def unescape(value: str) -> str:
    return value.replace("&quot;", '"')


def escape(value: str) -> str:
    return value.replace('"', "&quot;")


def parse_js_factory_template(text: str):
    """Parse a library/templates/*.js factory file. Returns (name, capsules) or None."""
    reg = JS_REGISTER_RE.search(text)
    if not reg:
        return None
    consts = {m.group(1): m.group(2).strip() for m in JS_CONST_RE.finditer(text)}
    name = reg.group(1).strip()
    capsules = []
    for m in JS_CAPSULE_ENTRY_RE.finditer(reg.group(2)):
        label, trigger, varname = m.group(1).strip().lower(), m.group(2).strip(), m.group(3)
        capsules.append({"label": label, "trigger": trigger, "body": consts.get(varname, "")})
    if not capsules:
        return None
    return name, capsules


def parse_template(text: str):
    """Return (name, [ {label, trigger, body}, ... ]). Raises ValueError."""
    text = text.strip()
    if not text:
        raise ValueError("The file is empty.")
    match = NAME_RE.search(text)
    name = match.group(1).strip() if match else "Imported template"

    capsules = []
    for m in CAPSULE_RE.finditer(text):
        capsules.append({
            "label": unescape(m.group(1)).strip().lower(),
            "trigger": unescape(m.group(2)).strip(),
            "body": m.group(3).strip(),
        })

    if not capsules:  # legacy <prose_style> library
        for m in PROSE_STYLE_RE.finditer(text):
            capsules.append({
                "label": m.group(1).strip().lower(),
                "trigger": "",
                "body": m.group(2).strip(),
            })

    if not capsules:  # library/templates/*.js factory file
        js_result = parse_js_factory_template(text)
        if js_result:
            return js_result

    if not capsules:
        raise ValueError(
            "No <capsule>, <prose_style>, or registerDefaultTemplate(...) blocks found.")
    return name, capsules


def serialize_template(name: str, capsules) -> str:
    blocks = []
    for cap in capsules:
        blocks.append(
            f'<capsule label="{escape(cap["label"])}" trigger="{escape(cap["trigger"])}">\n'
            f'{cap["body"].strip()}\n'
            f"</capsule>"
        )
    return f"# NBS Template: {name}\n\n" + "\n\n".join(blocks) + "\n"


def validate(name: str, capsules):
    """Return (errors, warnings) as lists of strings."""
    errors, warnings = [], []
    if not name.strip():
        errors.append("The template needs a name.")
    if not capsules:
        errors.append("The template needs at least one capsule.")
    seen = set()
    for i, cap in enumerate(capsules, 1):
        label = cap["label"]
        where = f'capsule {i} ("{label or "?"}")'
        if label == "none":
            errors.append(f'{where}: "none" is a reserved label.')
        elif not LABEL_RE.match(label):
            errors.append(
                f"{where}: invalid label — lowercase letters, digits, - and _ only.")
        if label in seen:
            errors.append(f"{where}: duplicate label.")
        seen.add(label)
        if not cap["trigger"].strip():
            warnings.append(f"{where}: empty trigger — the classifier won't know when to pick it.")
        if len(cap["trigger"]) > 200:
            warnings.append(f"{where}: trigger over 200 chars — keep triggers to one line.")
        if not cap["body"].strip():
            warnings.append(f"{where}: empty body.")
        if len(cap["body"]) > 4000:
            warnings.append(f"{where}: body over 4000 chars — large capsules bloat chat saves.")
    if "generic" not in seen:
        warnings.append('No "generic" capsule — a fallback one will be added automatically.')
    return errors, warnings


def normalize_capsules(capsules, fallback_generic=None):
    """Mirror the extension's Templates.normalizeTemplate(): lowercase/trim/dedupe
    labels, drop 'none' and empties, synthesize a 'generic' fallback if missing."""
    out = []
    seen = set()
    for cap in capsules:
        label = str(cap.get("label", "")).strip().lower()
        if not label or label == "none" or label in seen:
            continue
        seen.add(label)
        out.append({
            "label": label,
            "trigger": str(cap.get("trigger", "")).strip(),
            "body": str(cap.get("body", "")),
        })
    if "generic" not in seen:
        out.append(dict(fallback_generic) if fallback_generic else {
            "label": "generic", "trigger": "anything else / ordinary continuation",
            "body": "Default narration instructions. This capsule is the fallback when no other style fits.",
        })
    return out


NEW_CAPSULE_BODY = """Describe how the GM should write (or what rules to apply) when this beat is active.

Free text — style directives, game rules, formatting demands, anything.
"""

STARTER_CAPSULES = [
    {"label": "generic", "trigger": "anything else / ordinary continuation",
     "body": "Default narration instructions. This capsule is the fallback when no other style fits."},
]


# ── SillyTavern disk store ────────────────────────────────────────────────
# The extension (src/templates.js) reads/writes exactly this JSON shape via
# the narrator-tools-storage server plugin, at boot only (no polling/hot
# reload) — so writing this file directly is equivalent to using the plugin's
# HTTP API, as long as SillyTavern isn't mid-write itself. Reload the
# SillyTavern tab after saving to pick up changes.

APP_DIR = Path(__file__).resolve().parent
CONFIG_PATH = APP_DIR / ".nbs_editor_config.json"
FACTORY_TEMPLATES_DIR = APP_DIR.parent / "library" / "templates"
TEMPLATE_STORE_FILE = "nbs_templates"  # -> nbs_templates.json on disk
DEFAULT_ST_USER = "default-user"
DEFAULT_ST_ROOT_GUESSES = [
    r"A:\app\SillyTavern\SillyTavern-Launcher\SillyTavern",
]


def load_config() -> dict:
    if CONFIG_PATH.exists():
        try:
            cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
            if isinstance(cfg, dict) and cfg.get("st_root"):
                cfg.setdefault("st_user", DEFAULT_ST_USER)
                return cfg
        except (OSError, ValueError):
            pass
    for guess in DEFAULT_ST_ROOT_GUESSES:
        if (Path(guess) / "data").is_dir():
            return {"st_root": guess, "st_user": DEFAULT_ST_USER}
    return {"st_root": "", "st_user": DEFAULT_ST_USER}


def save_config(cfg: dict) -> None:
    try:
        CONFIG_PATH.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    except OSError:
        pass


def template_store_path(cfg: dict):
    if not cfg.get("st_root"):
        return None
    return (Path(cfg["st_root"]) / "data" / cfg.get("st_user", DEFAULT_ST_USER)
            / "user" / "narrator_tools" / f"{TEMPLATE_STORE_FILE}.json")


def load_template_store(cfg: dict):
    """Return (doc, error_or_None). doc always has version/templates/activeTemplate."""
    empty = {"version": 1, "templates": {}, "activeTemplate": None}
    path = template_store_path(cfg)
    if not path or not path.exists():
        return empty, None
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as err:
        return empty, str(err)
    if not isinstance(doc, dict) or not isinstance(doc.get("templates"), dict):
        return empty, "File does not look like a template store (missing 'templates' object)."
    doc.setdefault("version", 1)
    doc.setdefault("activeTemplate", None)
    return doc, None


def save_template_store(cfg: dict, doc: dict) -> Path:
    path = template_store_path(cfg)
    if not path:
        raise ValueError("No SillyTavern folder configured yet.")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(doc, indent=2, ensure_ascii=False), encoding="utf-8")
    return path


def load_factory_templates() -> dict:
    """Return {template_name: [capsule, ...]} from library/templates/*.md."""
    out = {}
    if not FACTORY_TEMPLATES_DIR.is_dir():
        return out
    for md_file in sorted(FACTORY_TEMPLATES_DIR.glob("*.md")):
        try:
            name, capsules = parse_template(md_file.read_text(encoding="utf-8"))
            out[name] = capsules
        except (OSError, ValueError):
            continue
    return out


# ── GUI ───────────────────────────────────────────────────────────────────

class EditorApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("NBS Template Editor")
        self.root.geometry("1040x660")
        self.root.minsize(820, 500)
        apply_theme(self.root)
        apply_windows_dark_titlebar(self.root)

        self.config = load_config()
        self.factory_templates = load_factory_templates()
        self.store_doc, err = load_template_store(self.config)
        self._template_names = []
        self.capsules = []
        self.current_index = None
        self.loaded_template_name = None
        self.dirty = False

        self._build_ui()
        if err:
            self.status_var.set(f"Could not read the existing template store: {err}")
        self.update_st_folder_label()
        self.refresh_template_list()
        self.new_template(confirm=False)
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

    # ── layout ──

    def _build_ui(self):
        titlebar = ttk.Frame(self.root, style="Titlebar.TFrame", padding=(14, 9))
        titlebar.pack(fill="x")
        ttk.Label(titlebar, text="NBS Template Editor", style="Title.TLabel").pack(side="left")

        top = ttk.Frame(self.root, padding=(8, 8, 8, 4))
        top.pack(fill="x")
        ttk.Button(top, text="New Template", command=self.new_template).pack(side="left")
        ttk.Button(top, text="Open…", command=self.open_file).pack(side="left", padx=(4, 0))
        ttk.Button(top, text="Save", style="Accent.TButton",
                   command=self.save_to_sillytavern).pack(side="left", padx=(12, 0))

        self.st_folder_var = tk.StringVar()
        ttk.Label(top, textvariable=self.st_folder_var, style="Muted.TLabel").pack(side="left", padx=(16, 4))
        ttk.Button(top, text="Change…", command=self.change_st_folder).pack(side="left")

        name_row = ttk.Frame(self.root, padding=(8, 0, 8, 4))
        name_row.pack(fill="x")
        ttk.Label(name_row, text="Template name:").pack(side="left")
        self.name_var = tk.StringVar()
        self.name_var.trace_add("write", lambda *_: self.mark_dirty())
        ttk.Entry(name_row, textvariable=self.name_var).pack(side="left", fill="x", expand=True, padx=(6, 0))

        main = ttk.Frame(self.root, padding=8)
        main.pack(fill="both", expand=True)
        main.columnconfigure(1, weight=1)
        main.rowconfigure(0, weight=1)

        # left column: template picker + capsule picker
        left = ttk.Frame(main)
        left.grid(row=0, column=0, sticky="nsw", padx=(0, 8))

        ttk.Label(left, text="Templates in SillyTavern", style="Muted.TLabel").pack(anchor="w")
        self.template_listbox = tk.Listbox(left, width=26, height=8, exportselection=False,
                                            font=("Segoe UI", 10), **LISTBOX_OPTS)
        self.template_listbox.pack(fill="x", pady=(4, 0))
        self.template_listbox.bind("<<ListboxSelect>>", self.on_template_select)

        tpl_btns = ttk.Frame(left)
        tpl_btns.pack(fill="x", pady=(4, 0))
        ttk.Button(tpl_btns, text="Delete", style="Danger.TButton",
                   command=self.delete_template_from_store).pack(side="left")

        ttk.Separator(left, orient="horizontal").pack(fill="x", pady=10)

        ttk.Label(left, text="Capsules (styles)", style="Muted.TLabel").pack(anchor="w")
        self.listbox = tk.Listbox(left, width=26, exportselection=False, font=("Segoe UI", 10), **LISTBOX_OPTS)
        self.listbox.pack(fill="both", expand=True, pady=(4, 0))
        self.listbox.bind("<<ListboxSelect>>", self.on_select)

        btns = ttk.Frame(left)
        btns.pack(fill="x", pady=(4, 0))
        ttk.Button(btns, text="Add", width=6, command=self.add_capsule).pack(side="left")
        ttk.Button(btns, text="Delete", width=6, style="Danger.TButton", command=self.delete_capsule).pack(side="left", padx=2)
        ttk.Button(btns, text="▲", width=3, command=lambda: self.move_capsule(-1)).pack(side="left")
        ttk.Button(btns, text="▼", width=3, command=lambda: self.move_capsule(1)).pack(side="left", padx=2)

        # right column: capsule fields
        right = ttk.Frame(main)
        right.grid(row=0, column=1, sticky="nsew")
        right.columnconfigure(1, weight=1)
        right.rowconfigure(3, weight=1)

        ttk.Label(right, text="Label").grid(row=0, column=0, sticky="w")
        self.label_var = tk.StringVar()
        self.label_var.trace_add("write", lambda *_: self.on_field_edit())
        ttk.Entry(right, textvariable=self.label_var).grid(row=0, column=1, sticky="ew", pady=2)
        ttk.Label(right, style="Muted.TLabel",
                  text="lowercase: a-z, 0-9, -, _   ('none' is reserved)").grid(row=0, column=2, sticky="w", padx=6)

        ttk.Label(right, text="Trigger").grid(row=1, column=0, sticky="w")
        self.trigger_var = tk.StringVar()
        self.trigger_var.trace_add("write", lambda *_: self.on_field_edit())
        ttk.Entry(right, textvariable=self.trigger_var).grid(row=1, column=1, sticky="ew", pady=2)
        ttk.Label(right, style="Muted.TLabel",
                  text="one line: when should the classifier pick this style?").grid(row=1, column=2, sticky="w", padx=6)

        ttk.Label(right, text="Body — the instructions injected into the prompt (free text, any format):").grid(
            row=2, column=0, columnspan=3, sticky="w", pady=(8, 2))
        body_frame = ttk.Frame(right)
        body_frame.grid(row=3, column=0, columnspan=3, sticky="nsew")
        body_frame.columnconfigure(0, weight=1)
        body_frame.rowconfigure(0, weight=1)
        self.body_text = tk.Text(body_frame, wrap="word", undo=True, font=("Consolas", 10),
                                  padx=8, pady=6, **TEXT_WIDGET_OPTS)
        self.body_text.grid(row=0, column=0, sticky="nsew")
        scroll = ttk.Scrollbar(body_frame, command=self.body_text.yview)
        scroll.grid(row=0, column=1, sticky="ns")
        self.body_text.configure(yscrollcommand=scroll.set)
        self.body_text.bind("<<Modified>>", self.on_body_modified)

        bottom = ttk.Frame(self.root, padding=(8, 2))
        bottom.pack(fill="x", side="bottom")
        self.status_var = tk.StringVar(value="Ready.")
        ttk.Label(bottom, textvariable=self.status_var, style="Muted.TLabel").pack(
            side="left", fill="x", expand=True)
        ttk.Button(bottom, text="Export…", command=self.export_as_file).pack(side="right")
        ttk.Button(bottom, text="Copy", command=self.copy_to_clipboard).pack(side="right", padx=(0, 4))

    # ── SillyTavern folder / template store ──

    def update_st_folder_label(self):
        root = self.config.get("st_root") or "(not set)"
        self.st_folder_var.set(f"SillyTavern: {root}")

    def prompt_for_st_root(self) -> bool:
        messagebox.showinfo(
            "Locate SillyTavern",
            "Select your SillyTavern installation folder — the one that contains "
            "config.yaml and a 'data' folder.")
        path = filedialog.askdirectory(title="Select SillyTavern folder")
        if not path:
            return False
        if not (Path(path) / "data").is_dir():
            if not messagebox.askyesno(
                    "Folder looks unusual",
                    "This folder doesn't contain a 'data' subfolder — SillyTavern "
                    "installs normally do. Use it anyway?"):
                return False
        self.config["st_root"] = path
        self.config["st_user"] = self.config.get("st_user", DEFAULT_ST_USER)
        save_config(self.config)
        self.reload_store_and_factory()
        return True

    def change_st_folder(self):
        self.prompt_for_st_root()

    def reload_store_and_factory(self):
        self.store_doc, err = load_template_store(self.config)
        if err:
            messagebox.showwarning(
                "Template store",
                f"Could not read the existing template file:\n{err}\n\n"
                "Starting from an empty store — nothing on disk will be overwritten "
                "until you Save.")
        self.update_st_folder_label()
        self.refresh_template_list()

    # ── template list (left panel, top) ──

    def refresh_template_list(self):
        self.template_listbox.delete(0, "end")
        self._template_names = []
        store_names = set(self.store_doc.get("templates", {}).keys())
        all_names = sorted(store_names | set(self.factory_templates.keys()), key=str.lower)
        for name in all_names:
            suffix = "" if name in store_names else "  (default)"
            self.template_listbox.insert("end", f"{name}{suffix}")
            self._template_names.append(name)
        if self.loaded_template_name in self._template_names:
            idx = self._template_names.index(self.loaded_template_name)
            self.template_listbox.selection_set(idx)
            self.template_listbox.see(idx)

    def on_template_select(self, _event=None):
        sel = self.template_listbox.curselection()
        if not sel:
            return
        name = self._template_names[sel[0]]
        if name == self.loaded_template_name:
            return
        self.load_template_by_name(name)

    def load_template_by_name(self, name: str):
        if not self.confirm_discard():
            self.refresh_template_list()  # restore selection highlight
            return
        store_templates = self.store_doc.get("templates", {})
        if name in store_templates:
            capsules = [dict(c) for c in store_templates[name].get("capsules", [])]
            source = "saved"
        else:
            capsules = [dict(c) for c in self.factory_templates.get(name, [])]
            source = "factory"
        if not capsules:
            capsules = [dict(STARTER_CAPSULES[0])]
        self.capsules = capsules
        self.name_var.set(name)
        self.loaded_template_name = name
        self.current_index = 0
        self.refresh_list(keep=0)
        self.load_fields(0)
        self.dirty = False
        self.refresh_template_list()
        self.update_title()
        if source == "saved":
            self.status_var.set(f'Loaded "{name}" from SillyTavern ({len(capsules)} capsules).')
        else:
            self.status_var.set(
                f'Loaded built-in default "{name}" ({len(capsules)} capsules) — '
                'not yet saved to SillyTavern; click "Save to SillyTavern" to make it live.')

    def delete_template_from_store(self):
        sel = self.template_listbox.curselection()
        if not sel:
            messagebox.showinfo("Nothing selected", "Select a template in the list first.")
            return
        name = self._template_names[sel[0]]
        store_templates = self.store_doc.get("templates", {})
        if name not in store_templates:
            messagebox.showinfo(
                "Nothing to delete",
                f'"{name}" is a built-in default and has not been saved to SillyTavern '
                'yet — there is nothing to delete.')
            return
        if not messagebox.askyesno("Delete template", f'Delete "{name}" from SillyTavern?'):
            return
        del store_templates[name]
        if self.store_doc.get("activeTemplate") == name:
            self.store_doc["activeTemplate"] = next(iter(store_templates), None)
        try:
            save_template_store(self.config, self.store_doc)
        except (OSError, ValueError) as err:
            messagebox.showerror("Delete failed", str(err))
            return
        if self.loaded_template_name == name:
            self.loaded_template_name = None
        self.refresh_template_list()
        self.status_var.set(f'Deleted "{name}" from SillyTavern. Reload SillyTavern (F5) to apply.')

    # ── model/view sync (capsule editor) ──

    def mark_dirty(self):
        self.dirty = True
        self.update_title()

    def update_title(self):
        name = self.name_var.get().strip() or "untitled"
        star = " *" if self.dirty else ""
        self.root.title(f"NBS Template Editor — {name}{star}")

    def refresh_list(self, keep=None):
        self.listbox.delete(0, "end")
        for cap in self.capsules:
            self.listbox.insert("end", cap["label"] or "(unnamed)")
        if keep is not None and 0 <= keep < len(self.capsules):
            self.listbox.selection_set(keep)
            self.current_index = keep
        self.update_title()

    def store_current_fields(self):
        if self.current_index is None or self.current_index >= len(self.capsules):
            return
        cap = self.capsules[self.current_index]
        cap["label"] = self.label_var.get().strip().lower()
        cap["trigger"] = self.trigger_var.get().strip()
        cap["body"] = self.body_text.get("1.0", "end-1c")

    def load_fields(self, index):
        self._loading = True
        cap = self.capsules[index]
        self.label_var.set(cap["label"])
        self.trigger_var.set(cap["trigger"])
        self.body_text.delete("1.0", "end")
        self.body_text.insert("1.0", cap["body"])
        self.body_text.edit_modified(False)
        self._loading = False

    def on_select(self, _event=None):
        selection = self.listbox.curselection()
        if not selection:
            return
        self.store_current_fields()
        self.current_index = selection[0]
        self.load_fields(self.current_index)
        self.refresh_list(keep=self.current_index)

    def on_field_edit(self):
        if getattr(self, "_loading", False):
            return
        if self.current_index is not None and self.current_index < len(self.capsules):
            cap = self.capsules[self.current_index]
            cap["label"] = self.label_var.get().strip().lower()
            cap["trigger"] = self.trigger_var.get().strip()
            self.listbox.delete(self.current_index)
            self.listbox.insert(self.current_index, cap["label"] or "(unnamed)")
            self.listbox.selection_set(self.current_index)
        self.mark_dirty()

    def on_body_modified(self, _event=None):
        if getattr(self, "_loading", False):
            self.body_text.edit_modified(False)
            return
        if self.body_text.edit_modified():
            if self.current_index is not None and self.current_index < len(self.capsules):
                self.capsules[self.current_index]["body"] = self.body_text.get("1.0", "end-1c")
            self.mark_dirty()
            self.body_text.edit_modified(False)

    def confirm_discard(self):
        if not self.dirty:
            return True
        return messagebox.askyesno("Unsaved changes", "Discard unsaved changes?")

    # ── actions ──

    def new_template(self, confirm=True):
        if confirm and not self.confirm_discard():
            return
        self.capsules = [dict(c) for c in STARTER_CAPSULES]
        self.name_var.set("My New Template")
        self.loaded_template_name = None
        self.current_index = 0
        self.refresh_list(keep=0)
        self.load_fields(0)
        self.dirty = False
        self.refresh_template_list()
        self.update_title()
        self.status_var.set(
            'New template. Fill in the name and capsules, then click "Save to SillyTavern".')

    def add_capsule(self):
        self.store_current_fields()
        n = len(self.capsules) + 1
        labels = {c["label"] for c in self.capsules}
        while f"new-style-{n}" in labels:
            n += 1
        self.capsules.append({"label": f"new-style-{n}", "trigger": "", "body": NEW_CAPSULE_BODY})
        self.refresh_list(keep=len(self.capsules) - 1)
        self.load_fields(len(self.capsules) - 1)
        self.mark_dirty()

    def delete_capsule(self):
        if self.current_index is None or len(self.capsules) <= 1:
            messagebox.showinfo("Not possible", "A template needs at least one capsule.")
            return
        cap = self.capsules[self.current_index]
        if not messagebox.askyesno("Delete capsule", f'Delete "{cap["label"]}"?'):
            return
        del self.capsules[self.current_index]
        self.current_index = 0
        self.refresh_list(keep=0)
        self.load_fields(0)
        self.mark_dirty()

    def move_capsule(self, delta):
        i = self.current_index
        if i is None:
            return
        j = i + delta
        if not (0 <= j < len(self.capsules)):
            return
        self.store_current_fields()
        self.capsules[i], self.capsules[j] = self.capsules[j], self.capsules[i]
        self.refresh_list(keep=j)
        self.current_index = j
        self.mark_dirty()

    def open_file(self):
        if not self.confirm_discard():
            return
        path = filedialog.askopenfilename(
            title="Open template file",
            filetypes=[
                ("NBS template (text or .js factory file)", "*.txt *.md *.js"),
                ("All files", "*.*"),
            ])
        if not path:
            return
        try:
            with open(path, "r", encoding="utf-8") as fh:
                name, capsules = parse_template(fh.read())
        except (OSError, ValueError) as err:
            messagebox.showerror("Open failed", str(err))
            return
        self.capsules = capsules
        self.name_var.set(name)
        self.loaded_template_name = None  # imported, not tied to a saved entry yet
        self.current_index = 0
        self.refresh_list(keep=0)
        self.load_fields(0)
        self.dirty = True
        self.refresh_template_list()
        self.update_title()
        self.status_var.set(
            f'Imported "{name}" ({len(capsules)} capsules) from {path} — '
            'click "Save to SillyTavern" to make it available.')

    def _get_fallback_generic(self):
        for caps in self.factory_templates.values():
            for cap in caps:
                if cap["label"] == "generic":
                    return cap
        return None

    def _validated_capsules(self):
        """Validate current editor state. Returns (name, normalized_capsules) or None."""
        self.store_current_fields()
        name = self.name_var.get().strip()
        errors, warnings = validate(name, self.capsules)
        if errors:
            messagebox.showerror("Cannot save", "\n".join(errors))
            return None
        if warnings and not messagebox.askyesno(
                "Warnings", "\n".join(warnings) + "\n\nContinue anyway?"):
            return None
        return name, normalize_capsules(self.capsules, self._get_fallback_generic())

    def save_to_sillytavern(self):
        result = self._validated_capsules()
        if result is None:
            return
        name, capsules = result
        if not self.config.get("st_root"):
            if not self.prompt_for_st_root():
                return
        self.store_doc.setdefault("templates", {})[name] = {"capsules": capsules}
        if not self.store_doc.get("activeTemplate"):
            self.store_doc["activeTemplate"] = name
        try:
            path = save_template_store(self.config, self.store_doc)
        except (OSError, ValueError) as err:
            messagebox.showerror("Save failed", str(err))
            return
        self.loaded_template_name = name
        self.dirty = False
        self.refresh_template_list()
        self.update_title()
        self.status_var.set(
            f'Saved "{name}". Reload the SillyTavern tab (F5) and it appears in the template list.')

    def export_as_file(self):
        result = self._validated_capsules()
        if result is None:
            return
        name, capsules = result
        default = (name or "template").replace(" ", "_").lower()
        path = filedialog.asksaveasfilename(
            title="Export template as text",
            defaultextension=".txt",
            initialfile=f"{default}.txt",
            filetypes=[("NBS template", "*.txt"), ("All files", "*.*")])
        if not path:
            return
        try:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(serialize_template(name, capsules))
        except OSError as err:
            messagebox.showerror("Export failed", str(err))
            return
        self.status_var.set(f"Exported to {path}.")

    def copy_to_clipboard(self):
        result = self._validated_capsules()
        if result is None:
            return
        name, capsules = result
        text = serialize_template(name, capsules)
        self.root.clipboard_clear()
        self.root.clipboard_append(text)
        self.status_var.set("Copied as text to the clipboard.")

    def on_close(self):
        if self.confirm_discard():
            self.root.destroy()


# ── selftest (no GUI) ─────────────────────────────────────────────────────

def selftest():
    import tempfile

    caps = [
        {"label": "combat", "trigger": 'say "fight"', "body": "Line one.\nLine two."},
        {"label": "generic", "trigger": "anything else", "body": "Default."},
    ]
    text = serialize_template("Test Template", caps)
    name, parsed = parse_template(text)
    assert name == "Test Template", name
    assert parsed == caps, parsed

    legacy = '<prose_style name="Clash">\nBEAT: x\n</prose_style>'
    _, parsed2 = parse_template(legacy)
    assert parsed2[0]["label"] == "clash" and parsed2[0]["body"] == "BEAT: x"

    errors, warnings = validate("T", [{"label": "none", "trigger": "", "body": ""}])
    assert any("reserved" in e for e in errors)
    assert any("generic" in w for w in warnings)

    errors, _ = validate("T", [{"label": "Bad Label", "trigger": "x", "body": "y"},
                               {"label": "generic", "trigger": "x", "body": "y"}])
    assert any("invalid label" in e for e in errors)

    normalized = normalize_capsules([
        {"label": "None", "trigger": "x", "body": "y"},
        {"label": "Combat", "trigger": "a", "body": "b"},
        {"label": "combat", "trigger": "dup", "body": "dup"},
    ])
    assert [c["label"] for c in normalized] == ["combat", "generic"], normalized

    with tempfile.TemporaryDirectory() as tmp:
        cfg = {"st_root": tmp, "st_user": "default-user"}
        path = template_store_path(cfg)
        assert str(path).endswith(str(Path("data") / "default-user" / "user" / "narrator_tools" / "nbs_templates.json"))

        doc, err = load_template_store(cfg)
        assert err is None and doc == {"version": 1, "templates": {}, "activeTemplate": None}

        doc["templates"]["My Template"] = {"capsules": caps}
        doc["activeTemplate"] = "My Template"
        written_path = save_template_store(cfg, doc)
        assert written_path.exists()

        doc2, err2 = load_template_store(cfg)
        assert err2 is None
        assert doc2["templates"]["My Template"]["capsules"] == caps
        assert doc2["activeTemplate"] == "My Template"

    factory = load_factory_templates()
    assert set(factory.keys()) == {"Literary Prose", "D&D Mechanics", "Legacy v1", "Genre Chameleon"}, factory.keys()
    assert len(factory["Literary Prose"]) == 11
    assert len(factory["D&D Mechanics"]) == 9
    assert len(factory["Legacy v1"]) == 11
    assert len(factory["Genre Chameleon"]) == 11
    assert all(c["trigger"] for c in factory["D&D Mechanics"]), "D&D Mechanics has an empty trigger"
    assert all(c["trigger"] for c in factory["Genre Chameleon"]), "Genre Chameleon has an empty trigger"

    print("selftest OK")


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        selftest()
        sys.exit(0)
    app_root = tk.Tk()
    EditorApp(app_root)
    app_root.mainloop()
