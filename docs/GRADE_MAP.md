# Grade map

Squishee Academy is for Pre-K through grade 4. The grade picker chooses the **starting level** and the **levels a game may serve**. Adaptive play can move **one level** outside that core band. It does not keep climbing. A grown-up can turn on **Challenge ahead** in Settings to open the higher levels.

Pre-K (ages 3–5) is spoken, with pictures, huge tap targets, and short rounds. Games that need reading or later math stay **coming later**: times, addition, clocks, fractions, place value, sight words, spelling, and word problems. Coin names are a gentle intro. Counting stops at 10.

Grade 4 follows Common Core 4.OA, 4.NBT, 4.NF, 4.MD, 4.G, and RF/L. Where the next level is a grade 4 standard, grade 3 has a cap so one-level drift does not land there. Addition is the exception: grade 3 can drift into within 1000 (3.NBT.A.2). Four-digit work stays grade 4.

Saved games from version 9 keep their grade. Version 10 only adds Pre-K and grade 4.

Standards below are Common Core. Sight words use the Dolch lists. Grade 2 adds Fry words that are not already on a Dolch list. Grade 3 does the same with the next Fry band.

`src/academy/grade-guard.test.ts` builds 200 questions for every registered game and grade and checks these bounds.

## How a grade plays

| Offer | What the child sees |
|---|---|
| Play | The core levels, plus one level easier and one level harder |
| Gentle intro | Only the intro level. No climb into the full game |
| Coming later | The card stays locked. Challenge ahead can open it |

## Add & Subtract

Levels, easy to hard: within 5, within 10, within 20, tens and ones, within 100, within 1000, thousands.

Tens and ones is a two-digit number plus a one-digit number, or plus a multiple of 10, with sums and differences inside 100 (1.NBT.C.4, 1.NBT.C.6). Two-digit plus two-digit regrouping starts at within 100 (2.NBT.B.5). Within 1000 is the grade 3 fluency band (3.NBT.A.2). Thousands is four-digit addition and subtraction (4.NBT.B.4).

| Grade | Offer | Start | Core levels | Standards |
|---|---|---|---|---|
| Pre-K | Coming later | — | — | Leads to K.OA.A.2 |
| K | Play | Within 5 | Within 5, within 10 | K.OA.A.2, K.OA.A.5 |
| 1 | Play | Within 10 | Within 10, within 20 | 1.OA.C.6, 1.NBT.C.4 |
| 2 | Play | Within 20 | Within 20, tens and ones, within 100 | 2.OA.B.2, 2.NBT.B.5 |
| 3 | Play | Within 100 | Tens and ones, within 100 | 3.NBT.A.2 |
| 4 | Play | Within 1000 | Within 1000, thousands | 4.NBT.B.4 |

A kindergartner can drift up to within 20. They cannot reach tens-and-ones or within 100 unless challenge ahead is on. Grade 1 can drift up to tens and ones, not to two-digit regrouping. Grade 3 can drift one level into within 1000. Thousands stays grade 4 unless challenge ahead is on.

## Times Tables

Levels: 2s, 5s, and 10s kept small (products to 20), then 2s, 5s, and 10s, then a mix through 5s, then facts through 10×10, then factors and multiples, multi-digit multiplication, and division with remainders.

Multiplication facts are a grade 3 standard (3.OA.C.7). Grade 2 works with equal groups and arrays (2.OA.C.4) and skip-counts (2.NBT.A.2). Pre-K and kindergarten do not play this game. Grade 4 covers factors and multiples (4.OA.B.4), multi-digit multiplication (4.NBT.B.5), and division with remainders (4.NBT.B.6).

| Grade | Offer | Start | Core levels | Standards |
|---|---|---|---|---|
| Pre-K | Coming later | — | — | Counting, not × |
| K | Coming later | — | — | K.CC.A.1 is counting, not × |
| 1 | Gentle intro | 2s, 5s, 10s · small | That level only | 1.OA.C.5, foundation for 2.OA.C.4 |
| 2 | Play | 2s, 5s, 10s | Small groups, then 2s, 5s, 10s | 2.OA.C.4, 2.NBT.A.2 |
| 3 | Play | Up to 10s | Mix through 5s, then up to 10s | 3.OA.A.1, 3.OA.C.7 |
| 4 | Play | Factors and multiples | Factors, multi-digit multiply, division with remainders | 4.OA.B.4, 4.NBT.B.5, 4.NBT.B.6 |

