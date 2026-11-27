# Brief: build a prototype with Vici 2.0

You are building a prototype, demo or tech showcase for Victor Pflüger with Vici, his design system: https://victorpflueger.github.io/ViciDesign/

A partner will show it to a customer who has never seen it, often on a projector and often without Victor in the room. This brief is the short form of https://victorpflueger.github.io/ViciDesign/start/prototypes.html. Where the two differ, the page is right.

## Who it is for

The dumbest user possible: someone with no knowledge of the subject, no interest in it and no time. At every step they can say what the prototype is doing, what it is worth and which key figure just moved. Make it lean and cut whatever the story doesn't need, but keep the case and its evidence intact.

## Every prototype has these three

1. The byline: "Built by", Victor's portrait and name linking to LinkedIn, and a globe linking to his website, both links with rel="author". It sits at the end of the page, or in a strip under the header of a single-screen app. Markup: https://victorpflueger.github.io/ViciDesign/brand/profile-links.html#byline-anywhere
2. The talk track: a How it works guide that opens by itself when the prototype starts (data-vc-guide-auto) and again from a "How it works" button in the header. Its How it works chapter explains every key figure in a table, one row each: the name as on its tile, what it measures and its value. The last chapter is the presenter's script, three to seven timed steps. Rules: https://victorpflueger.github.io/ViciDesign/components/guide.html
3. Key figures: two to four vc-stat tiles at the top, usually top right, each marked data-vc-kpi="<name>" and explained in the guide. Choose from money gained, lost or saved; lead time; time from detection to decision; session cost (measured in a live run; in a simulated one labelled "A live run would cost" over the estimate and "this replay: €0", so nobody reads it as money spent); people affected; performance against a benchmark; a score. Define another when the case needs it. A figure computed from part of the data says so in its value ("77 on 5 of 6 layers") and never reads as final. A figure that covers part of the data on purpose never contradicts the screen: it names that part in data-vc-part and says under its value, in a vc-stat__also line, what lies lower outside it. The figures answer first: before anything runs they show what the case puts at stake, rather than a row of zeros. Two scales on one screen, such as levels 0 to 4 beside scores 0 to 100, meet once, in a line of words that says how one becomes the other: https://victorpflueger.github.io/ViciDesign/guidelines/data-viz.html#two-scales. Rules: https://victorpflueger.github.io/ViciDesign/components/guide.html#key-figures

## Build it

- Clone https://github.com/VictorPflueger/ViciDesign beside the prototype. It has the starters, the files to copy and the checks.
- Start from a starter: starters/app.html for a tool with a sidebar and tables, starters/blank.html for anything else. Both have the header with SIMULATION, the guide and the byline. The blank starter carries a strict security policy and no inline script or style; keep it that way, with your own styles and scripts in files and the theme from vici/dist/vici-theme.js. https://victorpflueger.github.io/ViciDesign/start/starters.html
- Copy dist/, assets/fonts/, assets/brand/portrait-96.jpg and assets/marks/ unchanged into a vici/ folder, and link vici/dist/vici.min.css and vici/dist/vici.js. Add no framework, no web font and no third-party request other than the AI service a live run calls. https://victorpflueger.github.io/ViciDesign/start/getting-started.html
- The header shows the name with its icon, SIMULATION or LIVE in capitals, the How it works button and the theme toggle. The layout, with code: https://victorpflueger.github.io/ViciDesign/start/prototypes.html#page-structure
- One sentence under the header says what the prototype does and whether its data is real.
- The work area follows the order of the story. Wherever it waits for a person, a bar right under what just happened says in words what to do next and what that changes, such as "Your decision", and holds the one primary action, which draws attention until it is pressed and stays in view however long the work area grows. The bar never covers what it asks about: at a decision, every option, doing nothing included, shows in full above it at 1280 × 720. A Next button alone is easily overlooked. A story whose steps show at once can play them by itself and stop where a person acts: https://victorpflueger.github.io/ViciDesign/components/guide.html#steps. Lilac marks what the AI generated, suggested or summarised.
- Nothing the agent prepares, such as a payment or a message, leaves the page without a person's approval, and the prototype logs who approved what.
- If a run ends in a document, make it a report. It prints alone through Vici.report.print, every page carrying "Created with" and the prototype's name, its address, "Built by Victor Pflüger" and the page number, and it leaves as an HTML file of its own through Vici.report.html: https://victorpflueger.github.io/ViciDesign/components/report.html
- Wherever a live run with a model can start, "You are interacting with an AI system" stands in a lilac tag (vc-tag--feature) beside the control and stays while the run lasts; mark that control with data-vc-live. A replay that calls no model needs no notice. https://victorpflueger.github.io/ViciDesign/guidelines/principles.html#ai
- A number that stands for a set of things on the screen (745 duties, 48 clusters) opens that set by click and by keyboard, and a price opens where it comes from: https://victorpflueger.github.io/ViciDesign/components/data.html#count
- The screen shows names, places and words, never the ids the data gives a record (vendor 10003, RA-CISCO, CC-1000). One module turns ids into words, for the agent's text and its drafts too: https://victorpflueger.github.io/ViciDesign/guidelines/writing.html#names-not-ids
- A short form the room can't expand (BStatG) never carries a screen: name the thing in words on the element itself, as projectors and touch screens show no hover; hover only adds. Every number carries its unit, on the element or in a legend in words. A name the room has never heard (PflichtenLichten) says what it is where it first appears: https://victorpflueger.github.io/ViciDesign/guidelines/writing.html#short-forms
- Use open-source or synthetic data only, never a client's or internal data, and label what is synthetic or simulated.
- If it can run live, it asks at the start: simulation or live. Where the simulation starts by itself when the guide closes, the button for a live run says so, such as "Run it live", and stands after the steps, where nobody takes it for the way to start. A live run takes an API key for this session only. The key, everything a person enters or uploads and everything the agents make stay in the page's memory: never in local or session storage, IndexedDB, the Cache API or a cookie, a URL, a log or an export. Only vc-theme, <prefix>.lang and Vici's vc-guide: note may persist, and a result leaves only as a download the person starts: https://victorpflueger.github.io/ViciDesign/start/prototypes.html#nothing-kept
- Test it at 1920 × 1080 and 1280 × 720 in both themes, and keep text at Vici's sizes or larger: the room reads it from a distance.
- Its favicon is its icon in a hexagon in the colour of its kind, as on its card on Victor's website: lilac for a prototype, fjord for a demo, teal for a tech showcase.
- Write British English or German throughout, following https://victorpflueger.github.io/ViciDesign/guidelines/writing.html. Nothing may look generated.
- It runs on GitHub Pages and doesn't link to its own repository. Its README says what is real and what is simulated.

