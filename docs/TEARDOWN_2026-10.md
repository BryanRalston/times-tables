# Leader check, October 2026

Checked on 19 October 2026 against the live Academy site and a local playtest at phone width (390px) and tablet width (820px). Fresh profiles at Pre-K, kindergarten, grade 2, and grade 4, in English and Spanish. Sources: the Khan Academy Kids store listing (updated 25 September 2026), the Khan Academy early-learning roundup, PBS KIDS Games descriptions (280+ games, ages 2–8), the Prodigy Math site, the SplashLearn homepage (preschool to grade 5), and library writeups of Duolingo ABC. Duolingo’s public math page did not return a feature list that day.

Academy is still the free, on-device path: one Play button, pictures, a short round, no ads, no accounts, no calls except the static site. The leaders are ahead in the ways below. These are left as later work. They are not small fixes.

## Ranked gaps

1. **Reading that goes past one word.** Khan Academy Kids pairs games with a storybook library and read-aloud in English and Spanish. Duolingo ABC adds letter tracing and a check that the child said the sound. Academy has phonics, sight words, and spelling tiles. It has no books, no finger tracing, and no “say it back” check.

2. **A wide shelf of short activities.** Khan Kids is thousands of activities through about grade 2. PBS KIDS Games is hundreds of math, reading, science, art, and feelings games, with a light path. Academy is 14 games and one next skill. More subjects would be a new product, not a patch.

3. **The first JavaScript file is still one chunk, about 915 kB on the live site.** Splitting one file per game is not a clear win yet. The registry imports every game, and the play screen, hands-on boards, and worked examples import them too, so the home screen still needs that code. A split would also move the shapes module while its levels are being extended. Extra chunks can be precached later. Split the shared screens from the questions after that shapes work lands.

4. **Grown-up tools stay a weekly page on this device.** Prodigy, SplashLearn, and Khan Kids keep assignments, class lists, and reports in an account. Academy will not add accounts or a network. A deeper on-device history (month by month, standards named on the report) is the gap that still fits the product.

5. **Spanish is the whole interface, and the hello screen hides it on an English browser.** The language buttons show up when the browser’s first language is Spanish. Otherwise a family finds Español in Settings or behind the grown-ups gate. Khan’s Spanish read-aloud library is the larger version of this gap.

6. **Variables has a boss and counts toward “3 stars in every game,” and the book has no friend for it.** A new study pal needs a spoken line and a clip. Adding the face without the voice would leave a silent buddy.

7. **Public worksheet titles and game blurbs still say K–3.** The home description and the install card now say Pre-K to grade 4. The worksheets index, per-game blurbs, and many page titles do not, so grade 4 skills (elapsed time, thousands, money problems, area) are easy to miss in search. That sweep touches locked page tests and should be its own pass.

8. **Prodigy and SplashLearn feel larger because a membership unlocks pets, looks, or the rest of the path.** Academy’s looks are all earnable and the questions stay free. Do not add a paywall, an account, or a second currency to chase that feeling.

The “how many more” questions still say “cuántos zanahorias” and “cuántos serpientes.” The recorded Spanish clips use that wording. A grammar fix needs new clips, or the speaker goes quiet offline.