Grade 2 can drift into the mix (2s, 3s, 4s, 5s, 10s). On every level before “Up to 10s,” the other factor is 1–5 or 10. Facts with 6, 7, 8, or 9 stay on the grade 3 level. Grade 3 is capped at 10×10, so it does not drift into factors. Grade 4 can drift one level down into 10×10.

## Telling Time

Levels: hours, half hours, quarter hours, nearest 5 minutes, elapsed time.

Five-minute clocks are a grade 2 skill (2.MD.C.7). Elapsed time is grade 4 (4.MD.A.2). Pre-K does not play clocks.

| Grade | Offer | Start | Core levels | Standards |
|---|---|---|---|---|
| Pre-K | Coming later | — | — | Clocks wait |
| K | Gentle intro | Hours | Hours only | Informal. 1.MD.B.3 is the first clock standard |
| 1 | Play | Half hours | Hours, half hours | 1.MD.B.3 |
| 2 | Play | Quarter hours | Quarter hours, 5 minutes | 2.MD.C.7 |
| 3 | Play | 5 minutes | Quarter hours, 5 minutes | 2.MD.C.7, 3.MD.A.1 |
| 4 | Play | Elapsed time | Elapsed time | 4.MD.A.2 |

Grade 1 can drift to quarter hours (:15 and :45). A 5-minute clock (:05, :10, :20, and the rest) waits until grade 2 unless challenge ahead is on.

## Money

Levels: name the coins, count coins, make an amount, make change, dollars and cents, money problems.

Pre-K names coins only. Money problems (two prices, sometimes change from $5 or $10) are grade 4 (4.MD.A.2).

Counting on the grade 1 level stays at 50¢ or less, with at most one quarter. Making change and reading dollars start at grade 2 (2.MD.C.8). The name-the-coin hands-on task is one coin, not a pile to add up.

| Grade | Offer | Start | Core levels | Standards |
|---|---|---|---|---|
| Pre-K | Gentle intro | Name the coins | Name only | Coin names. Amounts wait |
| K | Gentle intro | Name the coins | Name only | Coin names. 2.MD.C.8 is the money standard |
| 1 | Play | Count coins | Name, count | Leads to 2.MD.C.8 |
| 2 | Play | Make an amount | Make, change, dollars | 2.MD.C.8 |
| 3 | Play | Dollars and cents | Change, dollars | 2.MD.C.8 |
| 4 | Play | Money problems | Money problems | 4.MD.A.2 |

Grade 1 can drift into making an amount. Make-change and dollar amounts stay grade 2 and 3. Grade 2 and grade 3 are capped at dollars and cents, so they do not drift into money problems. Grade 4 can drift one level down into dollars and cents.

## Sight Words

Levels follow Dolch, then Fry:

| Level | List |
|---|---|
| Pre-primer | Dolch pre-primer (kindergarten) |
| Primer | Dolch primer (kindergarten) |
| 1st grade | Dolch first grade |
| 2nd grade | Dolch second grade, plus Fry words not already listed |
| 3rd grade | Dolch third grade, plus Fry words not already listed |
| Grade 4 | Academic vocabulary (predict, habitat, perimeter, and the rest) |

Pre-primer, primer, and 1st grade questions are spoken. The child taps the word they hear, or a picture. They are not asked to read a sentence. Sentence fill starts at the 2nd grade list.

| Grade | Start | Core levels | Cap without challenge | Standards |
|---|---|---|---|---|
| K | Pre-primer | Pre-primer, primer | Primer | RF.K.3.C |
| 1 | Primer | Primer, 1st grade | 1st grade | RF.1.3.G |
| 2 | 2nd grade | 1st grade, 2nd grade | One level up (3rd grade list) | RF.2.3.F |
| 3 | 3rd grade | 2nd grade, 3rd grade | 3rd grade | RF.3.3.D |
| 4 | Grade 4 vocabulary | Grade 4 vocabulary | One level down (3rd grade list) | RF.4.3.A, L.4.4, L.4.6 |
| Pre-K | Coming later | — | — | Reading waits |

The cap keeps a kindergartner off the 1st grade list, and a 1st grader off the 2nd grade list, unless challenge ahead is on.