## Check it

From the prototype's folder, with the ViciDesign clone beside it:

- guideProblems(html) from ../ViciDesign/scripts/lib/guide.mjs, bylineProblems(html) from ../ViciDesign/scripts/lib/byline.mjs, writingProblems(html) from ../ViciDesign/scripts/lib/writing.mjs and aiNoticeProblems(html) from ../ViciDesign/scripts/lib/ai.mjs each return an empty list for every page.
- policyProblems(html) from ../ViciDesign/scripts/lib/policy.mjs returns an empty list for a page under a strict security policy.
- riskMatrixProblems(html) from ../ViciDesign/scripts/lib/risk.mjs returns an empty list for every screen that shows a risk matrix: 25 cells in their bands, each marker in its cell, a key in words and a table of the numbers. https://victorpflueger.github.io/ViciDesign/components/data.html#risk-matrix
- horizonProblems(html) from ../ViciDesign/scripts/lib/horizon.mjs returns an empty list for every screen that shows a horizon strip: a name, two to six lanes that name their span, every marker named in words with its number and in one lane only, and a table of the numbers. https://victorpflueger.github.io/ViciDesign/components/data.html#horizon
- frameworkProblems(html) from ../ViciDesign/scripts/lib/framework.mjs returns an empty list for every screen that shows a framework view: each item carries a mark and a word for its state. https://victorpflueger.github.io/ViciDesign/components/framework.html
- ringProblems(html) from ../ViciDesign/scripts/lib/ring.mjs returns an empty list for every screen that shows a ring of six cells around a centre: the ring has a name, the centre comes first, six named cells follow, and each state carries a mark and a word. https://victorpflueger.github.io/ViciDesign/components/framework.html#ring
- liveDialogProblems(html) from ../ViciDesign/scripts/lib/live.mjs returns an empty list for every screen with a live-run dialog: the key, the setting, the cap, the acknowledgement, the estimate and the start button in that order; a key field in no form, with autocomplete off, spellcheck off, the password managers' ignore marks, a show button, a note, a link and "Forget key"; one setting chosen; the cap's value in view; the box unticked; an estimate that is announced; and a disabled start button with the AI notice beside it. https://victorpflueger.github.io/ViciDesign/components/overlays.html#live-run
- reportProblems(html) from ../ViciDesign/scripts/lib/report.mjs returns an empty list for the report a run ends in: a language and the light theme, a cover whose title is the one top heading, every other page one level below it, no script, control or closed details, a fixed footer that names Victor and the byline on the last page. https://victorpflueger.github.io/ViciDesign/components/report.html
- dropzoneProblems(html) from ../ViciDesign/scripts/lib/dropzone.mjs returns an empty list for every screen with a drop zone: its file input stays in the tab order with the zone as its label and names what it accepts, the zone carries its notice on what may be uploaded, its list announces changes, and every file has a name, a remove button that names it and, when refused or warned about, a reason in words. https://victorpflueger.github.io/ViciDesign/components/forms.html#drop-zone
- storageProblems(sources, { allow }) from ../ViciDesign/scripts/lib/storage.mjs returns an empty list for the prototype's scripts, and storedKeyProblems(keys, { prefix }) for what a full live run against a stand-in leaves in a fresh browser.
- recordIdProblems(text, ids) from ../ViciDesign/scripts/lib/ids.mjs returns an empty list for the text of every screen, given the ids of the prototype's data.
- countProblems(html) from ../ViciDesign/scripts/lib/counts.mjs returns an empty list for every screen: each count is a button with its number that opens a set on the page. https://victorpflueger.github.io/ViciDesign/components/data.html#count
- node ../ViciDesign/scripts/check-guide-render.mjs http://localhost:8000/ tests the guide in a browser while the prototype is served there.

## Review it as a partner would

Before you call it done, review it cold, at 1280 × 720, as a consultancy partner who has to present it tomorrow:

1. Write the One Thing: one sentence on what it shows the customer, with the key figure that proves it.
2. Walk every step as the dumbest user possible. Where they can't say what it is doing, what it is worth or which key figure moved, fix the step or cut it. Where it waits for them and they could miss what to press, fix the bar.
3. Count the steps until a key figure first moves, and cut every step that doesn't move the story.
4. Check that the case survived the cuts: every figure comes from the prototype's own data, and its evidence is one click away.
5. Look at the screens nobody demos: loading, empty, a failed live run, the other theme.
6. Present it once along the guide's script, with a timer.

Report a verdict (ready or not ready), the One Thing, whether it keeps its promise, a cut list, a ranked fix list and a keep list. The byline, the talk track and the key figures are always on the keep list. The full review: https://victorpflueger.github.io/ViciDesign/start/prototypes.html#partner-review
