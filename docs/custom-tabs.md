# Custom panel tabs (planned)

**Status: a plan. Nothing here is built yet.** No code reads a character's tab, and the
automatic intake rejects a `tab` field today. Until the registry below lands, a new tab
still falls under **Ask first** in [CONTRIBUTING.md](../CONTRIBUTING.md). This page says
where the system is going, so builders know what to prepare and maintainers can review the
stages one at a time.

## The idea

The panels' tabs are something every visitor shares, so the stock set stays small. Instead
of adding tabs to it, the game will let each visitor shape their own:

- **Builders can offer a tab with their character.** It is declared in their own
  `src/characters/<handle>.js`, as data. It is **off by default**: nobody sees it until a
  visitor chooses to add it.
- **Visitors can hide panels they don't use** and add the character tabs they like, in a tab
  customization dialog. The choice is theirs, kept in their browser.
- **Bananas is always there and always first.** It can't be hidden, moved or put behind a
  custom tab.

## How tabs work today

There are two surfaces with two lists, and both are fixed in code:

| | The island (`sheet.js`, `hud.js`, `src/index.html`) | Ooga Chat (`src/ooga-chat/ooga-chat-app.js`) |
|---|---|---|
| Order | Bananas, Contributing Oogas, Online Oogas, The Commons, Ooga Chat | Ooga Chat, Bananas, Contributing Oogas, Online Oogas, The Commons |
| Defined by | `NAMES` in `sheet.js` and the buttons in `#sheet`'s `.sheet-panels` | the `tabs` array passed to `BL.oogaChatShell.create` (`docs/ooga-chat-app.md`, Shell) |
| Shown when | `available(name)`: Online Oogas and The Commons signed in, Ooga Chat where the room speaks `audience-v1` | `visible(state)`: Online Oogas and The Commons only while `gates` says `contributor` |
| Icons | `native-icons.js` (`bananas`, `roster`, `players`, `chat`, `cloud`) | the same module |
| Saved | `oogaboogaland.sheet.v1`: the open tab, folds, docks and floating windows | `ooga-chat.v1.tab`: the chosen tab |
| Unread | `sheet.setBadge`, `note`, `unnote` for `players` and `chat`; the bell lists them | none |