## Spelling

Levels: CVC, digraphs, blends, long vowels, grade 2–3 patterns, grade 4 words.

Grade 4 words stay at six letters or fewer (silent letters, prefixes, and common patterns) and show the sentence. Pre-K spelling is coming later.

CVC, digraphs, blends, and long-vowel words are spoken. The sentence is not printed on those levels. Grade 2–3 patterns show the sentence.

| Grade | Start | Core levels | Cap without challenge | Standards |
|---|---|---|---|---|
| K | CVC | CVC | One level up (digraphs) | RF.K.3.A |
| 1 | Digraphs | CVC through long vowels | Long vowels | RF.1.3.A, RF.1.3.B, RF.1.3.C |
| 2 | Long vowels | Blends, long vowels, patterns | Patterns | RF.2.3.A, RF.2.3.B, RF.2.3.F |
| 3 | Patterns | Long vowels, patterns | Patterns | RF.3.3.A, RF.3.3.C |
| 4 | Grade 4 words | Grade 4 words | One level down (patterns) | RF.4.3.A, L.4.2 |
| Pre-K | Coming later | — | — | Spelling waits |

## Read-along stories

Stories are short books, not an island game. Pre-K, kindergarten, grade 1, grade 2, grade 3, and grade 4 each have books. A child sees books at their grade and every easier book.

Each page is read from recorded word clips, with the current word lit. A miss on the picture check shows that page again. There is no timer and no fail screen. Finishing adds stars, coins, and friendship the same way a round does, and the grown-ups report lists the books.

A word in a book has to be one of these:

- a sight word at or below the book’s grade (Pre-K is pre-primer, kindergarten goes through primer, grade 1 through 1st grade, grade 2 through 2nd grade, grade 3 through 3rd grade, grade 4 through the grade 4 list)
- a phonics picture noun from the sound bank
- a CVC word from the rhyme families
- a spelling word at or below the book’s grade (Pre-K has none, kindergarten is CVC, grade 1 goes through long vowels, grade 2 and grade 3 go through patterns, grade 4 adds grade 4 spelling)
- the single-word name of a squishee in that book

Grade 4 vocabulary and grade 4 spelling stay out of the grade 3 books. `src/academy/stories/stories.test.tsx` checks every page, question, and clip.

Read-along books play in every language on the shelf. The pictures stay the same, character names stay, and each word uses that language's recorded clip. Arabic pages run right to left. See `docs/LANGUAGE.md`.

## Counting

Levels: count squishees to 10, count to 20, more or less, before and after, dot patterns, ten-frames, build a ten-frame.

Counted groups and ten-frames use the child's squishee. Dot patterns stay dots, because that is the subitizing model. This game stops at 20. Skip-counting by 5s, 10s, and 100s is not a level yet.

| Grade | Offer | Start | Core levels | Standards |
|---|---|---|---|---|
| Pre-K | Play | Count to 10 | Count to 10, capped there | K.CC.A.1, K.CC.B.4, K.CC.B.5 |
| K | Play | Count to 10 | Count to 10, count to 20, more or less | K.CC.A.2, K.CC.B.4, K.CC.B.5, K.CC.C.6 |
| 1 | Play | Count to 20 | Count to 20, more or less, before and after | 1.NBT.A.1, 1.NBT.B.3 |
| 2 | Play | Ten-frames | Ten-frames, build a ten-frame | 2.NBT.A.1 |
| 3 | Play | Before and after | Before and after | 1.NBT.A.1 |
| 4 | Play | Before and after | Before and after | 4.NBT.A.2, a review of the count sequence |

Kindergarten can drift to before and after. Ten-frames wait until grade 2 unless challenge ahead is on. Grade 3 is a review of the count sequence, not a new skill.

## Place Value

Levels: tens and ones with base-ten blocks, expanded form, compare, round to 10, round to 100, build a number, place value to 1,000,000, round large numbers.

Grade 4 reads a digit's value through the hundred thousands and rounds to the nearest thousand, ten thousand, or hundred thousand (4.NBT.A.1–3). Numbers above 1000 are spoken as existing number clips plus "thousand" or "million". Pre-K place value is coming later.

Tens-and-ones blocks stay under 100. Expanded form and compare also use numbers through 999, which is the grade 2 standard. The tens-and-ones hands-on card stays under 100. Rounding to the nearest hundred drags hundred tiles for that rounded number.

