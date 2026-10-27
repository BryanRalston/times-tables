import type { Story } from "./catalog";

/** Extra read-along books. Same page, picture check, and cast rules as the first shelf. */
export const SHELF_STORIES: readonly Story[] = [
  {
    id: "pk-panda-sun",
    title: "The big sun",
    grade: "PK",
    cast: ["panda"],
    pages: [
      { text: "Panda can see the sun.", pals: ["panda"], prop: "sun", mood: "day" },
      { text: "The sun is big.", pals: ["panda"], prop: "sun", mood: "day" },
      { text: "The sun is yellow.", pals: ["panda"], prop: "sun", mood: "day" },
      { text: "Look! Panda can run.", pals: ["panda"], mood: "day" },
      { text: "Panda and I play.", pals: ["panda"], mood: "day" },
    ],
    checks: [
      {
        prompt: "See the sun.",
        page: 0,
        answer: "sun",
        choices: [
          { id: "sun", label: "sun", picture: { kind: "prop", id: "sun" } },
          { id: "hat", label: "hat", picture: { kind: "prop", id: "hat" } },
        ],
      },
      {
        prompt: "Panda can run.",
        page: 3,
        answer: "panda",
        choices: [
          { id: "panda", label: "Panda", picture: { kind: "pal", id: "panda" } },
          { id: "cat", label: "cat", picture: { kind: "pal", id: "cat" } },
        ],
      },
    ],
  },
  {
    id: "pk-chick-hug",
    title: "A big hug",
    grade: "PK",
    cast: ["chick"],
    pages: [
      { text: "I see a chick.", pals: ["chick"], mood: "day" },
      { text: "The chick is little.", pals: ["chick"], mood: "day" },
      { text: "The chick is yellow.", pals: ["chick"], mood: "day" },
      { text: "Look! A big hug.", pals: ["chick"], mood: "day" },
      { text: "We play.", pals: ["chick"], mood: "day" },
    ],
    checks: [
      {
        prompt: "See the chick.",
        page: 0,
        answer: "chick",
        choices: [
          { id: "chick", label: "chick", picture: { kind: "pal", id: "chick" } },
          { id: "pig", label: "pig", picture: { kind: "pal", id: "pig" } },
        ],
      },
      {
        prompt: "A big hug.",
        page: 3,
        answer: "chick",
        choices: [
          { id: "chick", label: "chick", picture: { kind: "pal", id: "chick" } },
          { id: "cat", label: "cat", picture: { kind: "pal", id: "cat" } },
        ],
      },
    ],
  },
  {
    id: "k-penguin-cup",
    title: "The yellow cup",
    grade: "K",
    cast: ["penguin"],
    pages: [
      { text: "Penguin can see a cup.", pals: ["penguin"], prop: "cup", mood: "day" },
      { text: "The cup is yellow.", pals: ["penguin"], prop: "cup", mood: "day" },
      { text: "Where is the cup?", pals: ["penguin"], mood: "day" },
      { text: "It is on the mat.", pals: ["penguin"], prop: "mat", mood: "day" },
      { text: "Penguin ran to the cup.", pals: ["penguin"], prop: "cup", mood: "day" },
      { text: "We like the yellow cup.", pals: ["penguin"], prop: "cup", mood: "day" },
    ],
    checks: [
      {
        prompt: "Where is the cup?",
        page: 3,
        answer: "mat",
        choices: [
          { id: "mat", label: "mat", picture: { kind: "prop", id: "mat" } },
          { id: "hat", label: "hat", picture: { kind: "prop", id: "hat" } },
        ],
      },
      {
        prompt: "See the yellow cup.",
        page: 0,
        answer: "cup",
        choices: [
          { id: "cup", label: "cup", picture: { kind: "prop", id: "cup" } },
          { id: "sun", label: "sun", picture: { kind: "prop", id: "sun" } },
        ],
      },
    ],
  },
  {
    id: "k-otter-fish",
    title: "Otter and the fish",
    grade: "K",
    cast: ["otter"],
    pages: [
      { text: "Otter can see a fish.", pals: ["otter"], prop: "fish", mood: "water" },
      { text: "The fish is little.", pals: ["otter"], prop: "fish", mood: "water" },
      { text: "Look at the fish.", pals: ["otter"], prop: "fish", mood: "water" },
      { text: "The fish is red.", pals: ["otter"], prop: "fish", mood: "water" },
      { text: "Otter and the fish play.", pals: ["otter"], prop: "fish", mood: "water" },
      { text: "I like the fish.", pals: ["otter"], prop: "fish", mood: "day" },
    ],
    checks: [
      {
        prompt: "See the fish.",
        page: 0,
        answer: "fish",
        choices: [
          { id: "fish", label: "fish", picture: { kind: "prop", id: "fish" } },
          { id: "bug", label: "bug", picture: { kind: "prop", id: "bug" } },
        ],
      },
      {
        prompt: "The fish is red.",
        page: 3,
        answer: "fish",
        choices: [
          { id: "fish", label: "fish", picture: { kind: "prop", id: "fish" } },
          { id: "hat", label: "hat", picture: { kind: "prop", id: "hat" } },
        ],
      },
    ],
  },
  {
    id: "g1-koala-snack",
    title: "A good snack",
    grade: "1",
    cast: ["koala"],
    pages: [
      { text: "Koala has a snack.", pals: ["koala"], prop: "snack", mood: "day" },
      { text: "The snack is yellow.", pals: ["koala"], prop: "snack", mood: "day" },
      { text: "Koala will eat it.", pals: ["koala"], prop: "snack", mood: "day" },
      { text: "Then Koala had a cup.", pals: ["koala"], prop: "cup", mood: "day" },
      { text: "She sat in the sun.", pals: ["koala"], prop: "sun", mood: "day" },
      { text: "Koala is glad.", pals: ["koala"], mood: "day" },
    ],
    checks: [
      {
        prompt: "Who has a snack?",
        page: 0,
        answer: "koala",
        choices: [
          { id: "koala", label: "Koala", picture: { kind: "pal", id: "koala" } },
          { id: "pig", label: "pig", picture: { kind: "pal", id: "pig" } },
        ],
      },
      {
        prompt: "Koala had a cup.",
        page: 3,
        answer: "cup",
        choices: [
          { id: "cup", label: "cup", picture: { kind: "prop", id: "cup" } },
          { id: "hat", label: "hat", picture: { kind: "prop", id: "hat" } },
        ],
      },
    ],
  },
  {
    id: "g1-hedgehog-hat",
    title: "Hedgehog has a hat",
    grade: "1",
    cast: ["hedgehog"],
    pages: [
      { text: "Hedgehog has a red hat.", pals: ["hedgehog"], prop: "hat", mood: "day" },
      { text: "The hat is little.", pals: ["hedgehog"], prop: "hat", mood: "day" },
      { text: "Where is the hat?", pals: ["hedgehog"], mood: "day" },
      { text: "It is on the mat.", pals: ["hedgehog"], prop: "mat", mood: "day" },
      { text: "Hedgehog ran to get it.", pals: ["hedgehog"], prop: "hat", mood: "day" },
      { text: "He will put it on.", pals: ["hedgehog"], prop: "hat", mood: "day" },
      { text: "Hedgehog is glad.", pals: ["hedgehog"], prop: "hat", mood: "day" },
    ],
    checks: [
      {
        prompt: "Who has a hat?",
        page: 0,
        answer: "hedgehog",
        choices: [
          { id: "hedgehog", label: "Hedgehog", picture: { kind: "pal", id: "hedgehog" } },
          { id: "cat", label: "cat", picture: { kind: "pal", id: "cat" } },
        ],
      },
      {
        prompt: "Where is the hat?",
        page: 3,
        answer: "mat",
        choices: [
          { id: "mat", label: "mat", picture: { kind: "prop", id: "mat" } },
          { id: "cup", label: "cup", picture: { kind: "prop", id: "cup" } },
        ],
      },
    ],
  },
  {
    id: "g2-panda-moon",
    title: "Panda and the moon",
    grade: "2",
    cast: ["panda", "owl"],
    pages: [
      { text: "Panda can see the moon at night.", pals: ["panda"], prop: "moon", mood: "night" },
      { text: "The moon is big and white.", pals: ["panda"], prop: "moon", mood: "night" },
      { text: "Owl came to the house.", pals: ["panda", "owl"], prop: "house", mood: "night" },
      { text: "They sit and look at the moon.", pals: ["panda", "owl"], prop: "moon", mood: "night" },
      { text: "Panda said, The night is very pretty.", pals: ["panda", "owl"], prop: "moon", mood: "night" },
      { text: "Owl was glad.", pals: ["owl"], mood: "night" },
      { text: "Then they went to sleep.", pals: ["panda", "owl"], prop: "moon", mood: "night" },
    ],
    checks: [
      {
        prompt: "Who can see the moon?",
        page: 0,
        answer: "panda",
        choices: [
          { id: "panda", label: "Panda", picture: { kind: "pal", id: "panda" } },
          { id: "fox", label: "Fox", picture: { kind: "pal", id: "fox" } },
        ],
      },
      {
        prompt: "Owl came to the house.",
        page: 2,
        answer: "house",
        choices: [
          { id: "house", label: "house", picture: { kind: "prop", id: "house" } },
          { id: "boat", label: "boat", picture: { kind: "prop", id: "boat" } },
        ],
      },
    ],
  },
  {
    id: "g2-fox-boat",
    title: "A green boat",
    grade: "2",
    cast: ["fox"],
    pages: [
      { text: "Fox can see a green boat.", pals: ["fox"], prop: "boat", mood: "water" },
      { text: "The boat is on the water.", pals: ["fox"], prop: "boat", mood: "water" },
      { text: "Fox went to the boat.", pals: ["fox"], prop: "boat", mood: "water" },
      { text: "The boat can go fast.", pals: ["fox"], prop: "boat", mood: "water" },
      { text: "Fox had a good ride.", pals: ["fox"], prop: "boat", mood: "water" },
      { text: "Then Fox came back.", pals: ["fox"], prop: "boat", mood: "water" },
      { text: "Fox was very glad.", pals: ["fox"], mood: "day" },
    ],
    checks: [
      {
        prompt: "Who can see a boat?",
        page: 0,
        answer: "fox",
        choices: [
          { id: "fox", label: "Fox", picture: { kind: "pal", id: "fox" } },
          { id: "pig", label: "pig", picture: { kind: "pal", id: "pig" } },
        ],
      },
      {
        prompt: "The boat is on the water.",
        page: 1,
        answer: "boat",
        choices: [
          { id: "boat", label: "boat", picture: { kind: "prop", id: "boat" } },
          { id: "house", label: "house", picture: { kind: "prop", id: "house" } },
        ],
      },
    ],
  },
  {
    id: "g3-bear-warm",
    title: "The warm ride",
    grade: "3",
    cast: ["bear", "duck"],
    pages: [
      { text: "Bear and Duck start on the boat.", pals: ["bear", "duck"], prop: "boat", mood: "water" },
      { text: "The water is warm today.", pals: ["bear", "duck"], prop: "boat", mood: "water" },
      { text: "They can see a small fish.", pals: ["bear", "duck"], prop: "fish", mood: "water" },
      { text: "The fish can jump.", pals: ["bear", "duck"], prop: "fish", mood: "water" },
      { text: "Bear said, Keep together.", pals: ["bear", "duck"], prop: "boat", mood: "water" },
      { text: "Then they come back to the house.", pals: ["bear", "duck"], prop: "house", mood: "day" },
      { text: "The ride was very good.", pals: ["bear", "duck"], mood: "day" },
    ],
    checks: [
      {
        prompt: "Who can see the boat?",
        page: 0,
        answer: "bear",
        choices: [
          { id: "bear", label: "Bear", picture: { kind: "pal", id: "bear" } },
          { id: "pig", label: "pig", picture: { kind: "pal", id: "pig" } },
        ],
      },
      {
        prompt: "They can see a small fish.",
        page: 2,
        answer: "fish",
        choices: [
          { id: "fish", label: "fish", picture: { kind: "prop", id: "fish" } },
          { id: "hat", label: "hat", picture: { kind: "prop", id: "hat" } },
        ],
      },
    ],
  },
  {
    id: "g3-owl-story",
    title: "A long story",
    grade: "3",
    cast: ["owl", "bunny"],
    pages: [
      { text: "Owl will tell a story about the moon.", pals: ["owl"], prop: "moon", mood: "night" },
      { text: "The story is long.", pals: ["owl"], prop: "moon", mood: "night" },
      { text: "Bunny came to the house.", pals: ["owl", "bunny"], prop: "house", mood: "night" },
      { text: "They read the story together.", pals: ["owl", "bunny"], prop: "moon", mood: "night" },
      { text: "Owl said, The moon is pretty.", pals: ["owl", "bunny"], prop: "moon", mood: "night" },
      { text: "Today the night is warm.", pals: ["owl", "bunny"], prop: "moon", mood: "night" },
      { text: "Then they sleep.", pals: ["owl", "bunny"], prop: "moon", mood: "night" },
    ],
    checks: [
      {
        prompt: "Who will tell a story?",
        page: 0,
        answer: "owl",
        choices: [
          { id: "owl", label: "Owl", picture: { kind: "pal", id: "owl" } },
          { id: "fox", label: "Fox", picture: { kind: "pal", id: "fox" } },
        ],
      },
      {
        prompt: "Bunny came to the house.",
        page: 2,
        answer: "house",
        choices: [
          { id: "house", label: "house", picture: { kind: "prop", id: "house" } },
          { id: "boat", label: "boat", picture: { kind: "prop", id: "boat" } },
        ],
      },
    ],
  },
  {
    id: "g3-fox-kind",
    title: "A kind day",
    grade: "3",
    cast: ["fox", "peach"],
    pages: [
      { text: "Fox and Peach play at the house.", pals: ["fox", "peach"], prop: "house", mood: "day" },
      { text: "They read a story together.", pals: ["fox", "peach"], mood: "day" },
      { text: "The story is about a little bug.", pals: ["fox", "peach"], prop: "bug", mood: "day" },
      { text: "Fox said, Be kind.", pals: ["fox", "peach"], mood: "day" },
      { text: "They draw the bug.", pals: ["fox", "peach"], prop: "bug", mood: "day" },
      { text: "Today they laugh.", pals: ["fox", "peach"], mood: "day" },
      { text: "The day is done.", pals: ["fox", "peach"], mood: "day" },
    ],
    checks: [
      {
        prompt: "Who can play?",
        page: 0,
        answer: "fox",
        choices: [
          { id: "fox", label: "Fox", picture: { kind: "pal", id: "fox" } },
          { id: "pig", label: "pig", picture: { kind: "pal", id: "pig" } },
        ],
      },
      {
        prompt: "They draw the bug.",
        page: 4,
        answer: "bug",
        choices: [
          { id: "bug", label: "bug", picture: { kind: "prop", id: "bug" } },
          { id: "hat", label: "hat", picture: { kind: "prop", id: "hat" } },
        ],
      },
    ],
  },
  {
    id: "g4-owl-habitat",
    title: "The night habitat",
    grade: "4",
    cast: ["owl", "bunny"],
    pages: [
      { text: "Owl can observe the night habitat.", pals: ["owl"], prop: "moon", mood: "night" },
      { text: "The moon is a light there.", pals: ["owl"], prop: "moon", mood: "night" },
      { text: "Bunny came to the house.", pals: ["owl", "bunny"], prop: "house", mood: "night" },
      { text: "Owl will explain the habitat.", pals: ["owl", "bunny"], prop: "moon", mood: "night" },
      { text: "Bunny can compare the moon and the sun.", pals: ["owl", "bunny"], prop: "moon", mood: "night" },
      { text: "I predict the sun will come.", pals: ["owl", "bunny"], prop: "moon", mood: "night" },
      { text: "Then they sleep.", pals: ["owl", "bunny"], prop: "moon", mood: "night" },
    ],
    checks: [
      {
        prompt: "Who can observe the habitat?",
        page: 0,
        answer: "owl",
        choices: [
          { id: "owl", label: "Owl", picture: { kind: "pal", id: "owl" } },
          { id: "fox", label: "Fox", picture: { kind: "pal", id: "fox" } },
        ],
      },
      {
        prompt: "Bunny came to the house.",
        page: 2,
        answer: "house",
        choices: [
          { id: "house", label: "house", picture: { kind: "prop", id: "house" } },
          { id: "boat", label: "boat", picture: { kind: "prop", id: "boat" } },
        ],
      },
    ],
  },
  {
    id: "g4-duck-water",
    title: "The water habitat",
    grade: "4",
    cast: ["duck"],
    pages: [
      { text: "Duck can observe the water.", pals: ["duck"], mood: "water" },
      { text: "The water is a habitat.", pals: ["duck"], mood: "water" },
      { text: "Duck can see a small fish.", pals: ["duck"], prop: "fish", mood: "water" },
      { text: "The fish can jump.", pals: ["duck"], prop: "fish", mood: "water" },
      { text: "Duck will explain the habitat.", pals: ["duck"], prop: "fish", mood: "water" },
      { text: "I predict the fish will swim.", pals: ["duck"], prop: "fish", mood: "water" },
      { text: "Duck was glad.", pals: ["duck"], mood: "day" },
    ],
    checks: [
      {
        prompt: "Who can observe the water?",
        page: 0,
        answer: "duck",
        choices: [
          { id: "duck", label: "Duck", picture: { kind: "pal", id: "duck" } },
          { id: "cat", label: "cat", picture: { kind: "pal", id: "cat" } },
        ],
      },
      {
        prompt: "Duck can see a fish.",
        page: 2,
        answer: "fish",
        choices: [
          { id: "fish", label: "fish", picture: { kind: "prop", id: "fish" } },
          { id: "hat", label: "hat", picture: { kind: "prop", id: "hat" } },
        ],
      },
    ],
  },
  {
    id: "g4-bear-measure",
    title: "Measure the boat",
    grade: "4",
    cast: ["bear", "duck"],
    pages: [
      { text: "Bear can see a boat.", pals: ["bear"], prop: "boat", mood: "water" },
      { text: "Bear will measure the boat.", pals: ["bear", "duck"], prop: "boat", mood: "water" },
      { text: "Duck can compare the boat and the fish.", pals: ["bear", "duck"], prop: "fish", mood: "water" },
      { text: "The boat is long.", pals: ["bear", "duck"], prop: "boat", mood: "water" },
      { text: "Bear will explain the water habitat.", pals: ["bear", "duck"], prop: "boat", mood: "water" },
      { text: "I predict the boat will go.", pals: ["bear", "duck"], prop: "boat", mood: "water" },
      { text: "Bear was glad.", pals: ["bear"], mood: "day" },
    ],
    checks: [
      {
        prompt: "Who will measure the boat?",
        page: 1,
        answer: "bear",
        choices: [
          { id: "bear", label: "Bear", picture: { kind: "pal", id: "bear" } },
          { id: "pig", label: "pig", picture: { kind: "pal", id: "pig" } },
        ],
      },
      {
        prompt: "Bear can see a boat.",
        page: 0,
        answer: "boat",
        choices: [
          { id: "boat", label: "boat", picture: { kind: "prop", id: "boat" } },
          { id: "house", label: "house", picture: { kind: "prop", id: "house" } },
        ],
      },
    ],
  },
];
