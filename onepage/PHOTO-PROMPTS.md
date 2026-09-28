# Photo prompts: the luxury portrait set

The one-page site uses a midnight-navy and champagne-gold palette taken from the Skyora and Mr Valet work. Right now the hero uses `assets_web/hospitality/mohamed-aashiq-hospitality-portrait.webp`. It's a decent photo, but the bright office background works against the dark page. The shots below are meant to fit the palette.

## How to generate

- **Tool:** Nano Banana (Gemini image), Higgsfield Soul, or Firefly "Reference image". Use whichever keeps your face most accurate.
- **Reference photos:** upload 2–3 of these every time so the face stays yours:
  - `assets_web/hospitality/mohamed-aashiq-hospitality-portrait.webp` (front, suit)
  - `assets_web/brand/My Dp.webp` (3/4 angle, warm light)
  - `assets_web/brand/My Photo.webp` (side/over-shoulder)
- Start every prompt with the **identity line** below, then paste the shot prompt.
- Generate 4–8 variations and pick the one where the face looks like you, not a retouched stranger.

**Identity line (always include):**
> Use the uploaded photos as the exact identity reference: same face, same facial hair, same hairstyle and skin tone. Do not beautify, slim or change facial features. Photorealistic, not illustrated.

---

## 1. Hero portrait (most important)
**File name:** `hero-portrait.webp` · **Ratio:** 4:5 vertical · **Min size:** 1600 × 2000

> Editorial luxury portrait of a young South Asian creative director, waist-up, standing slightly angled to camera with a calm, confident expression. Wearing a tailored midnight-navy suit with a black open-collar shirt, no tie. Dark moody set with a deep navy (#0a1122) seamless backdrop, soft champagne-gold rim light from behind-left tracing the shoulder and hair, a large soft key light from front-right. Subtle warm haze. Shot on a medium-format camera, 85mm lens, f/2.8, shallow depth of field, rich shadows, fine film grain. Styled like a GQ Middle East or Monocle feature. Clean negative space above the head.

## 2. At-work portrait (for a future "About" block or LinkedIn)
**File name:** `at-work.webp` · **Ratio:** 3:2 horizontal · **Min size:** 2400 × 1600

> The same man seated at a dark walnut desk in a dim, high-end design studio at night, reviewing large printed brochure spreads in navy and gold laid across the desk. A calibrated monitor glows softly behind him with a blurred layout on screen. Warm brass desk lamp as the key light, city lights of Doha's Lusail skyline out of focus through floor-to-ceiling glass. Black knit polo, sleeves pushed up, a watch on the wrist. Cinematic, 35mm lens, f/2, natural pose mid-thought, not looking at camera.

## 3. Wide banner (contact section or top of LinkedIn)
**File name:** `banner-wide.webp` · **Ratio:** 21:9 · **Min size:** 2520 × 1080

> Wide cinematic portrait: the same man standing on the right third of the frame on a hotel rooftop terrace at blue hour, Lusail towers and the marina softly out of focus behind him. Midnight-navy suit, hands relaxed, looking off to the left. The left two-thirds is calm dark sky and bokeh, free for text. Colour grade: deep navy shadows, champagne highlights, no teal-orange. 50mm, f/1.8, luxury real-estate campaign look.

## 4. Social share image (the link preview on WhatsApp, LinkedIn and email)
**File name:** `og-onepage.jpg` · **Ratio:** 1.91:1 · **Exact size:** 1200 × 630

> Tight chest-up portrait of the same man on the right half of the frame, turned three-quarters toward camera, slight smile. Pure deep-navy background with a soft gold gradient glow behind the head. The left half stays empty and dark for the name and title. Studio beauty-dish lighting, crisp detail in the eyes, 105mm, f/4.

*(I'll add the name and title text on the left myself once you send it back.)*

## 5. Detail / texture shot (optional, for a section break)
**File name:** `detail-hands.webp` · **Ratio:** 16:9 · **Min size:** 2400 × 1350

> Close-up of a designer's hands turning the pages of a navy-and-gold printed property catalogue on black marble, a gold fountain pen and a pen tablet stylus nearby. One champagne spotlight from above, the rest in shadow. Macro 100mm, f/4, product-photography lighting, luxury editorial.

---

## Avoid (add as a negative prompt if the tool supports one)
> cartoon, plastic skin, over-smoothed face, extra fingers, distorted hands, text, watermark, logos, teal-orange grade, harsh flash, cluttered background, changed facial structure, lighter skin tone

## Sending them back
Drop the files in `assets_web/brand/` using the file names above and tell me. I'll swap the hero, add the banner and share image, and resize everything to web sizes (`@640`, `@1280` and full).