| Grade | Offer | Start | Core levels | Standards |
|---|---|---|---|---|
| Pre-K | Coming later | — | — | Place value waits |
| K | Coming later | — | — | 1.NBT.B.2 is the first tens-and-ones standard |
| 1 | Play | Tens and ones | Tens and ones only | 1.NBT.B.2 |
| 2 | Play | Expanded form | Expanded form, compare | 2.NBT.A.1, 2.NBT.A.3, 2.NBT.A.4 |
| 3 | Play | Round to 10 | Round to 10, round to 100 | 3.NBT.A.1 |
| 4 | Play | Place value to 1,000,000 | That level, then round large numbers | 4.NBT.A.1, 4.NBT.A.2, 4.NBT.A.3 |

Grade 1 does not climb into expanded form. Grade 2 can drift back to the blocks and does not round. Rounding to 10 or 100 starts at grade 3. Build-a-number is the one-level drift above rounding.

## Shapes

Levels: colors, matching, simple patterns, flat shapes, solid shapes, position, flat or solid, what matters, join shapes, sides and corners, faces, rows of squares, symmetry, quadrilaterals, unit fractions, halves thirds and fourths, cover the rectangle, line of symmetry, angles.

Pre-K colors, matching, and patterns are pictures with empty labels. Kindergarten can drift one level down into patterns and is capped at flat or solid, so position words stay in kindergarten. Angles (acute, right, obtuse, straight, and 90 or 180 degrees) are grade 4 (4.G.A.1, 4.MD.C.5). Grade 3 is capped at covering a rectangle, so it does not reach angles.

Halves and fourths of a shape for grade 1 live in Fractions. This game's equal-parts level is still the grade 3 picture sort (3.G.A.2). Unit fractions of equal areas are the new share level. Rows of squares count a small tiled rectangle (2.G.A.2). Cover the rectangle uses larger rows and ties the count to multiplication (3.MD.C.5, 3.MD.C.7). Area and perimeter formulas stay in Measurement, grade 4.

| Grade | Offer | Start | Core levels | Standards |
|---|---|---|---|---|
| Pre-K | Play | Colors | Colors, matching, patterns, flat shapes | K.G.A.1, K.G.A.2 |
| K | Play | Flat shapes | Flat shapes, solid shapes, position, flat or solid | K.G.A.1, K.G.A.2, K.G.B.4 |
| 1 | Play | What matters | What matters, join shapes, sides and corners | 1.G.A.1, 1.G.A.2 |
| 2 | Play | Faces | Faces, rows of squares, symmetry | 2.G.A.1, 2.G.A.2 |
| 3 | Play | Quadrilaterals | Quadrilaterals, unit fractions, equal parts, cover the rectangle | 3.G.A.1, 3.G.A.2, 3.MD.C.5, 3.MD.C.7 |
| 4 | Play | Angles | Line of symmetry, angles | 4.G.A.1, 4.G.A.3, 4.MD.C.5 |

Kindergarten does not count sides unless challenge ahead is on. Grade 1 can drift down to flat or solid and does not count cube faces. Grade 2 can drift down to sides and corners. Grade 4 can drift down to covering a rectangle.

## Fractions

Levels: parts of a whole, unit fractions, number line, compare, equivalent fractions, shade a fraction, add like fractions, decimals to hundredths.

Kindergarten through grade 3 denominators are 2, 3, 4, 6, and 8. Grade 4 like-fractions also use 5, 10, and 12, and the sum stays at most 1. Decimals are spoken as tenths and hundredths. Pre-K fractions are coming later.

| Grade | Offer | Start | Core levels | Standards |
|---|---|---|---|---|
| Pre-K | Coming later | — | — | Fractions wait |
| K | Coming later | — | — | 1.G.A.3 is the first fraction standard |
| 1 | Gentle intro | Parts of a whole | Halves and fourths only | 1.G.A.3 |
| 2 | Play | Number line | Unit fractions, number line, compare | 2.G.A.3 |
| 3 | Play | Equivalent fractions | Equivalent fractions, shade a fraction | 3.NF.A.1, 3.NF.A.2, 3.NF.A.3 |
| 4 | Play | Add like fractions | Add like fractions, decimals | 4.NF.A.1, 4.NF.B.3, 4.NF.C.6, 4.NF.C.7 |

