# Unison component catalogue

Nov 16, 2026 · @Mark

Unison should ship 138 components across 9 categories plus 35 blocks and 22 screen templates, in four tiers, and leave niche extras to a community registry. That's an ecosystem on the scale of Astryx, shaped around what makes Unison different: one API, native on every platform, with motion built in. The catalogue is now **frozen** at this size: depth (states, accessibility, motion, docs) matters more than adding components.

## Principles: not a clone

Every component is designed for Unison, not ported. Six rules decide what a component looks like and whether it exists at all.

1. **One API, two idiomatic renderers.** The props are the same everywhere; the output follows each platform. `Select` is a popover on web and a sheet on phones; `ContextMenu` is right-click on web and long-press on phones.
2. **Native idioms are first-class.** Web-first libraries skip things every mobile app needs: action sheets, pull-to-refresh, swipe actions, segmented controls, bottom tab bars. Unison ships them, with sensible web fallbacks.
3. **Motion and haptics are part of the component.** Every component has a defined enter, exit, press and gesture behaviour, a reduced-motion variant and (on phones) a haptic rule. Nothing is "animate it yourself".
4. **Families, not one-offs.** A few shared engines power many components: one listbox engine drives `Select`, `Combobox`, `Menu`, `ContextMenu` and `Command`; one overlay stack drives every overlay. Fixes land everywhere at once, and behaviour stays consistent.
5. **Merge overlaps instead of copying them.** shadcn has both `Drawer` and `Sheet`, both `Select` and `Native Select`, and a separate `Label`. Unison has one `Sheet` with a `side` prop, one `Select`, and labels inside `Field`.
6. **Data-driven collections.** Lists, tables, menus and selects take `items` arrays, not only children, so the native renderer can virtualise and both platforms render the same data their own way.

**Tiers used below:**

| Tier | Meaning |
| --- | --- |
| Wave 1 | The first components, built right after the engine release (roadmap phases 0–5 build the engine only) |
| Wave 2 | What most apps need soon after launch: the everyday gaps people hit first. Kept deliberately small. |
| Wave 3 | Breadth: larger components that need new engines (dates, tables, gestures) and useful but less universal ones |
| Later | Valuable but niche, or best designed after real-world feedback |
| Community | Not in the core; good candidates for the community registry (see below) |

## Naming rules

Names should read like plain English in JSX: `<Confirm>`, `<Row>`, `<ReaderOnly>`, not implementation jargon.

