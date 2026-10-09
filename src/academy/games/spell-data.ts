export const SPELL_LEVELS = ["cvc", "digraphs", "blends", "long", "patterns"] as const;
export type SpellLevel = (typeof SPELL_LEVELS)[number];

export interface SpellWord {
  id: string;
  word: string;
  sentence: string;
  level: SpellLevel;
  patternLabel: string;
}

function pack(level: SpellLevel, rows: ReadonlyArray<readonly [string, string, string]>): SpellWord[] {
  return rows.map(([word, patternLabel, sentence]) => ({
    id: `sp:${word}`,
    word,
    sentence,
    level,
    patternLabel,
  }));
}

const CVC = pack("cvc", [
  ["cat", "short a", "The cat sat on a mat."],
  ["hat", "short a", "The hat is red."],
  ["sat", "short a", "I sat on the rug."],
  ["mat", "short a", "The cat likes the mat."],
  ["pan", "short a", "The pan is hot."],
  ["map", "short a", "The map shows the park."],
  ["pig", "short i", "The pig is in mud."],
  ["dig", "short i", "Dogs dig in the yard."],
  ["sit", "short i", "Sit on the chair."],
  ["pin", "short i", "The pin is sharp."],
  ["win", "short i", "We win the game."],
  ["dog", "short o", "The dog can run."],
  ["log", "short o", "A bug is on the log."],
  ["hop", "short o", "Rabbits hop."],
  ["top", "short o", "The top can spin."],
  ["mop", "short o", "I mop the floor."],
  ["box", "short o", "The toy is in the box."],
  ["fox", "short o", "The fox is quick."],
  ["cup", "short u", "The cup is full."],
  ["bug", "short u", "The bug is little."],
  ["sun", "short u", "The sun is warm."],
  ["mud", "short u", "Boots step in mud."],
  ["bus", "short u", "We ride the bus."],
  ["bed", "short e", "The bed is soft."],
  ["red", "short e", "The ball is red."],
  ["pen", "short e", "I write with a pen."],
  ["ten", "short e", "I can count to ten."],
  ["net", "short e", "The net holds the fish."],
]);

const DIGRAPHS = pack("digraphs", [
  ["ship", "sh", "The ship is on the sea."],
  ["shop", "sh", "We shop for apples."],
  ["fish", "sh", "The fish can swim."],
  ["dish", "sh", "The dish is clean."],
  ["wish", "sh", "I wish for a puppy."],
  ["chop", "ch", "Chop the carrot."],
  ["chin", "ch", "The hat is under my chin."],
  ["chat", "ch", "We chat at lunch."],
  ["chip", "ch", "The chip is salty."],
  ["thin", "th", "The paper is thin."],
  ["path", "th", "Walk on the path."],
  ["bath", "th", "The bath is warm."],
  ["duck", "ck", "The duck can swim."],
  ["back", "ck", "I pat the dog on the back."],
  ["kick", "ck", "Kick the ball."],
  ["lock", "ck", "Turn the lock."],
  ["ring", "ng", "The ring is shiny."],
  ["sing", "ng", "We sing a song."],
  ["king", "ng", "The king wears a crown."],
  ["long", "ng", "The snake is long."],
  ["when", "wh", "When is recess?"],
  ["whip", "wh", "The cream will whip."],
]);

const BLENDS = pack("blends", [
  ["stop", "st", "Stop at the red sign."],
  ["step", "st", "Step over the puddle."],
  ["stick", "st", "The stick is long."],
  ["stamp", "st", "I stamp the paper."],
  ["snap", "sn", "Snap your fingers."],
  ["snack", "sn", "I pack a snack."],
  ["spot", "sp", "The dog has a spot."],
  ["frog", "fr", "The frog can hop."],
  ["flag", "fl", "The flag is waving."],
  ["drip", "dr", "Raindrops drip down."],
  ["drum", "dr", "Tap the drum."],
  ["grab", "gr", "Grab your coat."],
  ["glad", "gl", "I am glad to see you."],
  ["clap", "cl", "Clap your hands."],
  ["slip", "sl", "Do not slip on the ice."],
  ["plan", "pl", "We plan a picnic."],
  ["plant", "pl", "Plant the seed."],
  ["swim", "sw", "Fish swim in the lake."],
  ["crab", "cr", "The crab has claws."],
  ["twin", "tw", "My twin likes jokes."],
  ["black", "bl", "The cat is black."],
]);

const LONG = pack("long", [
  ["cake", "silent e", "We bake a cake."],
  ["make", "silent e", "I make a card."],
  ["game", "silent e", "The game is fun."],
  ["bike", "silent e", "I ride a bike."],
  ["like", "silent e", "I like peaches."],
  ["kite", "silent e", "The kite is high."],
  ["home", "silent e", "We walk home."],
  ["bone", "silent e", "The dog has a bone."],
  ["cute", "silent e", "The puppy is cute."],
  ["rain", "ai", "The rain is soft."],
  ["train", "ai", "The train is loud."],
  ["play", "ay", "We play outside."],
  ["tree", "ee", "The tree is tall."],
  ["feet", "ee", "My feet are in socks."],
  ["seed", "ee", "Plant a seed."],
  ["boat", "oa", "The boat floats."],
  ["road", "oa", "The road is long."],
  ["coat", "oa", "Wear a warm coat."],
  ["light", "igh", "The light is bright."],
  ["moon", "oo", "The moon is out."],
]);

const PATTERNS = pack("patterns", [
  ["night", "igh", "The night is quiet."],
  ["right", "igh", "Turn right at the oak."],
  ["shout", "ou", "Do not shout inside."],
  ["cloud", "ou", "A cloud covers the sun."],
  ["found", "ou", "I found my pencil."],
  ["sound", "ou", "The sound is a bell."],
  ["chair", "air", "Sit on the chair."],
  ["where", "ere", "Where is my book?"],
  ["friend", "ie", "My friend can share."],
  ["school", "oo", "School starts in the morning."],
  ["write", "wr", "I write a note."],
  ["know", "kn", "I know the way."],
  ["would", "ould", "I would like help."],
  ["people", "irregular", "People wait in line."],
  ["water", "irregular", "Water fills the cup."],
  ["again", "irregular", "Let us try again."],
  ["about", "irregular", "Tell me about your dog."],
  ["every", "irregular", "Every child gets a turn."],
  ["because", "irregular", "I laugh because it is funny."],
  ["thought", "ough", "I thought of a joke."],
]);

const BY_LEVEL: Record<SpellLevel, readonly SpellWord[]> = {
  cvc: CVC,
  digraphs: DIGRAPHS,
  blends: BLENDS,
  long: LONG,
  patterns: PATTERNS,
};

export const ALL_SPELL: readonly SpellWord[] = [...CVC, ...DIGRAPHS, ...BLENDS, ...LONG, ...PATTERNS];

export function spellWords(level: SpellLevel): readonly SpellWord[] {
  return BY_LEVEL[level];
}

export function isSpellLevel(value: unknown): value is SpellLevel {
  return typeof value === "string" && (SPELL_LEVELS as readonly string[]).includes(value);
}