Grade 1 does not climb. Grade 2 uses halves, thirds, and fourths, and the cap stops them before equivalent fractions. Sixths and eighths start at grade 3. That number-line level labels every tick. The blank line, where the child counts the parts, is the Line game.

## Measurement and Data

Levels: bigger and smaller, longer or shorter, picture graph, bar graph, measure with a ruler, how many more, area, perimeter.

Pre-K compares picture sizes and is capped there. Kindergarten can drift one level down into bigger and smaller. Area and perimeter of rectangles are grade 4 (4.MD.A.3). Grade 3 is capped at how many more.

| Grade | Offer | Start | Core levels | Standards |
|---|---|---|---|---|
| Pre-K | Play | Bigger and smaller | Bigger and smaller, capped | K.MD.A.1, K.MD.A.2 |
| K | Play | Longer or shorter | Longer or shorter only | K.MD.A.1, K.MD.A.2 |
| 1 | Play | Picture graph | Picture graph, bar graph | 1.MD.C.4 |
| 2 | Play | Measure with a ruler | That level | 2.MD.A.1 |
| 3 | Play | Bar graph | Bar graph, how many more | 3.MD.B.3 |
| 4 | Play | Area | Area, perimeter | 4.MD.A.3 |

The ruler sits after the graphs, so grade 1 can drift down to longer or shorter and cannot reach the ruler. Grade 2 can drift into the graphs and into how many more.

## Data and graphs

Levels: sort, tally, picture graph, bar graph, scaled graph, line plot.

This is the hands-on data game. The child sorts pictures into the graph, then answers a question about the graph they made. Measurement still has its own read-only picture and bar graphs. Pre-K and kindergarten sort two groups and stay capped there. Grade 1 tallies up to three groups. Grade 2 builds a picture graph and a bar graph with one picture for one thing. Grade 3 reads a scale of 2 or 5. Grade 4 places fractions of a unit on a line plot.

| Grade | Offer | Start | Core levels | Cap without challenge | Standards |
|---|---|---|---|---|---|
| Pre-K | Play | Sort | Sort | Sort | K.MD.B.3 |
| K | Play | Sort | Sort | Sort | K.MD.B.3 |
| 1 | Play | Tally | Tally | Tally | 1.MD.C.4 |
| 2 | Play | Picture graph | Picture graph, bar graph | Bar graph | 2.MD.D.10 |
| 3 | Play | Scaled graph | Scaled graph | Scaled graph | 3.MD.B.3 |
| 4 | Play | Line plot | Line plot | One level down (scaled graph) | 4.MD.B.4 |

Sort asks how many are in a group, or how many are in the group with more. Tally asks how many, how many in all, and how many more or less. Picture and bar graphs ask for two groups together, the groups that are left, and how many more. A scaled graph asks for the real count, how many more or less, and a two-step compare. A line plot asks how many marks sit on a fraction, how much longer the longest is, and what the longest and shortest make together. Fractions stay in halves, fourths, and eighths, and they are not simplified.

## Phonics

Levels: letter names, letter sounds, beginning sounds, rhyming words, CVC blending, ending sounds.

Pre-K taps a spoken letter name. Kindergarten can drift one level down into letter names, and still taps pictures for sounds. Grade 1 hears the sound and taps a picture. Rhyming words and CVC blending start at grade 2. Grade 4 reviews CVC blending and ending sounds (RF.4.3.A). New grade 4 reading work lives in spelling and vocabulary.

| Grade | Offer | Start | Core levels | Cap without challenge | Standards |
|---|---|---|---|---|---|
| Pre-K | Play | Letter names | Letter names, letter sounds | Letter sounds | RF.K.1.D, RF.K.2.D |
| K | Play | Letter sounds | Letter sounds, beginning sounds | Beginning sounds | RF.K.2.A, RF.K.3.A |
| 1 | Play | Beginning sounds | Beginning sounds | Beginning sounds | RF.1.2.B, RF.1.2.C |
| 2 | Play | CVC blending | Rhyming words, CVC blending | CVC blending | RF.2.3.A, RF.2.3.B |
| 3 | Play | CVC blending | CVC blending, ending sounds | Ending sounds | RF.3.3.A, RF.3.3.C |
| 4 | Play | Ending sounds | CVC blending, ending sounds | One level down | RF.4.3.A |