1. **One plain word where possible:** `Ratio`, `Scroll`, `Split`, `Copy`, `Upload`, `Tree`, `Status`.
2. **Name what it is for the user, not how it's built:** no `Visually…`, `Auto…`, `…Transition`, `…Area`.
3. **No platform words:** a name has to make sense on web and phones (`HoverCard` becomes `Preview`, because on phones it's a long-press).
4. **Consistent families:** typed entry ends in `Input` (`Input`, `NumberInput`, `PinInput`); choosing from a calendar or clock ends in `Picker`; overlays are short nouns (`Dialog`, `Sheet`, `Popover`, `Confirm`).
5. **Don't rename what's already clear:** `Button`, `Select`, `Tabs`, `Accordion`, `Badge`, `Combobox`, `ActionSheet` stay as people know them.

**Renamed from common names:**

| Common name | Unison name |
| --- | --- |
| HStack, VStack | Row, Column |
| ThemeScope | Theme |
| AlertDialog | Confirm |
| VisuallyHidden | ReaderOnly |
| AspectRatio | Ratio |
| ScrollArea | Scroll |
| AvatarGroup | Avatars |
| Kbd | Shortcut |
| CopyButton | Copy |
| SegmentedControl | Segments |
| SearchField | Search |
| NumberField | NumberInput |
| DescriptionList | Properties |
| EmptyState | Empty |
| StatusDot | Status |
| NumberTicker | Ticker |
| AutoHeight | Grow |
| FileUpload | Upload |
| CommandPalette | Command |
| AppBar | TopBar |
| SwipeActions | Swipeable |
| PullToRefresh | Refreshable |
| LayoutTransition | Move |
| HoverCard | Preview |
| Resizable | Split |
| NavigationMenu | SiteMenu |
| TreeView | Tree |
| SharedTransition | Morph |

## Coverage at a glance

**Components by category and wave** (counted from the category tables in this doc; components only, templates excluded)

| Category | Wave 1 | Wave 2 | Wave 3 | Later | Total |
| --- | --- | --- | --- | --- | --- |
| Forms and inputs | 4 | 6 | 12 | 3 | 25 |
| Layout and foundations | 4 | 9 | 3 | 1 | 17 |
| Data display | 0 | 3 | 12 | 2 | 17 |
| Navigation | 0 | 6 | 9 | 1 | 16 |
| Typography and content | 2 | 8 | 5 | 0 | 15 |
| Overlays and menus | 4 | 4 | 6 | 1 | 15 |
| Motion primitives | 1 | 2 | 9 | 1 | 13 |
| Actions | 2 | 3 | 5 | 0 | 10 |
| Feedback and status | 0 | 6 | 4 | 0 | 10 |
| **All** | **17** | **47** | **65** | **9** | **138** |

Wave 2 is deliberately small: it holds only the everyday gaps most apps hit soon after launch (popovers, menus, tabs, cards, lists, skeletons, a few more form controls). Wave 3 carries the breadth: components that need new engines (dates, data tables, gestures) and useful but less universal ones. Twenty-two screen templates (including an AI chat block) come on top of these, and niche extras go to the community registry instead of the core.

## Layout and foundations

The building blocks every screen sits on. They're mostly invisible, so the Unison angle is about getting platform edges right: safe areas, keyboards, hairlines and scroll behaviour.

| Component | What it is | Unison's angle | Tier |
| --- | --- | --- | --- |
| Box | Styled container with token-typed props | Server-safe on web, no inline styles, so `className` always wins; `layer` and `bleed` props cover overlapping and edge-to-edge content | Wave 1 |
| Stack, Row, Column | Flex layout with `gap` | Responsive `direction` and `gap` on both platforms; a `center` prop centres content on both axes | Wave 1 |
| Portal | Renders outside the tree | Native portal host instead of `Modal`; carries scoped themes | Wave 1 |
| Theme | Theme or scheme for a subtree | Works for overlays opened inside it too | Wave 1 |
| Grid | Responsive column grid | On native, computes item widths from columns and gap, since React Native has no CSS grid | Wave 2 |
| Container | Max-width page wrapper | Responsive padding, and safe-area aware on phones | Wave 2 |
| Divider | Horizontal or vertical rule | Optional centred label ("or"); true hairline on native | Wave 2 |
| Ratio | Fixed ratio box | Same API for images, video and maps on both platforms | Wave 2 |
| SafeArea | Insets for notches and home indicators | Also handles `env(safe-area-inset-*)` for installed web apps | Wave 2 |
| KeyboardSafe | Keeps content above the on-screen keyboard | Moves with the keyboard on the UI thread on phones; uses visualViewport on mobile web | Wave 2 |
| Show | Renders by screen size or platform | `<Show above="md">` or `<Show on="native">`; the hidden branch isn't rendered at all | Wave 2 |
| Spacer | Flexible empty space | Pushes items apart inside a Row or Column | Wave 2 |
| ReaderOnly | Screen-reader-only content | Native version uses accessibility props, not off-screen tricks | Wave 2 |
| Scroll | Scroll container | Styled scrollbars on web; fade edges and keyboard-aware insets on phones | Wave 3 |
| Sticky | Sticks to the top while scrolling | position: sticky on web; native sticky headers in lists and scroll views | Wave 3 |
| Masonry | Grid of uneven-height items | Balanced columns on both platforms; virtualised on native | Wave 3 |
| Split | Split panes with drag handles | Web and tablets only; collapses to a stack on phones | Later |

## Typography and content

| Component | What it is | Unison's angle | Tier |
| --- | --- | --- | --- |
| Text, Heading | Text styles and headings | Token text styles; dynamic type on native; heading levels separate from size | Wave 1 |
| Icon | Lucide icons, one import | Inherits the surrounding text colour on both platforms | Wave 1 |
| Link | Inline and standalone links | Adapters for Next.js, React Router and Expo Router links; `accessibilityRole="link"` on native | Wave 2 |
| Avatar, Avatars | Picture with initials fallback, and overlapping groups | Deterministic fallback colour from the name; optional status dot; "+3" overflow | Wave 2 |
| Badge | Small count or status label | Count changes animate with a quick `pop` (reduced: none) | Wave 2 |
| Tag | Chip for filters and selections | Selectable and removable; press feedback and selection haptics on phones | Wave 2 |
| Image | Image with loading states | Blur-up placeholder (ThumbHash) and fade-in; uses `expo-image` on native when installed | Wave 2 |
| Time | Dates, relative times and countdowns | "3 min ago" that updates live; `mode="countdown"` with tabular figures; the full date for screen readers | Wave 2 |
| Bullets | Bulleted and numbered lists | React Native has no list elements, so markers and indents are drawn the same everywhere; real list semantics on web | Wave 2 |
| Amount | Formatted numbers | Currency, percent and compact (1.2K) through Intl, with tabular figures and the user's locale | Wave 2 |
| Code, Shortcut | Inline code and keyboard shortcuts | `Shortcut` shows ⌘ or Ctrl by platform and hides itself on touch-only devices | Wave 3 |
| Clamp | Long text cut to a few lines | "Read more" expands it smoothly with Grow; never cuts mid-word | Wave 3 |
| Highlight | Marks matching text | Highlights search matches; exposed as a mark to screen readers, not colour alone | Wave 3 |
| Quote | Pull quotes and testimonials | Optional author and avatar; quotation marks that follow the locale | Wave 3 |
| Prose | Styles for rendered rich text or Markdown | Token-based typography for long text; a Markdown renderer adapter on native | Wave 3 |

## Actions

| Component | What it is | Unison's angle | Tier |
| --- | --- | --- | --- |
| Button | The main action | 4 variants × 3 intents × 3 sizes; width-stable loading; press spring | Wave 1 |
| IconButton | Icon-only action | `label` required by the types, so it can't ship unlabelled | Wave 1 |
| Toggle | A button that stays pressed | `aria-pressed` and `accessibilityState.selected`; selection haptic; an icon style for favourites (heart, star) with a small pop and success haptic | Wave 2 |
| Segments | Pick one of 2–5 options | A sliding selection thumb on a spring; works as a tab switcher too | Wave 2 |
| Share | Share a link or text | The native share sheet on phones, the Web Share API where browsers support it, a copy-link fallback elsewhere | Wave 2 |
| ButtonGroup | Attached buttons, split buttons | A split button's arrow opens a `Menu` on web and an `ActionSheet` on phones | Wave 3 |
| ToggleGroup | Toolbar of toggles (bold, italic, …) | Single or multiple selection; arrow-key roving focus on web | Wave 3 |
| Copy | Copy text to the clipboard | Icon morphs to a check with a spring; success haptic; announces "Copied" | Wave 3 |
| Hold | Press and hold to confirm | A fill animation and rising haptics while held; confirms destructive actions without a dialog | Wave 3 |
| Download | Download a file with progress | A progress ring inside the button; saves to Files or Photos on phones | Wave 3 |

## Forms and inputs

The largest category and the one apps judge a library by. Every control keeps the phase 3 rules: `value` / `onValueChange`, labels from `Field`, validation left to the app.

| Component | What it is | Unison's angle | Tier |
| --- | --- | --- | --- |
| Form, Field | Form wrapper; label, hint and error | Return-key flow between fields on phones; errors announced on every platform | Wave 1 |
| Input | Single-line text | Keyboard type, autofill and password reveal mapped per platform from one `type` | Wave 1 |
| Switch, Checkbox | Toggles | Spring thumb, drawn check, selection haptics | Wave 1 |
| Select | Pick one from a list | Popover on web, sheet on phones, one `items` API | Wave 1 |
| Textarea | Multi-line text | Grows with content up to a max height; optional character counter | Wave 2 |
| RadioGroup | Pick one, all options visible | A "cards" variant for plan-picker style choices | Wave 2 |
| CheckboxGroup | Pick several, all visible | Group label and error from `Field`; "select all" with indeterminate state | Wave 2 |
| Search | Search input | Debounced `onSearch`; clear button; iOS-style "Cancel" on phones | Wave 2 |
| PinInput | One-time codes and PINs | One-time-code autofill on iOS and Android, paste across boxes, masked mode | Wave 2 |
| Combobox | Searchable select, sync or async | Built on the shared listbox engine; sheet with a search field on phones | Wave 2 |
| NumberInput | Numbers with steppers | Hold-to-repeat steppers; locale-aware formatting; tick haptic per step | Wave 3 |
| Slider | Value or range on a track | Spring thumb, tick haptics at steps, large touch area on phones | Wave 3 |
| Editable | Text that becomes an input when tapped | Inline renaming of titles and table cells; Enter saves, Escape cancels | Wave 3 |
| Fieldset | Groups related fields under a title | A real fieldset and legend on web, an announced group label on native; disables every field inside at once | Wave 3 |
| DatePicker, Calendar | Dates and date ranges | Calendar popover on web; on phones a sheet calendar, or the OS picker with `native` mode; locale-aware week starts | Wave 3 |
| TimePicker | Times | Keyboard-friendly segments on web; wheel or OS picker on phones | Wave 3 |
| MultiSelect | Pick many from a long list | Selected values as removable `Tag`s; listbox engine | Wave 3 |
| Upload | Pick and upload files | Drag-and-drop zone on web; image and document picker adapters on phones; upload progress per file | Wave 3 |
| PhoneInput | Phone numbers with a country | Country picker in a sheet, formatting as you type, telephone autofill | Wave 3 |
| MoneyInput | Currency amounts | Locale-aware separators and currency symbol; numeric keypad on phones; stores minor units | Wave 3 |
| PhotoPicker | Choose and crop a photo | Camera or library on phones, file picker on web; round or square crop; resized before upload | Wave 3 |
| CountryPicker | Pick a country | A searchable sheet with flags and dialling codes; shared with PhoneInput | Wave 3 |
| ColorPicker | Pick a colour | OKLCH-aware, reusing the token generator | Later |
| Rating | Star ratings | Half steps, keyboard and swipe input | Later |
| RichText | Formatted text editing | A token-styled adapter for an existing editor (such as Tiptap on web), not a new editor | Later |

## Overlays and menus

All of these sit on the phase 4 overlay stack and `Presence`, so focus, dismissal, theming and motion behave the same everywhere.

| Component | What it is | Unison's angle | Tier |
| --- | --- | --- | --- |
| Dialog | Modal window | Interruptible spring; keyboard-aware on phones | Wave 1 |
| Confirm | Confirmation that needs an answer | Focus on the safe choice; warning haptic for danger | Wave 1 |
| Sheet | Bottom sheet or side drawer | Snap points, velocity handoff, scroll handover; replaces shadcn's separate Drawer and Sheet | Wave 1 |
| Toast | Temporary notification | Stacked deck, swipe to dismiss, tone haptics, screen-reader aware timers | Wave 1 |
| Popover | Anchored floating panel | Grows out of its trigger; becomes a sheet on phones when content is large (`adaptive` prop) | Wave 2 |
| Tooltip | Short hint on hover or focus | On phones, shown on long-press with a light haptic, since there's no hover | Wave 2 |
| Menu | Dropdown list of actions | Anchored menu on web and tablets; an action-sheet-style list on phones; shared listbox engine | Wave 2 |
| ActionSheet | List of actions from the bottom | A native idiom web libraries lack; falls back to a `Menu` on desktop web | Wave 2 |
| ContextMenu | Actions on an item | Right-click on web; long-press with a "lift" preview of the item on phones | Wave 3 |
| Prompt | Dialog that asks for one value | A styled window.prompt: title, field and confirm button, returning a promise with the value | Wave 3 |
| Hint | Small pointer callout next to an element | Points at a new feature once and remembers when it's dismissed; non-modal | Wave 3 |
| Command | ⌘K / Ctrl+K search-and-run | Full-screen search sheet on phones; listbox engine with fuzzy search | Wave 3 |
| Lightbox | Full-screen image viewer | Pinch-zoom, swipe between images, swipe down to close with velocity | Wave 3 |
| Tour | Step-by-step feature walkthrough | Spotlights one element through a cut-out scrim; skippable; fades only with reduced motion | Wave 3 |
| Preview | Rich preview of a linked item | Hover card on web, long-press preview on phones | Later |

## Navigation

Navigation is where web and phones differ most. Unison provides the visual and interaction layer and plugs into the app's router (Next.js, React Router, Expo Router) instead of shipping its own.

| Component | What it is | Unison's angle | Tier |
| --- | --- | --- | --- |
| Tabs | Switch between views | Indicator slides on a spring; optional swipe between panels on phones | Wave 2 |
| Accordion | Expandable sections | Height animates without layout jank (measured, then transform-driven); single or multiple open | Wave 2 |
| Collapsible | One expandable region | The primitive under Accordion, for custom disclosure UI | Wave 2 |
| Sidebar | App navigation rail | Collapsible to icons on desktop; becomes a side `Sheet` on phones; the base of the Sidebar blocks | Wave 2 |
| Back | Back button | Router-aware; a chevron on iOS and an arrow on Android and web; can show the previous screen's title | Wave 2 |
| Skip | "Skip to content" link | Lets keyboard and screen-reader users jump past navigation on web; renders nothing on native | Wave 2 |
| Breadcrumb | Where you are in a hierarchy | Collapses middle items into a menu; becomes a single back link on phones | Wave 3 |
| Pagination | Move through pages | Numbered pages on web; a "Load more" or infinite-scroll mode for phones | Wave 3 |
| Stepper | Progress through steps | Horizontal on wide screens, compact "Step 2 of 4" on phones; pairs with form wizards | Wave 3 |
| Toolbar | Row of grouped actions | Arrow-key focus on web; actions that don't fit move into an overflow Menu | Wave 3 |
| Pager | Swipeable full-width pages with dots | For onboarding and image pages; native paging with velocity, scroll-snap on web | Wave 3 |
| TopBar | Top bar with title and actions | iOS-style large title that collapses on scroll; works with Expo Router's header | Wave 3 |
| TabBar | Bottom tab navigation | Styling and motion for Expo Router tabs; a matching bottom nav for mobile web | Wave 3 |
| Contents | Table of contents for long pages | Highlights the section in view as you scroll; becomes a Select on phones | Wave 3 |
| Drilldown | Nested lists you tap into and back out of | iOS-style push and pop inside a sheet or panel, for settings and filters | Wave 3 |
| SiteMenu | Website mega-menu | Web only; a full-screen menu on small screens; plugs into the Navbar block | Later |

## Data display

| Component | What it is | Unison's angle | Tier |
| --- | --- | --- | --- |
| Card | Grouped content surface | `pressable` variant with press feedback; nested radii follow the concentric rule | Wave 2 |
| List, ListItem | Rows of items | Leading, content and trailing slots; inset dividers; virtualised on native through an `items` API (FlashList when installed) | Wave 2 |
| Empty | Nothing to show yet | Icon or illustration slot, message and a primary action; used by List, Table and Combobox | Wave 2 |
| Properties | Label–value pairs | Two columns on wide screens, stacked on phones | Wave 3 |
| Stat | A key number with change | Animated number with tabular figures; up/down change in status colours plus an arrow (never colour alone) | Wave 3 |
| Snippet | Code block with copy | Syntax highlighting, optional line numbers and a Copy button; scrolls sideways on phones | Wave 3 |
| Sparkline | Tiny inline trend chart | Plain SVG, no chart library; fits inside Stat and table cells | Wave 3 |
| Swipeable | Actions revealed by swiping a row | Native gesture with velocity and haptics at the commit point; hover-revealed actions on web | Wave 3 |
| Table | Semantic data table | Sortable headers, sticky header; on phones each row becomes a stacked card | Wave 3 |
| DataTable | Table with sorting, selection, filters, paging | Built on TanStack Table (headless); on phones a list with a filter sheet | Wave 3 |
| Carousel | Swipeable slides | Native gesture with snapping and velocity; CSS scroll-snap plus buttons on web | Wave 3 |
| Timeline | Activity feed or history | Grouped by day; works as a vertical list on every screen size | Wave 3 |
| Agenda | Events by day or month | Month grid on wide screens, a day list on phones; shares the calendar engine with DatePicker | Wave 3 |
| Gallery | Image grid | Opens into Lightbox, zooming from the tapped thumbnail's position | Wave 3 |
| Video | Video with styled controls | An adapter for HTML video and expo-video with token-styled controls; captions on by default when available | Wave 3 |
| Chart theming | Styling for chart libraries | No chart component: a `chartTheme()` that feeds tokens into Recharts (web) and Victory Native (native) | Later |
| Tree | Nested, expandable hierarchy | Keyboard tree navigation on web; indented expandable list on phones | Later |

## Feedback and status

| Component | What it is | Unison's angle | Tier |
| --- | --- | --- | --- |
| Spinner | Indeterminate loading | Made public (it's internal in the engine); identical on iOS and Android; pulses with reduced motion | Wave 2 |
| Skeleton | Placeholder while loading | `lines` matching real text line heights, so nothing jumps on load; shimmer becomes a gentle pulse with reduced motion | Wave 2 |
| Progress | Determinate progress, bar or ring | Value changes ease on a spring; indeterminate mode; announces milestones, not every percent | Wave 2 |
| Alert | Inline message with a tone | Optional actions; dismissing collapses it smoothly instead of popping out | Wave 2 |
| Banner | Page- or app-level persistent message | Sticky at the top (offline, trial ending); safe-area aware on phones | Wave 2 |
| Fallback | Error boundary with recovery | A friendly error screen with Retry; reports the error through a callback you provide | Wave 2 |
| Meter | A level within a range (storage, strength) | Different meaning from Progress (`role="meter"`); thresholds switch status colours | Wave 3 |
| Status | Small status indicator | Optional "live" pulse; always paired with text for accessibility | Wave 3 |
| Offline | Connectivity notice | Detects going offline and coming back; shows a Banner and can retry pending work on reconnect | Wave 3 |
| Refreshable | Pull a list down to reload | Custom spring indicator with a haptic at the threshold; only on touch devices on web | Wave 3 |

## Motion primitives and hooks

This is the category that sets Unison apart. shadcn leaves motion to the app; Unison exposes the same engine its own components use.

| Component | What it is | Unison's angle | Tier |
| --- | --- | --- | --- |
| Presence | Enter and exit animations for anything | Interruptible, velocity-aware, reduced-motion aware, same presets on both platforms | Wave 1 |
| Grow | Animate a container's height as content changes | Measures, then animates with transforms where possible; the engine behind Accordion and Alert dismissal | Wave 2 |
| Press | Makes any custom element tappable | The press feedback, focus ring and haptics from Button, for your own cards and tiles | Wave 2 |
| Ticker | Animated number changes | Rolling digits with tabular figures; announces only the final value | Wave 3 |
| Stagger | Items enter one after another | A small delay per item for lists and grids; reduced motion shows everything at once | Wave 3 |
| Shake | Error shake | A short sideways shake with an error haptic, for a wrong PIN or invalid submit; none with reduced motion | Wave 3 |
| Reveal | Animates in when scrolled into view | IntersectionObserver on web, list viewability on native; runs once; off with reduced motion | Wave 3 |
| Swap | Crossfades between two states | For icon swaps and changing labels; keeps its size steady so nothing around it jumps | Wave 3 |
| Reorder | Drag to reorder a list | Lift with a shadow and haptic, others make room on a spring; keyboard reordering on web | Wave 3 |
| Move | Animate items moving to new positions | FLIP on web, Reanimated layout transitions on native, the same spring tokens | Wave 3 |
| Drag | Free dragging with bounds and snapping | Velocity-aware throws and spring-back, on the UI thread on phones | Wave 3 |
| Zoom | Pinch and double-tap zoom | The engine behind Lightbox; trackpad pinch on web | Wave 3 |
| Morph | An element morphing between screens | Depends on router support on each platform; experimental until it's stable in Reanimated | Later |

**Public hooks** (not counted as components): `useTheme`, `useBreakpoint`, `useMediaQuery`, `useReducedMotion`, `useHaptics`, `useDisclosure`, `useControllableState`, `useClipboard`, `useKeyboard` (keyboard height on phones) and `usePressFeedback`.

## Blocks

Blocks sit between components and templates: ready-made **sections and layouts** (a sidebar, a navbar, a pricing section) that almost every site or app needs, each in a few variants. Like templates, they're copied into the app (`unison add block-sidebar --variant icons`) and meant to be edited, and they're built only from core components. shadcn/ui's blocks page works the same way, with dashboard, sidebar and login blocks; Unison's set is wider and every block also works on phones.

A block ships when the components it uses exist, so its tier is the latest tier among them.

### App shells

| Block | Variants | Built from | Tier |
| --- | --- | --- | --- |
| Sidebar | Collapses to icons; with nested sections; with team switcher and user menu in the footer; inset (floating) panel; secondary sidebar on the end side | Sidebar, Collapsible, Avatar, Menu, Tooltip | Wave 2 |
| App header | Search, notifications and user menu; with page title and actions | Row, Search, Popover, Menu, Avatar | Wave 2 |
| Dashboard shell | Sidebar + header + scrolling content area, the frame of most web apps | Sidebar block, App header block, Container | Wave 2 |
| Auth layouts | Centred card; split with image; muted background; magic link; social sign-in row | Card, Form, Image, Divider, Button | Wave 2 |
| Settings layout | Section navigation beside panels on wide screens, a list of sections on phones | Sidebar, List, Card, Show | Wave 2 |
| Mobile tab shell | Bottom tabs with a header per tab, for phone-first apps | TabBar, TopBar | Wave 3 |

On phones the Sidebar block becomes a drawer (a `Sheet` from the start edge) or hands over to the mobile tab shell, so one layout file serves both.

### Website sections

Web-first, but they render on phones too, which is handy for in-app "What's new" or upgrade screens.

| Block | Variants | Built from | Tier |
| --- | --- | --- | --- |
| Navbar | Simple; with call-to-action button; transparent over a hero; sticky and hide-on-scroll; links fold into a Sheet menu on small screens | Row, Link, Button, Sheet, Show | Wave 2 |
| Announcement bar | Dismissible strip above the navbar | Banner, Link | Wave 2 |
| Hero | Centred; split with image; with product screenshot; with email capture | Heading, Text, Button, Image, Input | Wave 2 |
| Logo cloud | Grid of customer logos | Grid, Image | Wave 2 |
| Features | Icon grid; alternating image and text rows; bento grid | Grid, Card, Icon, Image | Wave 2 |
| Stats | Row of headline numbers | Grid, Amount, Text | Wave 2 |
| Pricing | Plan cards with a monthly/yearly switch; highlighted recommended plan | Card, Segments, Badge, Button | Wave 2 |
| FAQ | Single column; two columns with intro | Accordion, Heading | Wave 2 |
| Call to action | Banner; split with image | Card, Button, Image | Wave 2 |
| Newsletter signup | Inline email form with a success state | Form, Input, Button, Toast | Wave 2 |
| Contact | Form with contact details beside it | Form, Textarea, Select, Card | Wave 2 |
| Team | Grid of people with roles and links | Grid, Avatar, Link | Wave 2 |
| Blog list | Post cards with image, date and author | Card, Image, Time, Avatar | Wave 2 |
| Footer | Multi-column links; simple one-line; with newsletter signup | Grid, Link, Divider, Input | Wave 2 |
| Cookie consent | Bottom banner with a preferences sheet | Banner, Sheet, Switch | Wave 2 |
| Testimonials | Grid; single large quote; carousel | Card, Avatar, Quote, Carousel | Wave 3 |
| Pricing comparison | Full feature-by-plan table | Table, Badge | Wave 3 |
| Blog post | Article layout with author, table of contents and code | Prose, Contents, Snippet, Avatar | Wave 3 |
| Changelog | Dated release notes | Timeline, Badge, Prose | Wave 3 |
| Docs layout | Sidebar navigation, article and on-page contents | Sidebar, Prose, Contents, Search | Wave 3 |

### App building blocks

| Block | Variants | Built from | Tier |
| --- | --- | --- | --- |
| User menu | Avatar trigger with account links, theme switch and sign-out | Avatar, Menu, Segments | Wave 2 |
| Team switcher | Switch between workspaces, with "Create team" | Menu, Avatar | Wave 2 |
| Notifications panel | Popover on web, Sheet on phones; unread and all tabs | Popover, Sheet, List, Time, Tabs | Wave 2 |
| Empty states | No data yet; no results; no access; first-run | Empty, Button | Wave 2 |
| Data table page | Search, filters, bulk actions, pagination | DataTable, Search, Toolbar, Pagination | Wave 3 |
| Stats row | Key numbers with trend sparklines | Stat, Sparkline, Card | Wave 3 |
| Activity feed | Who did what, grouped by day | Timeline, Avatar, Time | Wave 3 |
| Upload panel | Drop zone with per-file progress | Upload, Progress, List | Wave 3 |
| Schedule | Day and month views of events | Agenda, Segments | Wave 3 |

That's 35 blocks with around 70 variants. To support them, Sidebar moves from Wave 3 to Wave 2 in the Navigation table: nearly every web app needs it early.

## Templates (blocks)

Templates are whole screens copied into an app with `unison add template-<name>` and meant to be edited. Each one is a single file that runs on web and phones, and each new one is chosen to exercise components from the tier it ships in.

| Template | What it shows | Built from | Tier |
| --- | --- | --- | --- |
| Login | Sign in with validation and errors | Form, Field, Input, Checkbox, Button | Wave 1 |
| Settings | Grouped preferences, theme switch, danger zone | Switch, Select, Confirm, Toast | Wave 1 |
| List / detail | Search, rows, split view or stack, edit sheet | Search, Sheet, Confirm | Wave 1 |
| Sign-up and verify | Account creation with a one-time code | Form, PinInput, Toast | Wave 2 |
| Profile | Avatar, details, edit | Avatar, Card, Sheet | Wave 2 |
| Error and empty pages | Not found, offline, no results, crash | Empty, Banner, Fallback | Wave 2 |
| Help center | Searchable FAQ | Search, Accordion, Empty | Wave 2 |
| Onboarding | 3–4 intro pages with progress | Pager, Presence, Button | Wave 3 |
| Form wizard | A multi-step form with review | Stepper, Field controls, Card | Wave 3 |
| Dashboard | Key numbers, a chart, a recent-items table | Stat, chart theming, DataTable, Card | Wave 3 |
| Search with filters | Results with a filter sheet and tags | Combobox, Tag, Sheet, List | Wave 3 |
| Checkout | Address, payment fields, order summary | Form, RadioGroup cards, Card | Wave 3 |
| AI chat | A ChatGPT-style assistant: streaming answers, code, attachments, history | Prose, Snippet, Textarea, List, Copy, Upload, Sidebar, Sheet (details below) | Wave 3 |
| Chat thread | Person-to-person messages, composer, keyboard handling | List, Textarea, Avatar, Grow | Wave 3 |
| Feed | Infinite feed with pull-to-refresh | List, Refreshable, Card, Avatar, Time | Wave 3 |
| Booking | Pick a date and a time slot, then confirm | DatePicker, Segments, Confirm | Wave 3 |
| Map and sheet | Location search over a map, results in a non-modal sheet | Sheet (non-modal), Search, List | Wave 3 |
| Order tracking | Status of an order or delivery | Timeline, Progress, Properties | Wave 3 |
| Invite team | Invite people by email with roles | MultiSelect, Select, Toast | Wave 3 |
| Notifications inbox | Grouped notifications with swipe actions | List, Swipeable, Tabs | Later |
| Pricing | Plan comparison for marketing sites | Card, Segments, Badge | Later |
| Paywall | Subscription plans with a purchase button | RadioGroup cards, Button, Properties | Later |

### The AI chat block

A ChatGPT-style assistant screen, copied in with `unison add template-ai-chat`. It's built entirely from core components (no special chat components) and is provider-agnostic: it takes `messages`, `status`, `onSend`, `onStop` and `onRegenerate`, so it plugs into the Vercel AI SDK's `useChat`, a custom stream, or anything else.

| Part | Built from | Behaviour |
| --- | --- | --- |
| Conversation history | Sidebar (web), Sheet from the start edge (phones), List, Time | Grouped by day; rename with Editable; delete with Confirm; new-chat button at the top |
| Header | TopBar, Select | Conversation title and a model picker |
| Empty state | Empty, Tag | Greeting plus suggested prompts as tappable tags that fill the composer |
| Message list | List (virtualised, newest at the bottom), Avatar | Sticks to the bottom while streaming **unless** the user scrolled up; then a "Jump to latest" button appears instead of yanking them down |
| Assistant message | Prose (Markdown), Snippet (code with Copy), Grow | Streams token by token without layout jumps: new text grows the message smoothly instead of reflowing everything; tables and lists render as they complete |
| Message actions | Copy, IconButton, Tooltip | Copy, regenerate, thumbs up/down; on phones a long-press Menu instead of hover buttons |
| Thinking state | Skeleton, Spinner | A short "Thinking…" line with a calm pulse before the first token; reduced motion: static |
| Composer | Textarea (auto-grow), KeyboardSafe, IconButton, Upload, PhotoPicker | Enter sends and Shift+Enter adds a line on web; a send button on phones; attachments as removable chips with upload progress; the send button turns into **Stop** while generating |
| Errors | Alert | Inline "Something went wrong" on the failed message with Retry; the rest of the thread stays usable |

Accessibility and feel:

- Screen readers aren't flooded with every token: the message list is a polite live region that announces the reply once it's complete (plus a "Generating…" status at the start).
- Focus stays in the composer after sending; Escape stops generation on web.
- Haptics on phones: a light tap on send, nothing during streaming.
- Works in all three presets and both schemes; code blocks follow the theme.

These also cover the pattern families Astryx documents: table pages, detail layouts, form wizards, navigation and data-entry flows.

## Merged and moved out

To keep the core focused, some earlier candidates became props on existing components, and the niche ones moved to the community registry.

**Merged into existing components:**

| Was | Now |
| --- | --- |
| Center | `center` prop on Stack, Row and Column |
| Bleed | `bleed` prop on Box |
| Layer | `layer` prop on Box |
| Favorite | Icon style of Toggle |
| Countdown | `mode="countdown"` on Time |

**Community registry candidates.** Good ideas that most apps don't need. They're ideal first contributions to the community registry (phase 5), built with `registry-kit` and listed on the docs site, but not maintained in the core:

| Candidate | What it is |
| --- | --- |
| Board | Kanban columns with draggable cards (plus the Kanban board template) |
| Heatmap | Calendar activity grid |
| Map | Token-styled markers and callouts for MapLibre and react-native-maps |
| QR | QR codes as SVG |
| Signature | Draw a signature |
| Mentions | @mentions inside a text field |
| Reactions | Emoji reactions bar |
| FloatingButton | Floating action button (a Material idiom iOS doesn't use) |
| Marquee | Continuously scrolling row |
| Parallax | Scroll-linked depth layers |
| Celebrate | Confetti-style success moments |

## Deliberately left out

What Unison won't copy from shadcn/ui, and why.

| shadcn/ui component | Unison instead |
| --- | --- |
| Drawer *and* Sheet | One `Sheet` with `side` and snap points |
| Native Select | `Select` already uses the platform-appropriate UI |
| Label | Labels live in `Field` (and inline on Switch, Checkbox) |
| Input Group | `Input` start and end addons |
| Typography | `Text` and `Heading` with token text styles; `Prose` for long-form content |
| Direction | RTL is automatic on both platforms; no provider needed |
| Chart | `chartTheme()` for existing chart libraries instead of a chart component |
| Item | `ListItem`, which also virtualises on phones |
| Menubar | A desktop-app pattern rarely needed in cross-platform apps; reconsider on request |
| Chat-oriented pieces (Bubble, Message, Message Scroller, Attachment) | No separate chat components: the AI chat and Chat thread templates build them from general ones (Prose, Snippet, Textarea, List) |

Rule for future requests: a component joins the catalogue when it works well on both web and phones (or has a sensible fallback), and when apps need it often enough that people would otherwise build it themselves.

## Sources

- [shadcn/ui components index](https://ui.shadcn.com/docs/components), checked 16 November 2026 for the full component list.
- [Meta Astryx on GitHub](https://github.com/meta/astryx): describes 150+ components, foundations, and patterns (table pages, detail layouts, form wizards, navigation, data entry). It doesn't list individual components; the full list is on its docs site and Storybook.
