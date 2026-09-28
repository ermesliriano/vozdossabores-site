# Voz dos Sabores · site

Static one-page site in two languages. No build step, no database. Upload:

    index.html      ← Portuguese (PT-PT) version, all the text
    en/index.html   ← English version (keep in step with the PT file)
    style.css       ← colours and fonts (variables at the top), shared by both
    main.js         ← gentle motion: shapes enter on scroll, light parallax,
                      Instagram gallery buttons, current-section highlight
    img/            ← logo, favicon, ilustracoes/ (web illustrations),
                      instagram/ (posters shown in the gallery)

## Editing
- Programme: in index.html AND en/index.html, each row is
  `<li><span class="t">HORA</span><span class="a">ATUAÇÃO</span></li>`.
  Copy a row to add one. The headliner row has `class="headliner"`;
  background-music rows have `class="ambient"`.
- Food projects: a commented template sits in the Gastronomia section of
  index.html. Only publish projects the organisers have approved.
- Colours / fonts: change the variables at the top of style.css.
  To use the flyer's condensed caps title font instead of Instrument Serif,
  add `Bebas+Neue` to the Google Fonts link in index.html and set
  `--f-titulo: 'Bebas Neue', sans-serif;` (and `text-transform: uppercase` on h2).

## Motion and ornaments
- The coloured organic shapes are the `<div class="deco">` blocks in each
  section. They are decoration only, sit behind the text and never take clicks.
- Size/position per shape is in its `style` attribute:
  `--s` size, `--t` distance from the top of the section, `--max` how much
  may show at the screen edge, `--k` parallax strength.
  Shapes marked `desk` are hidden on phones.
- Visitors with "reduce motion" switched on see the shapes fixed, without animation.
- Still a static site: no server, no build step. Render settings stay the same.

## Changing the Instagram gallery
Export the new poster at 480×720 (WebP or JPG), put it in `img/instagram/`,
and copy one `<li>` in the gallery block of both index files.

## Free hosting now: Render Static Site
1. Push this folder to a new GitHub repo (e.g. `vozdossabores-site`).
2. Render dashboard → New → Static Site → pick the repo.
3. Build command: leave empty. Publish directory: `.`
4. Deploy. You get `https://<name>.onrender.com`. Every push redeploys.

A static site on Render is free, does not sleep and does not use the
750 free instance hours your bot's web service uses, so both run side by side.

## Moving to The Camels later
Buy vozdossabores.pt + the smallest hosting plan, open the file manager
(or FTP), upload index.html, style.css and img/ into `public_html/`. Done.
Nothing in the site depends on Render.
