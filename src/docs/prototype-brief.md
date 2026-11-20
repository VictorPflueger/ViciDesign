# Brief: build a prototype with Vici 2.0

You are building a prototype, demo or tech showcase for Victor Pflüger with Vici, his design system: https://victorpflueger.github.io/ViciDesign/

A partner will show it to a customer who has never seen it, often on a projector and often without Victor in the room. This brief is the short form of https://victorpflueger.github.io/ViciDesign/start/prototypes.html. Where the two differ, the page is right.

## Who it is for

The dumbest user possible: someone with no knowledge of the subject, no interest in it and no time. At every step they can say what the prototype is doing, what it is worth and which key figure just moved. Make it lean and cut whatever the story doesn't need, but keep the case and its evidence intact.

## Every prototype has these three

1. The byline: "Built by", Victor's portrait and name linking to LinkedIn, and a globe linking to his website, both links with rel="author". It sits at the end of the page, or in a strip under the header of a single-screen app. Markup: https://victorpflueger.github.io/ViciDesign/brand/profile-links.html#byline-anywhere
2. The talk track: a How it works guide that opens by itself when the prototype starts (data-vc-guide-auto) and again from a "How it works" button in the header. Its chapters say what the prototype does, how it works and what each key figure means. The last chapter is the presenter's script, three to seven timed steps. Rules: https://victorpflueger.github.io/ViciDesign/components/guide.html
3. Key figures: two to four vc-stat tiles at the top, usually top right, each marked data-vc-kpi="<name>" and explained in the guide. Choose from money gained, lost or saved; lead time; time from detection to decision; session cost (measured in a live run, estimated in a simulated one, and labelled as such); people affected; performance against a benchmark; a score. Define another when the case needs it. Rules: https://victorpflueger.github.io/ViciDesign/components/guide.html#key-figures

## Build it

- Clone https://github.com/VictorPflueger/ViciDesign beside the prototype. It has the starters, the files to copy and the checks.
- Start from a starter: starters/app.html for a tool with a sidebar and tables, starters/blank.html for anything else. Both have the header, the guide and the byline. https://victorpflueger.github.io/ViciDesign/start/starters.html
- Copy dist/, assets/fonts/, assets/brand/portrait-96.jpg and assets/marks/ unchanged into a vici/ folder, and link vici/dist/vici.min.css and vici/dist/vici.js. Add no framework, no web font and no third-party request other than the AI service a live run calls. https://victorpflueger.github.io/ViciDesign/start/getting-started.html
- The header shows the name with its icon, SIMULATION or LIVE in capitals, "You are interacting with an AI system" in a lilac tag (vc-tag--feature), the How it works button and the theme toggle. The layout, with code: https://victorpflueger.github.io/ViciDesign/start/prototypes.html#page-structure
- One sentence under the header says what the prototype does and whether its data is real.
- The work area follows the order of the story, with one primary action for the next step. Lilac marks what the AI generated, suggested or summarised.
- When a step of the AI has consequences, such as paying money or sending a message, a person approves it and the prototype logs who did what.
- Use open-source or synthetic data only, never a client's or internal data, and label what is synthetic or simulated.
- If it can run live, it asks at the start: simulation or live. A live run takes an API key for this session only and never stores it.
- Test it at 1920 × 1080 and 1280 × 720 in both themes, and keep text at Vici's sizes or larger: the room reads it from a distance.
- Its favicon is its icon in a hexagon in the colour of its kind, as on its card on Victor's website: lilac for a prototype, fjord for a demo, teal for a tech showcase.
- Write British English or German throughout, following https://victorpflueger.github.io/ViciDesign/guidelines/writing.html. Nothing may look generated.
- It runs on GitHub Pages and doesn't link to its own repository. Its README says what is real and what is simulated.

## Check it

From the prototype's folder, with the ViciDesign clone beside it:

- guideProblems(html) from ../ViciDesign/scripts/lib/guide.mjs, bylineProblems(html) from ../ViciDesign/scripts/lib/byline.mjs and writingProblems(html) from ../ViciDesign/scripts/lib/writing.mjs each return an empty list for every page.
- node ../ViciDesign/scripts/check-guide-render.mjs http://localhost:8000/ tests the guide in a browser while the prototype is served there.

## Review it as a partner would

Before you call it done, review it cold, at 1280 × 720, as a consultancy partner who has to present it tomorrow:

1. Write the One Thing: one sentence on what it shows the customer, with the key figure that proves it.
2. Walk every step as the dumbest user possible. Where they can't say what it is doing, what it is worth or which key figure moved, fix the step or cut it.
3. Count the steps until a key figure first moves, and cut every step that doesn't move the story.
4. Check that the case survived the cuts: every figure comes from the prototype's own data, and its evidence is one click away.
5. Look at the screens nobody demos: loading, empty, a failed live run, the other theme.
6. Present it once along the guide's script, with a timer.

Report a verdict (ready or not ready), the One Thing, whether it keeps its promise, a cut list, a ranked fix list and a keep list. The byline, the talk track and the key figures are always on the keep list. The full review: https://victorpflueger.github.io/ViciDesign/start/prototypes.html#partner-review
