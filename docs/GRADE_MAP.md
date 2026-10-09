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

## Counting

Levels: count squishees to 10, count to 20, more or less, before and after, dot patterns, ten-frames, build a ten-frame.

Counted groups and ten-frames use the child's squishee. Dot patterns stay dots, because that is the subitizing model. This game stops at 20. Skip-counting by 5s, 10s, and 100s is not a level yet.

| Grade | Offer | Start | Core levels | Standards |
|---|---|---|---|---|
| K | Play | Count to 10 | Count to 10, count to 20, more or less | K.CC.A.2, K.CC.B.4, K.CC.B.5, K.CC.C.6 |
| 1 | Play | Count to 20 | Count to 20, more or less, before and after | 1.NBT.A.1, 1.NBT.B.3 |
| 2 | Play | Ten-frames | Ten-frames, build a ten-frame | 2.NBT.A.1 |
| 3 | Play | Before and after | Before and after | 1.NBT.A.1 |

Kindergarten can drift to before and after. Ten-frames wait until grade 2 unless challenge ahead is on. Grade 3 is a review of the count sequence, not a new skill.

## Place Value

Levels: tens and ones with base-ten blocks, expanded form, compare, round to 10, round to 100, build a number.

Tens-and-ones blocks stay under 100. Expanded form and compare also use numbers through 999, which is the grade 2 standard. Hundreds flats are not a hands-on level yet.

| Grade | Offer | Start | Core levels | Standards |
|---|---|---|---|---|
| K | Coming later | — | — | 1.NBT.B.2 is the first tens-and-ones standard |
| 1 | Play | Tens and ones | Tens and ones only | 1.NBT.B.2 |
| 2 | Play | Expanded form | Expanded form, compare | 2.NBT.A.1, 2.NBT.A.3, 2.NBT.A.4 |
| 3 | Play | Round to 10 | Round to 10, round to 100 | 3.NBT.A.1 |

Grade 1 does not climb into expanded form. Grade 2 can drift back to the blocks and does not round. Rounding to 10 or 100 starts at grade 3. Build-a-number is the one-level drift above rounding.

## Shapes

Levels: flat shapes, solid shapes, sides and corners, symmetry, halves thirds and fourths.

Halves and fourths of a shape for grade 1 live in Fractions. This game's partition level is the grade 3 shape partition (3.G.A.2).

| Grade | Offer | Start | Core levels | Standards |
|---|---|---|---|---|
| K | Play | Flat shapes | Flat shapes, solid shapes | K.G.A.2, K.G.B.4 |
| 1 | Play | Solid shapes | Solid shapes, sides and corners | 1.G.A.1 |
| 2 | Play | Sides and corners | Sides and corners, symmetry | 2.G.A.1 |
| 3 | Play | Halves, thirds, fourths | That level | 3.G.A.2 |

Kindergarten can drift to sides and corners. They do not partition shapes unless challenge ahead is on.

## Fractions

Levels: parts of a whole, unit fractions, number line, compare, equivalent fractions, shade a fraction.

Denominators are only 2, 3, 4, 6, and 8. Fifths, tenths, and smaller parts are not choices.

| Grade | Offer | Start | Core levels | Standards |
|---|---|---|---|---|
| K | Coming later | — | — | 1.G.A.3 is the first fraction standard |
| 1 | Gentle intro | Parts of a whole | Halves and fourths only | 1.G.A.3 |
| 2 | Play | Number line | Unit fractions, number line, compare | 2.G.A.3 |
| 3 | Play | Equivalent fractions | Equivalent fractions, shade a fraction | 3.NF.A.1, 3.NF.A.2, 3.NF.A.3 |

Grade 1 does not climb. Grade 2 uses halves, thirds, and fourths, and the cap stops them before equivalent fractions. Sixths and eighths start at grade 3.

## Measurement and Data

Levels: longer or shorter, picture graph, bar graph, measure with a ruler, how many more.

Clocks and coins stay in Telling Time and Money. Line plots, area, and perimeter are not levels yet.

| Grade | Offer | Start | Core levels | Standards |
|---|---|---|---|---|
| K | Play | Longer or shorter | Longer or shorter only | K.MD.A.1, K.MD.A.2 |
| 1 | Play | Picture graph | Picture graph, bar graph | 1.MD.C.4 |
| 2 | Play | Measure with a ruler | That level | 2.MD.A.1 |
| 3 | Play | Bar graph | Bar graph, how many more | 3.MD.B.3 |

The ruler sits after the graphs, so grade 1 can drift down to longer or shorter and cannot reach the ruler. Grade 2 can drift into the graphs and into how many more.

## Phonics

Levels: letter sounds, beginning sounds, rhyming words, CVC blending, ending sounds.

Kindergarten and grade 1 hear the sound and tap a picture. The word is not printed on those choices. Rhyming words and CVC blending, which show the letters, start at grade 2. A speaker reads the sound, and the sound is written out when the device has no voice.

| Grade | Offer | Start | Core levels | Cap without challenge | Standards |
|---|---|---|---|---|---|
| K | Play | Letter sounds | Letter sounds, beginning sounds | Beginning sounds | RF.K.2.A, RF.K.3.A |
| 1 | Play | Beginning sounds | Beginning sounds | Beginning sounds | RF.1.2.B, RF.1.2.C |
| 2 | Play | CVC blending | Rhyming words, CVC blending | CVC blending | RF.2.3.A, RF.2.3.B |
| 3 | Play | CVC blending | CVC blending, ending sounds | Ending sounds | RF.3.3.A, RF.3.3.C |

## Word Problems

Levels: add stories, subtract stories, multiply stories, share stories, picture stories.

Every story has a picture. Kindergarten and grade 1 hear the story as well as see it. Add stories stay within 10. Subtract stories take away no more than the start amount. Multiply stories use factors 1–5. Share stories divide evenly.

| Grade | Offer | Start | Core levels | Cap without challenge | Standards |
|---|---|---|---|---|---|
| K | Play | Add stories | Add stories | Add stories | K.OA.A.2 |
| 1 | Play | Add stories | Add stories, subtract stories | Subtract stories | 1.OA.A.1 |
| 2 | Play | Subtract stories | Subtract stories, multiply stories | Multiply stories | 2.OA.A.1 |
| 3 | Play | Picture stories | Share stories, picture stories | Picture stories | 3.OA.A.3 |

Two-step problems and sums within 100 are not levels yet. Kindergarten and grade 1 do not see multiply or share stories.