The two lists are already close: Ooga Chat's tabs are the island's own panels (#656). The
plan makes them one list.

## One registry for both surfaces

A new shared module, `src/js/panel-tabs.js` (`BL.panelTabs`), reading nothing at load but
`window.BL`, so Ooga Chat can load it as it does `roster-panel.js`. It holds:

- **The stock tabs**, each `{ id, label, icon, surfaces, required, removable, available(ctx) }`:
  Bananas (`required`, first on every surface), Contributing Oogas, Online Oogas, The
  Commons, and Ooga Chat (on the island; the app's home tab in the app, see open questions).
  `available` keeps today's gates, so a hidden or added tab never changes who may see what.
- **The character tabs**, read from `BL.characters.all()`: every character with a valid
  `tab`, under the id `char:<handle>`, in roster order.
- **`list(surface, prefs, ctx)`**: the tabs to show, in order. Bananas first, then the stock
  tabs the visitor has not hidden, then the character tabs they added, in the order they
  added them. Unknown or removed ids in `prefs` are skipped, never an error.
- **`prefs` load and save**, checked at the boundary as `game.load` is: a bad piece falls
  back to the default (nothing hidden, nothing added).

`sheet.js` builds its buttons and panels from `list("island", …)` instead of `NAMES` and the
fixed markup, and Ooga Chat passes `list("chat", …)` to its shell. Saved layouts naming a
tab no longer offered (a hidden tab, a removed character) fall back to Bananas, as a saved
tab that is not `available` does today.

## A character's tab

### What it is

Data, never code. A builder adds one field to their character:

```js
tab: {
  title: "KARAOKE",
  icon: [
    "..aa..",
    ".abba.",
    ".abba.",
    "..aa..",
    "...b..",
    "..bbb."
  ],
  palette: { a: "#f2c14e", b: "#3b2a1a" },
  blocks: [
    { heading: "Welcome to the lounge" },
    { text: "Pick a song, grab the mic, and sing for the island." }
  ]
}
```

The exact shape is decided in stage 3; this is the direction:

- **`title`**: up to 16 characters the cave-sign alphabet carves (`SIGN_GLYPHS`), shown as
  the panel's carved title and as the tab's accessible name.
- **`icon`**: a small pixel grid (at most 16 by 16), `.` for empty and a letter for each
  colour in `palette` (at most four, six-digit hex), drawn as `native-icons.js` draws the
  stock ones. No pictures, no URLs.
- **`blocks`**: up to 24 blocks of plain text, each a `heading` (60 characters) or `text`
  (500 characters). Rendered with `textContent` by one shared renderer, never as HTML.

### What it can't do

A character's tab is a page of text and a picture made of squares. It never runs code, and
it never reaches outside the page:

- no scripts, event handlers, HTML, CSS, iframes or `dress`-style hooks;
- no network requests, images, fonts, audio or links to other origins. The content policy
  (`src/index.html`) does not change for it;
- no reading or writing storage, the account, the room or other panels;
- no badges, toasts, sounds or anything that asks for attention;
- nothing under **Not wanted** or **Promotion** in CONTRIBUTING.md: a tab is not an advert,
  a donation link to anyone but Ooga Booga Land, or a landing page for another project.

Links out are the most likely thing builders will want. They are left out of the first
version on purpose (see open questions).

### How it is screened

`scripts/character-safety.mjs` gains a validator for `tab`, as it has for `look` and
`voice`: known keys only, every string through the same `text` check (bounded, no control
or direction characters, no instruction text), the grid and palette checked for size and
format. A valid tab keeps the file in the automatic lane; anything else sends the whole file
to manual review, as an unknown field does today. The 32 KiB cap on a character file holds,
tab included. `npm run character:check` reports the tab's size and lane, and the character
studio shows the tab beside the Ooga.

A maintainer can still take a tab out: a `hidden` list in the registry, or removing the
field, takes it out of every chooser on the next deploy, and visitors who added it simply
stop seeing it.

## Choosing tabs

### The tab customization dialog

One dialog, opened from a small control at the end of the tab row (the island's sheet and
the app's shell alike), modal and keyboard-reachable, with the controller's Menus context
through `pad-focus.js` on the island:

- **Your tabs**: every stock tab with a switch. Bananas is shown locked on and first, with a
  line saying it always stays. Tabs the visitor can't see yet (signed out, not a
  contributor) are listed with why, and stay off the row until they can.
- **Character tabs**: every character that offers one, by display name, with its icon and
  title and a preview of its text before it is added. Added ones can be removed and
  reordered among themselves.
- **Reset** puts everything back to the stock set.

### Where the choice lives

Per browser, in localStorage: `ooga-tabs-v1` on the island, `ooga-chat.v1.tabs` in the app
(a different origin, so a separate choice). `{ hidden: [ids], added: [ids] }`, nothing else.
Nothing is sent to the server, and nothing is kept for visitors who don't change anything.
Syncing the choice to a signed-in account is a later question, not part of this plan.

### What hiding means

Hiding a tab hides its button and panel, nothing else. It never signs in or out, leaves
voice, closes a socket, or stops The Commons from receiving lines. Its unread count is
dropped while it is hidden: a hidden Online Oogas or The Commons adds nothing to the bell,
and a join or a line still shows its toast where it does today.

## Phone layout and accessibility

- The tab row must keep each tab at least 44 px wide. A phone's row is the drawer's width
  less 80 px (`PHONE_TAB_INSET`), so a 390 px phone fits seven. The registry enforces a cap:
  **at most two character tabs added**, so the row never exceeds seven with every stock tab
  showing. The dialog says so when the cap is reached.
- Character tabs use the same `role="tab"` and `role="tabpanel"` wiring, roving focus and
  arrow keys as the stock ones. The accessible name is the title, spelled out (not carved).
- Text blocks are real text: selectable, readable by screen readers, scaled with the page.
  The icon is decorative (`aria-hidden`).
- Under reduced motion nothing in a character tab moves, since nothing in it can.
- The suite's phone sessions cover the row with two character tabs added.

## Rollout

Each stage is its own issue with a maintainer's yes, and its own reviewable PR. Nothing
in a later stage is merged before the one before it.

1. **One registry, no visible change.** `panel-tabs.js` holds the stock tabs; `sheet.js` and
   the Ooga Chat shell read their list from it. The tab rows look and behave as today.
2. **Hide and show stock tabs.** The customization dialog with the stock tabs only, Bananas
   locked first, the per-browser choice, badges dropped for hidden tabs, the suite's checks
   for both surfaces at phone and desktop sizes.
3. **Character tabs.** The `tab` field in `character-safety.mjs`, the bundle docs and the
   registry; the shared renderer; the character tabs section of the dialog, off by default;
   `character:check` and the studio's preview. A sample tab on a maintainer's character.
4. **Later, if wanted.** Links under rules the maintainers set, account sync, more block
   kinds. Each needs its own issue.

## What a builder can do now

- **Don't add a `tab` field to a character file yet.** Nothing reads it, and the automatic
  intake will send the file to manual review.
- **Write the tab down.** A title, the text, and a sketch of the icon, in an issue. When
  stage 3 lands it is a few lines to add.
- **Think in text.** If the tab needs to do something (play, vote, sing, fetch live data),
  it isn't a character tab: it is a feature or a place, and it goes through **Ask first**.

## Open questions for the maintainers

1. **Bananas first in Ooga Chat.** The app's first tab today is Ooga Chat itself, with
   Bananas second. Does Bananas move ahead of it, or is Ooga Chat the one required tab there
   with Bananas pinned right after it?
2. **Which stock tabs can be hidden?** This plan lets every one but Bananas go. Should
   Contributing Oogas, or the island's Ooga Chat tab, stay?
3. **Links.** None at first. Later: the builder's own GitHub profile only, repositories on
   Merge Rock, or a maintainer-reviewed list?
4. **Review.** Is a schema-valid tab enough for the automatic lane, or does every tab's text
   get a maintainer's read, as custom dress code does?
5. **The cap.** Two added character tabs, or a scrolling tab row so more can be added?
6. **Signed out.** Can a visitor who isn't signed in add character tabs? (The plan says
   yes: it is local text.)
7. **Discovery.** Should a character's tab also be reachable from their Ooga (its tooltip
   or roster row) as well as from the dialog?