## Word Problems

Levels: add stories, subtract stories, multiply stories, share stories, picture stories, two-step stories.

Pre-K word problems are coming later. Two-step stories multiply, then subtract (4.OA.A.3). Grade 3 is capped at picture stories.

Every story has a picture. Kindergarten and grade 1 hear the story as well as see it. Add stories stay within 10. Subtract stories take away no more than the start amount. Multiply stories use factors 1–5. Share stories divide evenly.

| Grade | Offer | Start | Core levels | Cap without challenge | Standards |
|---|---|---|---|---|---|
| Pre-K | Coming later | — | — | — | Word problems wait |
| K | Play | Add stories | Add stories | Add stories | K.OA.A.2 |
| 1 | Play | Add stories | Add stories, subtract stories | Subtract stories | 1.OA.A.1 |
| 2 | Play | Subtract stories | Subtract stories, multiply stories | Multiply stories | 2.OA.A.1 |
| 3 | Play | Picture stories | Share stories, picture stories | Picture stories | 3.OA.A.3 |
| 4 | Play | Two-step stories | Two-step stories | One level down (picture stories) | 4.OA.A.3 |

Kindergarten and grade 1 do not see multiply or share stories.

## What is missing

Levels: addend within 10, blank within 20, missing factor, times blank, two-step blank.

Pre-K missing numbers are coming later. Kindergarten and grade 1 stay on a missing addend within 10, with a picture of the known part and empty holes for the box. Grade 2 opens any position in addition or subtraction within 20, and a missing factor from 1 to 5. Grade 3 finds an unknown in multiplication or division through 10×10, and is capped before two-step equations. Grade 4 fills one blank in a two-step equation.

| Grade | Offer | Start | Core levels | Cap without challenge | Standards |
|---|---|---|---|---|---|
| Pre-K | Coming later | — | — | — | Missing numbers wait |
| K | Play | Addend within 10 | Addend within 10 | Addend within 10 | K.OA.A.4 |
| 1 | Play | Addend within 10 | Addend within 10 | Addend within 10 | 1.OA.D.8 |
| 2 | Play | Blank within 20 | Blank within 20, missing factor | Missing factor | 1.OA.D.8, 2.OA.C.4 |
| 3 | Play | Times blank | Missing factor, times blank | Times blank | 3.OA.A.4 |
| 4 | Play | Two-step blank | Two-step blank | One level down (times blank) | 4.OA.A.2, 4.OA.A.3 |

Kindergarten and grade 1 do not see subtraction blanks, missing factors, or two-step equations.

## Fair Shares

Levels, easy to hard: two plates, equal shares, groups of, division facts, leftovers.

The child deals cookies onto plates. Two plates uses 2, 4, or 6 cookies and asks how many land on each plate. Equal shares uses two to four plates with nothing left over. Groups of asks how many groups of 2, 5, or 10 the cookies make. Division facts asks the same equal-share question with a larger total. Leftovers leaves fewer extras than there are plates.

| Grade | Offer | Start | Core levels | Cap without challenge | Standards |
|---|---|---|---|---|---|
| Pre-K | Gentle intro | Two plates | Two plates | Two plates | K.CC.B.5 |
| K | Gentle intro | Two plates | Two plates | Two plates | K.CC.B.5 |
| 1 | Play | Two plates | Two plates | Two plates | 1.OA.C.5 |
| 2 | Play | Equal shares | Two plates, equal shares | Equal shares | 2.OA.C.3, 2.OA.C.4 |
| 3 | Play | Division facts | Groups of, division facts | Division facts | 3.OA.A.2, 3.OA.C.7 |
| 4 | Play | Leftovers | Division facts, leftovers | One level down (groups of) | 4.OA.A.3, 3.OA.C.7 |

Pre-K and kindergarten only deal two plates. Grade 1 stays there too. Grade 2 can drift down to two plates and cannot climb into groups of. Grade 3 can drift down to equal shares and cannot climb into leftovers. Grade 4 can drift down to groups of.

## Grid Garden

Levels, easy to hard: count squares, around the shape, missing side.

The shape is an irregular group of unit squares, never a filled rectangle. Count squares asks how many squares are in the shape. Around the shape asks for the distance around, counted as the outside edges. Missing side gives the area or the distance around plus one side, and asks for the other side.

