{
  "product": {
    "name": "Waypoint Studio",
    "tagline": "Plan, profile, export — routes that feel engineered.",
    "brand_attributes": [
      "professional",
      "outdoor-technical",
      "calm + precise",
      "performance-minded",
      "trustworthy"
    ],
    "design_north_star": "Map-first workspace: the map is the canvas, the sidebar is the instrument panel, and the elevation panel is the analysis bench."
  },
  "visual_personality": {
    "style_fusion": [
      "Swiss-style information hierarchy (tight typographic system, clear grids)",
      "Bento utility panels (compact cards, dense but breathable)",
      "Soft glass utility surfaces (only for overlays/panels, never for reading-heavy areas)",
      "Topo-line texture accents (subtle, low-contrast)"
    ],
    "do_not": [
      "Do not mimic RouteYou’s visual language (avoid heavy skeuomorphic map controls, dated gradients, or cramped lists).",
      "Do not center-align the app container.",
      "Do not use purple in any UI element.",
      "Do not use universal transitions (no transition: all)."
    ]
  },
  "color_system": {
    "palette_source_user": {
      "primary_green": "#20BF55",
      "dark_teal": "#0B4F6C",
      "highlight_blue": "#01BAEF",
      "background_offwhite": "#FBFBFF",
      "neutral_gray": "#757575"
    },
    "semantic_tokens": {
      "note": "Implement via CSS variables in index.css :root using HSL values for shadcn tokens, plus extra hex vars for map/chart accents.",
      "css_custom_properties": {
        "--ws-bg": "#FBFBFF",
        "--ws-surface": "#FFFFFF",
        "--ws-surface-2": "#F3F6FA",
        "--ws-text": "#071A22",
        "--ws-text-muted": "#757575",
        "--ws-teal": "#0B4F6C",
        "--ws-green": "#20BF55",
        "--ws-blue": "#01BAEF",
        "--ws-border": "rgba(11, 79, 108, 0.14)",
        "--ws-ring": "rgba(1, 186, 239, 0.35)",
        "--ws-shadow": "0 10px 30px rgba(11, 79, 108, 0.10)",
        "--ws-shadow-tight": "0 6px 18px rgba(11, 79, 108, 0.12)",
        "--ws-danger": "#E5484D",
        "--ws-warning": "#F5A524",
        "--ws-success": "#20BF55"
      },
      "shadcn_hsl_tokens_light": {
        "--background": "240 100% 99%",
        "--foreground": "196 67% 9%",
        "--card": "0 0% 100%",
        "--card-foreground": "196 67% 9%",
        "--popover": "0 0% 100%",
        "--popover-foreground": "196 67% 9%",
        "--primary": "142 71% 44%",
        "--primary-foreground": "0 0% 100%",
        "--secondary": "200 35% 95%",
        "--secondary-foreground": "196 67% 14%",
        "--muted": "210 25% 95%",
        "--muted-foreground": "0 0% 46%",
        "--accent": "195 82% 23%",
        "--accent-foreground": "0 0% 100%",
        "--destructive": "358 74% 56%",
        "--destructive-foreground": "0 0% 100%",
        "--border": "195 35% 86%",
        "--input": "195 35% 86%",
        "--ring": "194 99% 47%",
        "--radius": "0.75rem"
      },
      "chart_tokens": {
        "--chart-1": "142 71% 44%",
        "--chart-2": "194 99% 47%",
        "--chart-3": "195 82% 23%",
        "--chart-4": "210 10% 55%",
        "--chart-5": "210 20% 25%"
      }
    },
    "gradient_policy": {
      "GRADIENT_RESTRICTION_RULE": {
        "never": [
          "NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.",
          "NEVER let gradients cover more than 20% of the viewport.",
          "NEVER apply gradients to text-heavy content or reading areas.",
          "NEVER use gradients on small UI elements (<100px width).",
          "NEVER stack multiple gradient layers in the same viewport."
        ],
        "enforcement": "IF gradient area exceeds 20% of viewport OR impacts readability THEN fallback to solid colors.",
        "allowed_usage": [
          "Hero header strip behind top app bar only (thin, <= 72px height)",
          "Decorative corner glow behind sidebar header",
          "Map overlay scrim behind floating controls"
        ],
        "approved_gradients": {
          "topbar_mist": "linear-gradient(90deg, rgba(32,191,85,0.14) 0%, rgba(1,186,239,0.12) 55%, rgba(11,79,108,0.10) 100%)",
          "sidebar_corner_glow": "radial-gradient(600px circle at 20% 0%, rgba(1,186,239,0.14), transparent 55%), radial-gradient(600px circle at 80% 10%, rgba(32,191,85,0.12), transparent 55%)"
        }
      }
    }
  },
  "typography": {
    "fonts": {
      "heading": {
        "family": "Space Grotesk",
        "fallback": "ui-sans-serif, system-ui",
        "usage": "App title, panel headings, key stats"
      },
      "body": {
        "family": "Inter",
        "fallback": "ui-sans-serif, system-ui",
        "usage": "Lists, forms, helper text"
      },
      "mono": {
        "family": "IBM Plex Mono",
        "usage": "Coordinate readouts, distance units, debug/precision values"
      },
      "google_fonts_import": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap"
    },
    "type_scale_tailwind": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight",
      "panel_title": "text-sm font-semibold tracking-tight",
      "section_label": "text-xs font-medium uppercase tracking-wider text-muted-foreground",
      "body": "text-sm md:text-base",
      "small": "text-xs text-muted-foreground"
    },
    "numbers": {
      "stat_value": "font-semibold tabular-nums",
      "stat_unit": "text-xs text-muted-foreground"
    }
  },
  "layout_and_grid": {
    "app_shell": {
      "desktop": "CSS grid: [sidebar 360-420px] [map 1fr]; elevation panel docks bottom over map.",
      "mobile": "Map full-screen; sidebar becomes Sheet/Drawer; elevation panel becomes Drawer from bottom.",
      "recommended_structure": [
        "Top App Bar (48–56px)",
        "Left Sidebar (instrument panel)",
        "Map Canvas (dominant)",
        "Bottom Elevation Panel (collapsible)"
      ]
    },
    "spacing": {
      "principle": "Use 2–3x more spacing than feels comfortable; dense data is grouped into cards with internal padding.",
      "tokens": {
        "--ws-space-1": "4px",
        "--ws-space-2": "8px",
        "--ws-space-3": "12px",
        "--ws-space-4": "16px",
        "--ws-space-5": "24px",
        "--ws-space-6": "32px"
      }
    },
    "bento_cards": {
      "card_padding": "p-3 sm:p-4",
      "card_radius": "rounded-xl",
      "card_border": "border border-[color:var(--ws-border)]",
      "card_shadow": "shadow-[var(--ws-shadow-tight)]"
    }
  },
  "components": {
    "component_path": {
      "shadcn_primary": "/app/frontend/src/components/ui",
      "use_these": [
        "button.jsx",
        "card.jsx",
        "sheet.jsx",
        "drawer.jsx",
        "dialog.jsx",
        "select.jsx",
        "tabs.jsx",
        "scroll-area.jsx",
        "separator.jsx",
        "tooltip.jsx",
        "toggle-group.jsx",
        "badge.jsx",
        "slider.jsx",
        "sonner.jsx"
      ]
    },
    "top_app_bar": {
      "layout": "Left: logo + name; Center: route name editable; Right: quick actions (Undo/Redo, Snap-to-road toggle, Export).",
      "classes": "h-14 px-3 sm:px-4 flex items-center gap-3 border-b bg-[color:var(--ws-surface)]/85 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--ws-surface)]/70",
      "micro_interactions": [
        "Route name input: focus ring uses --ws-ring",
        "Quick actions: tooltip on hover; pressed scale 0.98"
      ],
      "testids": {
        "route-name-input": "route-name-input",
        "export-gpx-button": "export-gpx-button",
        "snap-to-road-toggle": "snap-to-road-toggle",
        "undo-button": "undo-button",
        "redo-button": "redo-button"
      }
    },
    "sidebar": {
      "behavior": {
        "desktop": "Fixed left column with ScrollArea; sections collapse via Collapsible.",
        "mobile": "Open via floating button -> Sheet from left."
      },
      "sections": [
        {
          "name": "Activity",
          "ui": "Select or ToggleGroup (Cycling / Running)",
          "testid": "activity-type-selector"
        },
        {
          "name": "Waypoints",
          "ui": "Scrollable list with reorder (optional later), each row has drag handle icon, distance from start, delete",
          "testid": "waypoint-list"
        },
        {
          "name": "Stats",
          "ui": "Compact stat cards (Distance, Duration, Gain/Loss)",
          "testid": "route-stats"
        },
        {
          "name": "Actions",
          "ui": "Save / Load / Export buttons",
          "testid": "route-actions"
        }
      ],
      "classes": "w-[360px] max-w-[92vw] h-[calc(100vh-3.5rem)] border-r bg-[color:var(--ws-surface)]/92 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--ws-surface)]/75",
      "sidebar_header_accent": "bg-[image:var(--ws-sidebar-glow)]",
      "testids": {
        "save-route-button": "save-route-button",
        "load-route-button": "load-route-button",
        "clear-route-button": "clear-route-button"
      }
    },
    "map_controls": {
      "pattern": "Floating control cluster top-right over map (not Leaflet default).",
      "ui": "Card + Button (icon-only) + Tooltip",
      "classes": "absolute top-3 right-3 z-[1000] flex flex-col gap-2",
      "control_card": "rounded-xl border bg-[color:var(--ws-surface)]/90 backdrop-blur shadow-[var(--ws-shadow-tight)] p-1",
      "buttons": {
        "base": "h-9 w-9",
        "hover": "hover:bg-[color:var(--ws-surface-2)]",
        "focus": "focus-visible:ring-2 focus-visible:ring-[color:var(--ws-ring)]"
      },
      "testids": {
        "zoom-in-button": "zoom-in-button",
        "zoom-out-button": "zoom-out-button",
        "locate-button": "locate-button",
        "fit-route-button": "fit-route-button"
      }
    },
    "elevation_panel": {
      "behavior": {
        "desktop": "Collapsible bottom panel over map; default collapsed to a 44px handle.",
        "mobile": "Drawer from bottom with snap points (25%, 60%)."
      },
      "ui": "Resizable (optional) + Tabs (Elevation / Surface later) + Recharts LineChart",
      "classes": "absolute left-0 right-0 bottom-0 z-[900]",
      "panel_surface": "rounded-t-2xl border-t bg-[color:var(--ws-surface)]/92 backdrop-blur shadow-[var(--ws-shadow)]",
      "chart_style": {
        "line": "stroke: var(--ws-teal); strokeWidth: 2.25",
        "area_fill": "rgba(32,191,85,0.10)",
        "grid": "rgba(11,79,108,0.10)",
        "cursor": "Custom vertical cursor line in --ws-blue; show tooltip with elevation + distance"
      },
      "micro_interactions": [
        "Scrub chart: hovering moves a marker on the route polyline (sync map <-> chart).",
        "Panel handle: hover highlights; click toggles open/close; drag to resize (desktop optional)."
      ],
      "testids": {
        "elevation-panel": "elevation-panel",
        "elevation-panel-toggle": "elevation-panel-toggle",
        "elevation-chart": "elevation-chart"
      }
    },
    "route_management_modals": {
      "ui": "Dialog for Save/Load; Table for saved routes; Input for route name; Button actions",
      "testids": {
        "save-route-dialog": "save-route-dialog",
        "load-route-dialog": "load-route-dialog",
        "saved-routes-table": "saved-routes-table",
        "save-route-confirm-button": "save-route-confirm-button",
        "load-route-confirm-button": "load-route-confirm-button"
      }
    },
    "waypoint_row": {
      "layout": "Left: index badge; Middle: lat/lng (mono, truncated); Right: drag handle + delete",
      "classes": "flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-[color:var(--ws-surface-2)]",
      "states": {
        "active": "ring-2 ring-[color:var(--ws-ring)] bg-[color:var(--ws-surface-2)]",
        "dragging": "opacity-80 shadow-[var(--ws-shadow-tight)]"
      },
      "testids": {
        "waypoint-row": "waypoint-row-<index>",
        "waypoint-delete-button": "waypoint-delete-button-<index>",
        "waypoint-drag-handle": "waypoint-drag-handle-<index>"
      }
    }
  },
  "buttons": {
    "style": "Professional / Corporate with slight sport-tech edge",
    "tokens": {
      "--btn-radius": "12px",
      "--btn-shadow": "0 10px 22px rgba(11,79,108,0.14)",
      "--btn-press-scale": "0.98"
    },
    "variants": {
      "primary": {
        "usage": "Export GPX, Save Route",
        "classes": "bg-[color:var(--ws-green)] text-white hover:brightness-[0.98] focus-visible:ring-2 focus-visible:ring-[color:var(--ws-ring)]",
        "note": "No gradients on buttons (small element rule)."
      },
      "secondary": {
        "usage": "Load Route, Fit Route",
        "classes": "bg-[color:var(--ws-surface-2)] text-[color:var(--ws-teal)] border border-[color:var(--ws-border)] hover:bg-white"
      },
      "ghost": {
        "usage": "Icon-only map controls",
        "classes": "hover:bg-[color:var(--ws-surface-2)] text-[color:var(--ws-teal)]"
      },
      "destructive": {
        "usage": "Clear route",
        "classes": "bg-[color:var(--ws-danger)] text-white hover:brightness-[0.98]"
      }
    }
  },
  "motion_and_microinteractions": {
    "library": {
      "recommend": "framer-motion",
      "install": "npm i framer-motion",
      "use_cases": [
        "Sidebar section collapse",
        "Elevation panel slide/resize",
        "Waypoint add pulse + marker drop",
        "Toast entrance polish"
      ]
    },
    "principles": [
      "Fast UI: 120–180ms for hover/focus; 220–320ms for panels.",
      "Use easing: cubic-bezier(0.2, 0.8, 0.2, 1).",
      "Prefer transform + opacity animations only.",
      "Respect prefers-reduced-motion: reduce."
    ],
    "hover_states": {
      "buttons": "transition-[background-color,box-shadow,filter] duration-150",
      "cards": "transition-[box-shadow,border-color] duration-200 hover:shadow-[var(--ws-shadow)]",
      "list_rows": "transition-[background-color] duration-150"
    }
  },
  "map_specific_ui": {
    "leaflet_theming": {
      "marker": "Custom SVG marker: teal outline + green fill dot; active marker uses blue ring.",
      "polyline": {
        "route": "stroke: var(--ws-teal); weight: 4; opacity: 0.9",
        "route_outline": "stroke: rgba(251,251,255,0.9); weight: 7; opacity: 0.9 (drawn beneath for contrast)",
        "hover": "increase weight by +1 and add subtle blue glow"
      },
      "performance": [
        "For hundreds of points: simplify polyline for display at low zoom; keep full geometry for export.",
        "Debounce OSRM calls while dragging waypoints (e.g., 250–400ms).",
        "Use Leaflet panes to keep route above tiles but below popups."
      ]
    },
    "empty_states": {
      "first_use": "Show a compact coachmark card on map: 'Click to add your first waypoint' + 'Shift-click to insert between points' (if supported).",
      "testid": "map-empty-state"
    }
  },
  "data_viz_guidelines": {
    "recharts": {
      "line_chart": {
        "height": "desktop 180–220px; mobile 160px",
        "axes": "Minimal ticks; units in tooltip; use tabular-nums",
        "tooltip": "Use shadcn Card-like tooltip with border + blur; no heavy drop shadows"
      },
      "colors": {
        "line": "--ws-teal",
        "highlight": "--ws-blue",
        "area": "rgba(32,191,85,0.10)"
      },
      "testids": {
        "elevation-tooltip": "elevation-tooltip",
        "stats-distance": "stats-distance",
        "stats-duration": "stats-duration",
        "stats-elevation-gain": "stats-elevation-gain"
      }
    }
  },
  "accessibility": {
    "requirements": [
      "WCAG AA contrast for text on surfaces.",
      "Visible focus rings: use --ws-ring; never remove outline without replacement.",
      "Keyboard: all sidebar controls reachable; dialogs trap focus.",
      "Map: provide non-map equivalents for key actions (waypoint list supports selection + delete).",
      "Reduced motion support for panel animations."
    ],
    "aria": [
      "Icon-only buttons must have aria-label.",
      "Dialogs must have title + description."
    ]
  },
  "images": {
    "image_urls": [
      {
        "category": "marketing/empty-state",
        "description": "Optional empty-state illustration/photo for onboarding modal or help panel (cycling context).",
        "url": "https://images.unsplash.com/photo-1662360373703-b3b654fe9dd1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTN8MHwxfHNlYXJjaHwxfHxjeWNsaXN0JTIwcGxhbm5pbmclMjByb3V0ZSUyMG1hcCUyMGxhcHRvcCUyMG1vZGVybnxlbnwwfHx8Z3JlZW58MTc3NTQ5NzYxMHww&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "texture/background",
        "description": "Subtle topo/contour texture for sidebar header background (very low opacity).",
        "url": "https://images.unsplash.com/photo-1651840198758-af6168d79111?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwzfHxjb250b3VyJTIwbGluZXMlMjBtYXAlMjBiYWNrZ3JvdW5kJTIwdGV4dHVyZXxlbnwwfHx8Ymx1ZXwxNzc1NDk3NjE0fDA&ixlib=rb-4.1.0&q=85"
      }
    ]
  },
  "implementation_notes_js": {
    "react_files": "Project uses .js (not .tsx). Keep components in JS, use prop-types only if already present; otherwise rely on clear naming.",
    "data_testid_rule": "All interactive and key informational elements MUST include data-testid in kebab-case. For repeated items, suffix with index or id.",
    "tailwind_usage": "Prefer Tailwind utilities + CSS variables; avoid writing large custom CSS except for Leaflet overrides and noise/texture utilities.",
    "leaflet_css": "Keep Leaflet CSS isolated; add custom classes for marker icons and control clusters."
  },
  "instructions_to_main_agent": [
    "Replace default CRA App.css styles; do not use .App-header centered layout.",
    "Update index.css :root tokens to match the semantic system above (HSL for shadcn + extra --ws-* hex vars).",
    "Build AppShell with CSS grid: sidebar + map; elevation panel absolute bottom overlay.",
    "Use shadcn Sheet/Drawer for mobile sidebar and elevation panel.",
    "Ensure every Button/Input/Select/Dialog action has data-testid.",
    "Implement map control cluster as custom overlay (not Leaflet default zoom control) for consistent styling.",
    "Recharts elevation chart must support hover scrub -> highlight point on map polyline (shared state: hoveredDistanceIndex).",
    "Performance: debounce OSRM calls on drag; simplify polyline for render; keep full geometry for GPX export."
  ],
  "appendix_general_ui_ux_design_guidelines": "<General UI UX Design Guidelines>  \n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
