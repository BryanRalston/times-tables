# Grade map

Squishee Academy is for kindergarten through grade 3. The grade picker chooses the **starting level** and the **levels a game may serve**. Adaptive play can move **one level** outside that core band. It does not keep climbing. A grown-up can turn on **Challenge ahead** in Settings to open the higher levels.

Standards below are Common Core. Sight words use the Dolch lists. Grade 2 adds Fry words that are not already on a Dolch list. Grade 3 does the same with the next Fry band.

`src/academy/grade-guard.test.ts` builds 200 questions for every registered game and grade and checks these bounds.

## How a grade plays

| Offer | What the child sees |
|---|---|
| Play | The core levels, plus one level easier and one level harder |
| Gentle intro | Only the intro level. No climb into the full game |
| Coming later | The card stays locked. Challenge ahead can open it |

## Add & Subtract

Levels, easy to hard: within 5, within 10, within 20, tens and ones, within 100.

Tens and ones is a two-digit number plus a one-digit number, or plus a multiple of 10, with sums and differences inside 100 (1.NBT.C.4, 1.NBT.C.6). Two-digit plus two-digit regrouping starts at within 100 (2.NBT.B.5). Grade 3 fluency within 1000 (3.NBT.A.2) is not a separate level yet. Within 100 is the top of this game.

| Grade | Start | Core levels | Standards |
|---|---|---|---|
| K | Within 5 | Within 5, within 10 | K.OA.A.2, K.OA.A.5 |
| 1 | Within 10 | Within 10, within 20 | 1.OA.C.6, 1.NBT.C.4 |
| 2 | Within 20 | Within 20, tens and ones, within 100 | 2.OA.B.2, 2.NBT.B.5 |
| 3 | Within 100 | Tens and ones, within 100 | 3.NBT.A.2 |

A kindergartner can drift up to within 20. They cannot reach tens-and-ones or within 100 unless challenge ahead is on. Grade 1 can drift up to tens and ones, not to two-digit regrouping.

## Times Tables

Levels: 2s, 5s, and 10s kept small (products to 20), then 2s, 5s, and 10s, then a mix through 5s, then facts through 10×10.

Multiplication facts are a grade 3 standard (3.OA.C.7). Grade 2 works with equal groups and arrays (2.OA.C.4) and skip-counts (2.NBT.A.2). Kindergarten does not play this game.

| Grade | Offer | Start | Core levels | Standards |
|---|---|---|---|---|
| K | Coming later | — | — | K.CC.A.1 is counting, not × |
| 1 | Gentle intro | 2s, 5s, 10s · small | That level only | 1.OA.C.5, foundation for 2.OA.C.4 |
| 2 | Play | 2s, 5s, 10s | Small groups, then 2s, 5s, 10s | 2.OA.C.4, 2.NBT.A.2 |
| 3 | Play | Up to 10s | Mix through 5s, then up to 10s | 3.OA.A.1, 3.OA.C.7 |

Grade 2 can drift into the mix (2s, 3s, 4s, 5s, 10s). On every level before “Up to 10s,” the other factor is 1–5 or 10. Facts with 6, 7, 8, or 9 stay on the grade 3 level.

## Telling Time

Levels: hours, half hours, quarter hours, nearest 5 minutes.

To the nearest minute (3.MD.A.1) is not a level yet. Five-minute clocks are the top, and they are a grade 2 skill (2.MD.C.7).

| Grade | Offer | Start | Core levels | Standards |
|---|---|---|---|---|
| K | Gentle intro | Hours | Hours only | Informal. 1.MD.B.3 is the first clock standard |
| 1 | Play | Half hours | Hours, half hours | 1.MD.B.3 |
| 2 | Play | Quarter hours | Quarter hours, 5 minutes | 2.MD.C.7 |
| 3 | Play | 5 minutes | Quarter hours, 5 minutes | 2.MD.C.7, 3.MD.A.1 |

Grade 1 can drift to quarter hours (:15 and :45). A 5-minute clock (:05, :10, :20, and the rest) waits until grade 2 unless challenge ahead is on.

## Money

Levels: name the coins, count coins, make an amount, make change, dollars and cents.

Counting on the grade 1 level stays at 50¢ or less, with at most one quarter. Making change and reading dollars start at grade 2 (2.MD.C.8). The name-the-coin hands-on task is one coin, not a pile to add up.