| Grade | Offer | Start | Core levels | Cap without challenge | Standards |
|---|---|---|---|---|---|
| Pre-K | Coming later | — | — | — | Grid garden waits |
| K | Coming later | — | — | — | Grid garden waits |
| 1 | Coming later | — | — | — | Grid garden waits |
| 2 | Gentle intro | Count squares | Count squares | Count squares | 2.G.A.2 |
| 3 | Play | Around the shape | Count squares, around the shape | Around the shape | 3.MD.C.6, 3.MD.D.8 |
| 4 | Play | Missing side | Around the shape, missing side | One level down (count squares) | 4.MD.A.3, 3.MD.D.8 |

Pre-K through grade 1 stay locked. Grade 2 only counts squares. Grade 3 can drift down to count squares and cannot climb into a missing side. Grade 4 can drift down to count squares.

## Number Patterns

Levels, easy to hard: count by tens, count by fives, count by twos, count by hundreds, next number, the rule.

Count by tens, fives, twos, and hundreds shows three numbers and asks for the next one. Next number uses a step of 2, 3, 4, 5, or 10. The rule shows the whole row and asks which step built it.

| Grade | Offer | Start | Core levels | Cap without challenge | Standards |
|---|---|---|---|---|---|
| Pre-K | Coming later | — | — | — | Number patterns wait |
| K | Gentle intro | Count by tens | Count by tens | Count by tens | K.CC.A.1 |
| 1 | Play | Count by tens | Count by tens | Count by tens | 1.NBT.A.1 |
| 2 | Play | Count by fives | Count by fives, count by twos, count by hundreds | Count by hundreds | 2.NBT.A.2 |
| 3 | Play | Next number | Next number | Next number | 3.OA.D.9 |
| 4 | Play | The rule | The rule | One level down (next number) | 4.OA.C.5 |

Pre-K stays locked. Kindergarten and grade 1 only count by tens. Grade 2 can drift down to tens and cannot climb into next number. Grade 3 can drift down to hundreds and cannot climb into the rule. Grade 4 can drift down to next number.

## Compare

Levels, easy to hard: numbers to 10, two digits, three digits, big numbers.

The child picks the one true sentence using `<`, `=`, or `>`. Numbers to 10 show counters under the digits. Two-digit and three-digit questions show tens and hundreds. Big numbers stay on the card and are not spoken, because some languages have no clip past 1,000. A hands card puts the sign in the middle. Counting already asks which group has more. Place value already asks which number is greater, without an equals sign and without recording `<` or `>`.

| Grade | Offer | Start | Core levels | Cap without challenge | Standards |
|---|---|---|---|---|---|
| Pre-K | Coming later | — | — | — | Compare waits |
| K | Play | To 10 | To 10 | To 10 | K.CC.C.7 |
| 1 | Play | Two digits | Two digits | Two digits | 1.NBT.B.3 |
| 2 | Play | Three digits | Three digits | Three digits | 2.NBT.A.4 |
| 3 | Play | Three digits | Three digits | Three digits | 2.NBT.A.4 |
| 4 | Play | Big numbers | Big numbers | One level down (three digits) | 4.NBT.A.2 |

Pre-K stays locked. Kindergarten only compares 1 through 10. Grade 1 can drift down to 10 and cannot climb into three digits. Grades 2 and 3 can drift down to two digits and cannot climb into four digits. Grade 4 can drift down to three digits.

## 10 More

Levels, easy to hard: ten more, 100 more, 1000 more.

The child finds 10 more or 10 less, then 100 more or 100 less, then 1000 more or 1000 less. The other digits stay put. A hands card adds or takes away that one place, and Done counts even when the built number is still wrong. Skip counting already asks for the next term in a row. This game asks for one mental jump.

| Grade | Offer | Start | Core levels | Cap without challenge | Standards |
|---|---|---|---|---|---|
| Pre-K | Coming later | — | — | — | Ten more waits |
| K | Coming later | — | — | — | Ten more waits |
| 1 | Play | Ten more | Ten more | Ten more | 1.NBT.C.5 |
| 2 | Play | 100 more | Ten more, 100 more | 100 more | 2.NBT.B.8 |
| 3 | Play | 100 more | 100 more | 100 more | 2.NBT.B.8 |
| 4 | Play | 1000 more | 1000 more | One level down (100 more) | 4.NBT.A.1 |

