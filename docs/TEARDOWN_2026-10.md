# Leader check, October 2026

## 22 October 2026

Checked again against the live site at https://squisheeacademy.com (deployed commit `3e2a842`, the quality pass) and a local play of the fixes in this change. Fresh profiles at Pre-K, kindergarten, grade 2, and grade 4, in English and Spanish, at 390px and 820px. Tablet grade 2 and grade 4 in Spanish were replayed locally after the live host returned 429s. No page scrolled sideways. No request left the site’s own origin.

Sources read that day: the Khan Academy Kids Play listing (5,000+ activities, ages 2–8, books in English and Spanish), the Khan Kids help article “Spanish books” (updated 20 February 2026) and “Learn more about the books” (updated 26 February 2026, 300+ books), the PBS KIDS Games App Store listing (280+ games, ages 2–8, 50+ in Spanish), the SplashLearn homepage (preschool through grade 5), the Prodigy Math page (grades 1–8; the math questions stay free, and an optional membership adds goals, rewards, and extra parent reports), and Duolingo ABC’s App Store listing plus its privacy page (preschool through grade 2, tracing, stories, offline, no ads; optional speaking uses Apple’s on-device speech recognition).

Since 19 October the shelf gained read-along books, finger tracing, a month-by-month grown-ups report, questions split off the first script, and the quality pass. The hello screen shows English and Español. Variables has its study pal. The live first script is 418 kB, down from about 915 kB. The “cuántos zanahorias / cuántos serpientes” lines already say “cuántas”, and those clips were already on the site. This pass fixed the same kind of agreement on shaded fractions (“un medio está sombreado”, “dos cuartos están sombreados”) and recorded the new `ef_dora` clips. Shapes no longer asks a child to “find the same shape” when the task is a line of symmetry, where the star is, or the name of a rhombus or trapezoid.

### Ranked gaps

These still fit a free, on-device product. They are not small fixes. A new graphs game is not on this list; picture and bar graphs are already in Measure, and another pass is adding data questions.

1. **Spanish read-along books.** Khan’s library help page (updated 20 February 2026) describes dozens of Spanish storybooks with read-aloud, on top of hundreds of English books. Academy has eight English books, two each for Pre-K, kindergarten, grade 1, and grade 2. Español hides the shelf. Spanish books need their own recorded lines before they can play offline.

2. **A wider shelf of short activities.** Khan Kids is 5,000+ activities through about grade 2. PBS KIDS Games is 280+ games across math, reading, science, art, and feelings, with 50+ in Spanish. Academy is 14 games plus the books and one next skill. New subjects would be a new product, not a patch on this one.

3. **A check that the child said it.** Duolingo ABC asks the child to say a letter or word and grades it with on-device speech recognition. Academy speaks with recorded clips and never listens. A cloud speech service would break the no-network rule. An on-device check, only where the browser can do it with no upload, is the version that still fits.

4. **The first visit is still heavy after the script split.** The live first script is 418 kB. Shared voice clips are about 5.3 MB and load with the first visit, and the fonts sit beside them. Later games and Spanish stay lazy. Cutting that shared set without leaving a silent first round is the remaining download gap.

5. **Grade 4 is real skills, not a second product.** SplashLearn’s public path runs preschool through grade 5. Prodigy wraps a longer curriculum in a quest, and a membership is what adds the parent dashboard and the extra rewards. Academy’s grade 4 questions (elapsed time, thousands, area, angles) are free and on the device. Do not add an account, a paywall, or a second currency to copy the quest wrapper.

6. **Books and tracing stop early.** The books end at grade 2. Tracing is one hands card inside a round, not a handwriting path through every letter the way Duolingo ABC sequences it. Extending either one is its own project, with new clips for every new line.

## 19 October 2026

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

The “how many more” questions still said “cuántos zanahorias” and “cuántos serpientes” on this date. That wording, and the clips, were corrected before 22 October. See the section above.