| Grade | Offer | Start | Core levels | Standards |
|---|---|---|---|---|
| K | Gentle intro | Name the coins | Name only | Coin names. 2.MD.C.8 is the money standard |
| 1 | Play | Count coins | Name, count | Leads to 2.MD.C.8 |
| 2 | Play | Make an amount | Make, change, dollars | 2.MD.C.8 |
| 3 | Play | Dollars and cents | Change, dollars | 2.MD.C.8 |

Grade 1 can drift into making an amount. Make-change and dollar amounts stay grade 2 and 3.

## Sight Words

Levels follow Dolch, then Fry:

| Level | List |
|---|---|
| Pre-primer | Dolch pre-primer (kindergarten) |
| Primer | Dolch primer (kindergarten) |
| 1st grade | Dolch first grade |
| 2nd grade | Dolch second grade, plus Fry words not already listed |
| 3rd grade | Dolch third grade, plus Fry words not already listed |

Pre-primer, primer, and 1st grade questions are spoken. The child taps the word they hear, or a picture. They are not asked to read a sentence. Sentence fill starts at the 2nd grade list.

| Grade | Start | Core levels | Cap without challenge | Standards |
|---|---|---|---|---|
| K | Pre-primer | Pre-primer, primer | Primer | RF.K.3.C |
| 1 | Primer | Primer, 1st grade | 1st grade | RF.1.3.G |
| 2 | 2nd grade | 1st grade, 2nd grade | One level up (3rd grade list) | RF.2.3.F |
| 3 | 3rd grade | 2nd grade, 3rd grade | 3rd grade | RF.3.3.D |

The cap keeps a kindergartner off the 1st grade list, and a 1st grader off the 2nd grade list, unless challenge ahead is on.

## Spelling

Levels: CVC, digraphs, blends, long vowels, grade 2–3 patterns.

CVC, digraphs, blends, and long-vowel words are spoken. The sentence is not printed on those levels. Grade 2–3 patterns show the sentence.

| Grade | Start | Core levels | Cap without challenge | Standards |
|---|---|---|---|---|
| K | CVC | CVC | One level up (digraphs) | RF.K.3.A |
| 1 | Digraphs | CVC through long vowels | Long vowels | RF.1.3.A, RF.1.3.B, RF.1.3.C |
| 2 | Long vowels | Blends, long vowels, patterns | Patterns | RF.2.3.A, RF.2.3.B, RF.2.3.F |
| 3 | Patterns | Long vowels, patterns | Patterns | RF.3.3.A, RF.3.3.C |

## Games not in the registry yet

When counting, place value, shapes, fractions, measurement, phonics, or word problems land, add a band in `src/academy/grade-map.ts` and extend `grade-guard.test.ts`. The guard test already fails typecheck if a question uses a new visual kind.

| Game | Kindergarten | Grade 1 | Grade 2 | Grade 3 |
|---|---|---|---|---|
| Counting | Count objects to 20. K.CC | Count to 120. 1.NBT.A.1 | Skip-count by 5s, 10s, and 100s. 2.NBT.A.2 | Review |
| Place value | Teen numbers. K.NBT.A.1 | Tens and ones. 1.NBT.B | Hundreds. 2.NBT.A.1 | Round to 10 and 100. 3.NBT.A.1 |
| Shapes | Name shapes. K.G | Halves and fourths of shapes. 1.G.A.3 | Halves, thirds, fourths. 2.G.A.3 | Categories. 3.G |
| Fractions | Coming later | Gentle intro: halves and fourths only. 1.G.A.3 | Halves, thirds, fourths. 2.G.A.3 | Denominators 2, 3, 4, 6, and 8 only. 3.NF |
| Measurement and data | Compare length. K.MD | Length, hours and half hours. 1.MD | Length, 5-minute time, money, line plots. 2.MD | Graphs, area, perimeter. Nearest minute when that level exists. 3.MD |
| Phonics | Same band as Spelling | Same band as Spelling | Same band as Spelling | Same band as Spelling |
| Word problems | One step, within 10, spoken with a picture. K.OA.A.2 | One step, within 20. 1.OA.A.1 | One or two steps, within 100. 2.OA.A.1 | Two steps, all four operations. 3.OA.D.8 |

Fraction questions must not use fifths, tenths, or any denominator outside 2, 3, 4, 6, and 8.