Pre-K and kindergarten stay locked. Grade 1 only jumps by 10. Grade 2 can drift down to 10 and cannot climb into 1000. Grade 3 can drift down to 10 and cannot climb into 1000. Grade 4 can drift down to 100. The 1000 prompt says “What is 1000 more?” or “What is 1000 less?” and leaves the starting number on the card, so a language that cannot speak past 1,000 still has a clip.

## Line

Levels, easy to hard: fourths, sixths, eighths, past 1.

The child sees a number line labeled only at the wholes. The ticks between them stay blank, so the fraction is not printed under the dot. Grade 2 meets halves and fourths. Grade 3 counts sixths and eighths between 0 and 1 (3.NF.A.2). Grade 4 places a fraction on a line from 0 to 2 (4.NF.B.3). A hands card moves the dot to a spoken fraction.

| Grade | Offer | Start | Core levels | Cap without challenge | Standards |
|---|---|---|---|---|---|
| Pre-K | Coming later | — | — | — | The blank line waits |
| K | Coming later | — | — | — | The blank line waits |
| 1 | Coming later | — | — | — | The blank line waits |
| 2 | Gentle intro | Fourths | Fourths | Fourths | 2.G.A.3 |
| 3 | Play | Sixths | Sixths, eighths | Eighths | 3.NF.A.2 |
| 4 | Play | Past 1 | Past 1 | One level down (eighths) | 3.NF.A.2, 4.NF.B.3 |

Pre-K through grade 1 stay locked. Grade 2 does not climb into sixths. Grade 3 can drift down to fourths and cannot climb past 1. Grade 4 can drift down to eighths.

## Round

Levels, easy to hard: nearest 10, nearest 100, nearest 10 or 100.

A short story sits on the card. The spoken question is still “Round 48 to the nearest 10,” the same sentence Place Value already speaks. Grade 3 rounds a two-digit story to the nearest 10 and a three-digit story to the nearest 100 (3.NBT.A.1). Grade 4 mixes the two places on three-digit numbers (4.NBT.A.3, 4.OA.A.3). The hands card steps by 10 or by 100. Numbers stay at or under 999 so every language can speak them.

| Grade | Offer | Start | Core levels | Cap without challenge | Standards |
|---|---|---|---|---|---|
| Pre-K | Coming later | — | — | — | Rounding waits |
| K | Coming later | — | — | — | Rounding waits |
| 1 | Coming later | — | — | — | Rounding waits |
| 2 | Coming later | — | — | — | Rounding waits |
| 3 | Play | Nearest 10 | Nearest 10, nearest 100 | Nearest 100 | 3.NBT.A.1 |
| 4 | Play | Nearest 10 or 100 | Nearest 10 or 100 | One level down (nearest 100) | 4.NBT.A.3, 4.OA.A.3 |

Pre-K through grade 2 stay locked. Grade 3 can drift only inside nearest 10 and nearest 100. Grade 4 can drift down to nearest 100. Elapsed time is already a grade 4 level in Telling Time, so it is not a separate game. Time to the minute is still open.

## Still open

These Common Core skills still have no game: teen numbers as ten and ones (K.NBT.A.1), decomposing numbers within 10 (K.OA.A.3), the meaning of the equal sign (1.OA.D.7), three-addend word problems (1.OA.A.2), adding up to four two-digit numbers (2.NBT.B.6), the full subtraction algorithm within 1000 (2.NBT.B.7), measuring the same length in two units (2.MD.A.2), estimating length (2.MD.A.3), comparing lengths (2.MD.A.4), length word problems (2.MD.B.5), a number line of lengths (2.MD.B.6), line plots of measurements (2.MD.D.9), multiplying a one-digit number by a multiple of 10 (3.NBT.A.3), mass and liquid volume (3.MD.A.2), properties of multiplication (3.OA.B.5), time to the minute (3.MD.A.1), and the early reading work of syllables (RF.K.2.B), onset and rime (RF.K.2.C), and phoneme substitution (RF.K.2.E). Rounding to 10 and 100 is already Place Value. Rounding stories are the Round game. Blank fraction lines are the Line game. Rhyming words are already Phonics, and only in the languages that teach English reading. Even and odd is still open as a question, though Fair Shares already deals equal pairs.
