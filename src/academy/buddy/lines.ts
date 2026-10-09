/** One short line. Shown in a speech bubble, the book, and a squish. */
const LINES: Record<string, string> = {
  peach: "Sweet and ready!",
  frog: "Hop to it!",
  bunny: "Boing! Let's count.",
  melon: "Cool and juicy!",
  grape: "A bunch of fun!",
  bear: "We can count them.",
  cat: "Purr-fect try!",
  panda: "Groups are my favorite.",
  owl: "Hoot! Sound it out.",
  chick: "Peep! You can do it.",
  duck: "Waddle with me!",
  pig: "Oink! Nice work.",
  penguin: "Watch the long hand.",
  whale: "A big splash of math!",
  avocado: "Guac and roll!",
  donut: "Hole-y moly!",
  corn: "A-maize-ing!",
  lemon: "Sweet, not sour.",
  strawberry: "Berry proud of you!",
  cookie: "You are a smart cookie!",
  boba: "Sip, sip, hooray!",
  fox: "Let's share the coins.",
  otter: "Hold paws and count.",
  capybara: "Calm and clever.",
  "crystal-axolotl": "Sparkle and count!",
  "rainbow-cupcake": "A sprinkle of luck!",
  "star-mochi": "Wish on a star!",
  "galaxy-narwhal": "Out of this world!",
};

export function catchphrase(id: string): string {
  return LINES[id] ?? "Let's play!";
}
