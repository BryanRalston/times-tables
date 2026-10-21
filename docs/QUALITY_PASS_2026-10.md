# Quality pass, October 2026

Audited locally on 21 October 2026 at phone width (390px) and tablet width (820px), in English and Spanish. Fresh and played profiles covered Pre-K through grade 2, plus the grade 2 path that opens the full shelf. Screens: hello, home, island map, every game’s question (and, where the round allowed it, correct, wrong, and end), boss intro, stories, tracing, wardrobe, grown-ups gate and report, each worksheet, the privacy page, and Spanish mode.

Compared with the feel of Khan Academy Kids, Duolingo ABC, Toca Boca, and Pok Pok: matte surfaces, one confident press language, large type, calm motion, and feedback you can see. Academy already had Fredoka and Nunito, real squishee art, and big tap targets. The cheap feeling came from the chrome around that art.

Question text, grade bands, and the squishee pictures were left alone. Emoji that are the question (sight words, some stories in the boards) stay, because replacing them would change the question.

## Ranked issues

1. **Glossy controls.** The Play button, pink Go buttons, speaker, Check, and several progress bars were linear gradients with a blurry glow. That is the plastic look these apps avoid. Play is now a flat green with a solid lip. Other primary actions are a flat pink with the same lip. Bars are flat teal or gold.

2. **No shared scale.** Color, type, space, radius, shadow, and motion were one-off values (radii from 2px to 999px, shadows from a 3px lip to a soft blur to a glow). `:root` now holds the scale, and the shared controls use it: press lip for buttons, soft card shadow for surfaces, 140ms press, 260ms enter.

3. **Buttons did not press.** Choices sank. The main Go, Play, speaker, pills, and cards did not. They now move down and the lip shortens. `prefers-reduced-motion: reduce` keeps the color and drops the move.

4. **Correct and the end of a round were thin.** A correct answer was a flat banner for 620ms, then the next card. Confetti was sharp scraps. The miss tone started at full volume, so it clicked. The correct beat is 880ms, the banner pops, confetti is round paper in the palette and falls more slowly, and tones fade in over a few milliseconds. A miss uses a sine pair instead of a hard triangle.

5. **A wrong answer did not change the room.** The lesson replaced the card with almost the same cream. The worked example now sits on the sun paper so “watch this” reads as its own moment.

6. **Home and island cards were flat fills.** Game tiles and islands had color and no shared depth. Cards and islands use the same soft shadow. The map’s bubble dots are gone; the ground is a quiet wash.

7. **Locked squishees were crushed to black.** `brightness(0)` made unfound pals look like broken clip art. They are a gray ghost of the same file. The picture itself is not redrawn, and nothing is stuck on top of it.

8. **The play icon was a CSS triangle.** Hello and home now use a simple filled mark in the button color.

9. **Loading was a sentence.** Lazy screens and the offline miss now use a three-dot wait, or a paper panel. The dots hold still when motion is reduced.

10. **Privacy and the worksheet index were a second, flatter site.** They used a different pink, a tighter page, and pills with no lip. They now share the cream page, the matte pink lip, and the same card shadow. Printed sheets stay black on white.

11. **Type got too small.** Card lines, the footer, and graph captions sat at 11–13px. Body copy is 17px. Those captions are at least 13px, and card lines are 15px. Story words stay large.

12. **Screens popped.** Only the question card rose, and only for 180ms. The screen itself now rises for 260ms. Reduced motion turns that off, including the buddy, boss, egg, and confetti motion that was already listed.

13. **The boss label looked like a template.** A 13px uppercase kicker sat over the fight. It is now the display face at the small text size, in sentence case. The words are unchanged.

14. **Spanish stories were a bare line.** The “stories are in English” note sits in a paper card.

15. **Emoji in some questions.** Sight words and a few boards use emoji as the picture. That is the question, not chrome, so this pass did not swap them for new art.

## Left as they were

Squishee files, costumes, and the poke squash are unchanged. No faces, stickers, or overlays were added to the art. Question generators and grade bands are unchanged. The app is still on-device: no accounts, ads, or tracking. The offline cache name moved from v7 to v8 because the styled files changed, then to v9 when the layout pass landed.

## Layout pass

The first token pass was too close to the old screens. Question cards now stretch to the phone: the prompt, the buddy, and the answer tiles share one column, and a correct answer keeps that layout while the buddy plays the existing poke squash. Home leads with a play stage, illustrated game tiles, thick progress pips, and a footer of real buttons. Stories, tracing, the grown-ups gate and report, and the privacy page use the same cards, type, and lips.
