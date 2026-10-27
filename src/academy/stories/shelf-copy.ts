import type { StoryCopy, StoryLang } from "./copy";

/** Translations for the added shelf. Choice labels follow the English choice order. */
export const SHELF_COPY: Record<StoryLang, Record<string, StoryCopy>> = {
  es: {
    "pk-panda-sun": {
      title: "El sol grande",
      pages: ["Panda ve el sol.", "El sol es grande.", "El sol es amarillo.", "¡Mira! Panda corre.", "Panda y yo jugamos."],
      checks: [
        { prompt: "Mira el sol.", labels: ["sol", "gorro"] },
        { prompt: "Panda corre.", labels: ["Panda", "gatita"] },
      ],
    },
    "pk-chick-hug": {
      title: "Un abrazo grande",
      pages: ["Veo un pollito.", "El pollito es pequeño.", "El pollito es amarillo.", "¡Mira! Un abrazo grande.", "Jugamos."],
      checks: [
        { prompt: "Mira el pollito.", labels: ["pollito", "cerdito"] },
        { prompt: "Un abrazo grande.", labels: ["pollito", "gatita"] },
      ],
    },
    "k-penguin-cup": {
      title: "El vaso amarillo",
      pages: [
        "Penguin ve un vaso.",
        "El vaso es amarillo.",
        "¿Dónde está el vaso?",
        "Está en el tapete.",
        "Penguin corrió al vaso.",
        "Nos gusta el vaso amarillo.",
      ],
      checks: [
        { prompt: "¿Dónde está el vaso?", labels: ["tapete", "gorro"] },
        { prompt: "Mira el vaso amarillo.", labels: ["vaso", "sol"] },
      ],
    },
    "k-otter-fish": {
      title: "Otter y el pez",
      pages: ["Otter ve un pez.", "El pez es pequeño.", "Mira el pez.", "El pez es rojo.", "Otter y el pez juegan.", "Me gusta el pez."],
      checks: [
        { prompt: "Mira el pez.", labels: ["pez", "bichito"] },
        { prompt: "El pez es rojo.", labels: ["pez", "gorro"] },
      ],
    },
    "g1-koala-snack": {
      title: "Una merienda rica",
      pages: [
        "Koala tiene una merienda.",
        "La merienda es amarilla.",
        "Koala se la va a comer.",
        "Luego Koala tomó un vaso.",
        "Se sentó al sol.",
        "Koala está contento.",
      ],
      checks: [
        { prompt: "¿Quién tiene la merienda?", labels: ["Koala", "cerdito"] },
        { prompt: "Koala tomó un vaso.", labels: ["vaso", "gorro"] },
      ],
    },
    "g1-hedgehog-hat": {
      title: "El gorro de Hedgehog",
      pages: [
        "Hedgehog tiene un gorro rojo.",
        "El gorro es pequeño.",
        "¿Dónde está el gorro?",
        "Está en el tapete.",
        "Hedgehog corrió a buscarlo.",
        "Se lo va a poner.",
        "Hedgehog está contento.",
      ],
      checks: [
        { prompt: "¿Quién tiene el gorro?", labels: ["Hedgehog", "gatita"] },
        { prompt: "¿Dónde está el gorro?", labels: ["tapete", "vaso"] },
      ],
    },
    "g2-panda-moon": {
      title: "Panda y la luna",
      pages: [
        "Panda ve la luna de noche.",
        "La luna es grande y blanca.",
        "Owl llegó a la casa.",
        "Se sientan a mirar la luna.",
        "Panda dijo: la noche es muy linda.",
        "Owl estaba contento.",
        "Luego se fueron a dormir.",
      ],
      checks: [
        { prompt: "¿Quién ve la luna?", labels: ["Panda", "Fox"] },
        { prompt: "Owl llegó a la casa.", labels: ["casa", "barco"] },
      ],
    },
    "g2-fox-boat": {
      title: "El barco verde",
      pages: [
        "Fox ve un barco verde.",
        "El barco está en el agua.",
        "Fox fue al barco.",
        "El barco puede ir rápido.",
        "Fox paseó muy a gusto.",
        "Luego Fox volvió.",
        "Fox estaba muy contento.",
      ],
      checks: [
        { prompt: "¿Quién ve un barco?", labels: ["Fox", "cerdito"] },
        { prompt: "El barco está en el agua.", labels: ["barco", "casa"] },
      ],
    },
    "g3-bear-warm": {
      title: "El paseo tibio",
      pages: [
        "Bear y Duck salen en el barco.",
        "Hoy el agua está tibia.",
        "Ven un pez pequeño.",
        "El pez puede saltar.",
        "Bear dijo: sigamos juntos.",
        "Luego vuelven a la casa.",
        "El paseo estuvo muy rico.",
      ],
      checks: [
        { prompt: "¿Quién sale en el barco?", labels: ["Bear", "cerdito"] },
        { prompt: "Ven un pez pequeño.", labels: ["pez", "gorro"] },
      ],
    },
    "g3-owl-story": {
      title: "Un cuento largo",
      pages: [
        "Owl va a contar un cuento de la luna.",
        "El cuento es largo.",
        "Bunny llegó a la casa.",
        "Leen el cuento juntos.",
        "Owl dijo: la luna es linda.",
        "Hoy la noche está tibia.",
        "Luego se duermen.",
      ],
      checks: [
        { prompt: "¿Quién cuenta el cuento?", labels: ["Owl", "Fox"] },
        { prompt: "Bunny llegó a la casa.", labels: ["casa", "barco"] },
      ],
    },
    "g3-fox-kind": {
      title: "Un día amable",
      pages: [
        "Fox y Peach juegan en la casa.",
        "Leen un cuento juntos.",
        "El cuento es de un bichito.",
        "Fox dijo: sé amable.",
        "Dibujan el bichito.",
        "Hoy se ríen.",
        "El día terminó.",
      ],
      checks: [
        { prompt: "¿Quién puede jugar?", labels: ["Fox", "cerdito"] },
        { prompt: "Dibujan el bichito.", labels: ["bichito", "gorro"] },
      ],
    },
    "g4-owl-habitat": {
      title: "El hábitat de noche",
      pages: [
        "Owl puede observar el hábitat de noche.",
        "La luna es una luz ahí.",
        "Bunny llegó a la casa.",
        "Owl va a explicar el hábitat.",
        "Bunny puede comparar la luna y el sol.",
        "Yo predigo que vendrá el sol.",
        "Luego se duermen.",
      ],
      checks: [
        { prompt: "¿Quién observa el hábitat?", labels: ["Owl", "Fox"] },
        { prompt: "Bunny llegó a la casa.", labels: ["casa", "barco"] },
      ],
    },
    "g4-duck-water": {
      title: "El hábitat del agua",
      pages: [
        "Duck puede observar el agua.",
        "El agua es un hábitat.",
        "Duck ve un pez pequeño.",
        "El pez puede saltar.",
        "Duck va a explicar el hábitat.",
        "Yo predigo que el pez va a nadar.",
        "Duck estaba contento.",
      ],
      checks: [
        { prompt: "¿Quién observa el agua?", labels: ["Duck", "gatita"] },
        { prompt: "Duck ve un pez.", labels: ["pez", "gorro"] },
      ],
    },
    "g4-bear-measure": {
      title: "Medir el barco",
      pages: [
        "Bear ve un barco.",
        "Bear va a medir el barco.",
        "Duck puede comparar el barco y el pez.",
        "El barco es largo.",
        "Bear va a explicar el hábitat del agua.",
        "Yo predigo que el barco va a ir.",
        "Bear estaba contento.",
      ],
      checks: [
        { prompt: "¿Quién va a medir el barco?", labels: ["Bear", "cerdito"] },
        { prompt: "Bear ve un barco.", labels: ["barco", "casa"] },
      ],
    },
  },
  pt: {
    "pk-panda-sun": {
      title: "O sol grande",
      pages: ["Panda vê o sol.", "O sol é grande.", "O sol é amarelo.", "Olha! Panda corre.", "Panda e eu brincamos."],
      checks: [
        { prompt: "Olha o sol.", labels: ["sol", "chapéu"] },
        { prompt: "Panda corre.", labels: ["Panda", "gatinha"] },
      ],
    },
    "pk-chick-hug": {
      title: "Um abraço grande",
      pages: ["Eu vejo um pintinho.", "O pintinho é pequeno.", "O pintinho é amarelo.", "Olha! Um abraço grande.", "A gente brinca."],
      checks: [
        { prompt: "Olha o pintinho.", labels: ["pintinho", "porquinho"] },
        { prompt: "Um abraço grande.", labels: ["pintinho", "gatinha"] },
      ],
    },
    "k-penguin-cup": {
      title: "O copo amarelo",
      pages: [
        "Penguin vê um copo.",
        "O copo é amarelo.",
        "Onde está o copo?",
        "Está no tapete.",
        "Penguin correu até o copo.",
        "A gente gosta do copo amarelo.",
      ],
      checks: [
        { prompt: "Onde está o copo?", labels: ["tapete", "chapéu"] },
        { prompt: "Olha o copo amarelo.", labels: ["copo", "sol"] },
      ],
    },
    "k-otter-fish": {
      title: "Otter e o peixe",
      pages: ["Otter vê um peixe.", "O peixe é pequeno.", "Olha o peixe.", "O peixe é vermelho.", "Otter e o peixe brincam.", "Eu gosto do peixe."],
      checks: [
        { prompt: "Olha o peixe.", labels: ["peixe", "bichinho"] },
        { prompt: "O peixe é vermelho.", labels: ["peixe", "chapéu"] },
      ],
    },
    "g1-koala-snack": {
      title: "Um lanche gostoso",
      pages: [
        "Koala tem um lanche.",
        "O lanche é amarelo.",
        "Koala vai comer.",
        "Depois Koala pegou um copo.",
        "Koala sentou no sol.",
        "Koala está feliz.",
      ],
      checks: [
        { prompt: "Quem tem o lanche?", labels: ["Koala", "porquinho"] },
        { prompt: "Koala pegou um copo.", labels: ["copo", "chapéu"] },
      ],
    },
    "g1-hedgehog-hat": {
      title: "O chapéu de Hedgehog",
      pages: [
        "Hedgehog tem um chapéu vermelho.",
        "O chapéu é pequeno.",
        "Onde está o chapéu?",
        "Está no tapete.",
        "Hedgehog correu para pegar.",
        "Ele vai colocar.",
        "Hedgehog está feliz.",
      ],
      checks: [
        { prompt: "Quem tem o chapéu?", labels: ["Hedgehog", "gatinha"] },
        { prompt: "Onde está o chapéu?", labels: ["tapete", "copo"] },
      ],
    },
    "g2-panda-moon": {
      title: "Panda e a lua",
      pages: [
        "Panda vê a lua de noite.",
        "A lua é grande e branca.",
        "Owl chegou na casa.",
        "Eles sentam e olham a lua.",
        "Panda disse: a noite está muito bonita.",
        "Owl ficou feliz.",
        "Depois eles foram dormir.",
      ],
      checks: [
        { prompt: "Quem vê a lua?", labels: ["Panda", "Fox"] },
        { prompt: "Owl chegou na casa.", labels: ["casa", "barco"] },
      ],
    },
    "g2-fox-boat": {
      title: "O barco verde",
      pages: [
        "Fox vê um barco verde.",
        "O barco está na água.",
        "Fox foi até o barco.",
        "O barco pode ir rápido.",
        "Fox fez um passeio bom.",
        "Depois Fox voltou.",
        "Fox ficou muito feliz.",
      ],
      checks: [
        { prompt: "Quem vê um barco?", labels: ["Fox", "porquinho"] },
        { prompt: "O barco está na água.", labels: ["barco", "casa"] },
      ],
    },
    "g3-bear-warm": {
      title: "O passeio morno",
      pages: [
        "Bear e Duck saem no barco.",
        "Hoje a água está morna.",
        "Eles veem um peixe pequeno.",
        "O peixe pode pular.",
        "Bear disse: fiquem juntos.",
        "Depois eles voltam para a casa.",
        "O passeio foi muito bom.",
      ],
      checks: [
        { prompt: "Quem sai no barco?", labels: ["Bear", "porquinho"] },
        { prompt: "Eles veem um peixe pequeno.", labels: ["peixe", "chapéu"] },
      ],
    },
    "g3-owl-story": {
      title: "Uma história longa",
      pages: [
        "Owl vai contar uma história da lua.",
        "A história é longa.",
        "Bunny chegou na casa.",
        "Eles leem a história juntos.",
        "Owl disse: a lua é bonita.",
        "Hoje a noite está morna.",
        "Depois eles dormem.",
      ],
      checks: [
        { prompt: "Quem conta a história?", labels: ["Owl", "Fox"] },
        { prompt: "Bunny chegou na casa.", labels: ["casa", "barco"] },
      ],
    },
    "g3-fox-kind": {
      title: "Um dia gentil",
      pages: [
        "Fox e Peach brincam na casa.",
        "Eles leem uma história juntos.",
        "A história é de um bichinho.",
        "Fox disse: seja gentil.",
        "Eles desenham o bichinho.",
        "Hoje eles riem.",
        "O dia acabou.",
      ],
      checks: [
        { prompt: "Quem pode brincar?", labels: ["Fox", "porquinho"] },
        { prompt: "Eles desenham o bichinho.", labels: ["bichinho", "chapéu"] },
      ],
    },
    "g4-owl-habitat": {
      title: "O habitat da noite",
      pages: [
        "Owl pode observar o habitat da noite.",
        "A lua é uma luz ali.",
        "Bunny chegou na casa.",
        "Owl vai explicar o habitat.",
        "Bunny pode comparar a lua e o sol.",
        "Eu prevejo que o sol vai chegar.",
        "Depois eles dormem.",
      ],
      checks: [
        { prompt: "Quem observa o habitat?", labels: ["Owl", "Fox"] },
        { prompt: "Bunny chegou na casa.", labels: ["casa", "barco"] },
      ],
    },
    "g4-duck-water": {
      title: "O habitat da água",
      pages: [
        "Duck pode observar a água.",
        "A água é um habitat.",
        "Duck vê um peixe pequeno.",
        "O peixe pode pular.",
        "Duck vai explicar o habitat.",
        "Eu prevejo que o peixe vai nadar.",
        "Duck ficou feliz.",
      ],
      checks: [
        { prompt: "Quem observa a água?", labels: ["Duck", "gatinha"] },
        { prompt: "Duck vê um peixe.", labels: ["peixe", "chapéu"] },
      ],
    },
    "g4-bear-measure": {
      title: "Medir o barco",
      pages: [
        "Bear vê um barco.",
        "Bear vai medir o barco.",
        "Duck pode comparar o barco e o peixe.",
        "O barco é longo.",
        "Bear vai explicar o habitat da água.",
        "Eu prevejo que o barco vai andar.",
        "Bear ficou feliz.",
      ],
      checks: [
        { prompt: "Quem vai medir o barco?", labels: ["Bear", "porquinho"] },
        { prompt: "Bear vê um barco.", labels: ["barco", "casa"] },
      ],
    },
  },
  fr: {
    "pk-panda-sun": {
      title: "Le grand soleil",
      pages: ["Panda voit le soleil.", "Le soleil est grand.", "Le soleil est jaune.", "Regarde! Panda court.", "Panda et moi jouons."],
      checks: [
        { prompt: "Regarde le soleil.", labels: ["soleil", "chapeau"] },
        { prompt: "Panda court.", labels: ["Panda", "chat"] },
      ],
    },
    "pk-chick-hug": {
      title: "Un gros câlin",
      pages: ["Je vois un poussin.", "Le poussin est petit.", "Le poussin est jaune.", "Regarde! Un gros câlin.", "On joue."],
      checks: [
        { prompt: "Regarde le poussin.", labels: ["poussin", "cochon"] },
        { prompt: "Un gros câlin.", labels: ["poussin", "chat"] },
      ],
    },
    "k-penguin-cup": {
      title: "La tasse jaune",
      pages: [
        "Penguin voit une tasse.",
        "La tasse est jaune.",
        "Où est la tasse?",
        "Elle est sur le tapis.",
        "Penguin a couru vers la tasse.",
        "On aime la tasse jaune.",
      ],
      checks: [
        { prompt: "Où est la tasse?", labels: ["tapis", "chapeau"] },
        { prompt: "Regarde la tasse jaune.", labels: ["tasse", "soleil"] },
      ],
    },
    "k-otter-fish": {
      title: "Otter et le poisson",
      pages: [
        "Otter voit un poisson.",
        "Le poisson est petit.",
        "Regarde le poisson.",
        "Le poisson est rouge.",
        "Otter et le poisson jouent.",
        "J'aime le poisson.",
      ],
      checks: [
        { prompt: "Regarde le poisson.", labels: ["poisson", "bestiole"] },
        { prompt: "Le poisson est rouge.", labels: ["poisson", "chapeau"] },
      ],
    },
    "g1-koala-snack": {
      title: "Un bon goûter",
      pages: [
        "Koala a un goûter.",
        "Le goûter est jaune.",
        "Koala va le manger.",
        "Puis Koala a pris une tasse.",
        "Koala s'est assis au soleil.",
        "Koala est content.",
      ],
      checks: [
        { prompt: "Qui a un goûter?", labels: ["Koala", "cochon"] },
        { prompt: "Koala a pris une tasse.", labels: ["tasse", "chapeau"] },
      ],
    },
    "g1-hedgehog-hat": {
      title: "Le chapeau de Hedgehog",
      pages: [
        "Hedgehog a un chapeau rouge.",
        "Le chapeau est petit.",
        "Où est le chapeau?",
        "Il est sur le tapis.",
        "Hedgehog a couru le chercher.",
        "Il va le mettre.",
        "Hedgehog est content.",
      ],
      checks: [
        { prompt: "Qui a un chapeau?", labels: ["Hedgehog", "chat"] },
        { prompt: "Où est le chapeau?", labels: ["tapis", "tasse"] },
      ],
    },
    "g2-panda-moon": {
      title: "Panda et la lune",
      pages: [
        "Panda voit la lune le soir.",
        "La lune est grande et blanche.",
        "Owl est venue à la maison.",
        "Ils s'assoient et regardent la lune.",
        "Panda a dit: la nuit est très jolie.",
        "Owl était content.",
        "Puis ils sont allés dormir.",
      ],
      checks: [
        { prompt: "Qui voit la lune?", labels: ["Panda", "Fox"] },
        { prompt: "Owl est venue à la maison.", labels: ["maison", "bateau"] },
      ],
    },
    "g2-fox-boat": {
      title: "Le bateau vert",
      pages: [
        "Fox voit un bateau vert.",
        "Le bateau est sur l'eau.",
        "Fox est allé au bateau.",
        "Le bateau peut aller vite.",
        "Fox a fait une belle promenade.",
        "Puis Fox est revenu.",
        "Fox était très content.",
      ],
      checks: [
        { prompt: "Qui voit un bateau?", labels: ["Fox", "cochon"] },
        { prompt: "Le bateau est sur l'eau.", labels: ["bateau", "maison"] },
      ],
    },
    "g3-bear-warm": {
      title: "La promenade tiède",
      pages: [
        "Bear et Duck partent sur le bateau.",
        "Aujourd'hui l'eau est tiède.",
        "Ils voient un petit poisson.",
        "Le poisson peut sauter.",
        "Bear a dit: restons ensemble.",
        "Puis ils reviennent à la maison.",
        "La promenade était très bonne.",
      ],
      checks: [
        { prompt: "Qui part sur le bateau?", labels: ["Bear", "cochon"] },
        { prompt: "Ils voient un petit poisson.", labels: ["poisson", "chapeau"] },
      ],
    },
    "g3-owl-story": {
      title: "Une longue histoire",
      pages: [
        "Owl va raconter une histoire de la lune.",
        "L'histoire est longue.",
        "Bunny est venue à la maison.",
        "Ils lisent l'histoire ensemble.",
        "Owl a dit: la lune est jolie.",
        "Aujourd'hui la nuit est tiède.",
        "Puis ils dorment.",
      ],
      checks: [
        { prompt: "Qui raconte l'histoire?", labels: ["Owl", "Fox"] },
        { prompt: "Bunny est venue à la maison.", labels: ["maison", "bateau"] },
      ],
    },
    "g3-fox-kind": {
      title: "Un jour gentil",
      pages: [
        "Fox et Peach jouent à la maison.",
        "Ils lisent une histoire ensemble.",
        "L'histoire parle d'une bestiole.",
        "Fox a dit: sois gentil.",
        "Ils dessinent la bestiole.",
        "Aujourd'hui ils rient.",
        "La journée est finie.",
      ],
      checks: [
        { prompt: "Qui peut jouer?", labels: ["Fox", "cochon"] },
        { prompt: "Ils dessinent la bestiole.", labels: ["bestiole", "chapeau"] },
      ],
    },
    "g4-owl-habitat": {
      title: "L'habitat de la nuit",
      pages: [
        "Owl peut observer l'habitat de la nuit.",
        "La lune est une lumière là.",
        "Bunny est venue à la maison.",
        "Owl va expliquer l'habitat.",
        "Bunny peut comparer la lune et le soleil.",
        "Je prédis que le soleil va venir.",
        "Puis ils dorment.",
      ],
      checks: [
        { prompt: "Qui observe l'habitat?", labels: ["Owl", "Fox"] },
        { prompt: "Bunny est venue à la maison.", labels: ["maison", "bateau"] },
      ],
    },
    "g4-duck-water": {
      title: "L'habitat de l'eau",
      pages: [
        "Duck peut observer l'eau.",
        "L'eau est un habitat.",
        "Duck voit un petit poisson.",
        "Le poisson peut sauter.",
        "Duck va expliquer l'habitat.",
        "Je prédis que le poisson va nager.",
        "Duck était content.",
      ],
      checks: [
        { prompt: "Qui observe l'eau?", labels: ["Duck", "chat"] },
        { prompt: "Duck voit un poisson.", labels: ["poisson", "chapeau"] },
      ],
    },
    "g4-bear-measure": {
      title: "Mesurer le bateau",
      pages: [
        "Bear voit un bateau.",
        "Bear va mesurer le bateau.",
        "Duck peut comparer le bateau et le poisson.",
        "Le bateau est long.",
        "Bear va expliquer l'habitat de l'eau.",
        "Je prédis que le bateau va avancer.",
        "Bear était content.",
      ],
      checks: [
        { prompt: "Qui va mesurer le bateau?", labels: ["Bear", "cochon"] },
        { prompt: "Bear voit un bateau.", labels: ["bateau", "maison"] },
      ],
    },
  },
  zh: {
    "pk-panda-sun": {
      title: "大大的太阳",
      pages: ["Panda 看见 太阳。", "太阳 很大。", "太阳 是 黄色的。", "看！ Panda 会 跑。", "Panda 和 我 一起 玩。"],
      checks: [
        { prompt: "看 太阳。", labels: ["太阳", "帽子"] },
        { prompt: "Panda 会 跑。", labels: ["Panda", "小猫"] },
      ],
    },
    "pk-chick-hug": {
      title: "大大的拥抱",
      pages: ["我 看见 一只 小鸡。", "小鸡 很小。", "小鸡 是 黄色的。", "看！ 一个 大大的 拥抱。", "我们 玩。"],
      checks: [
        { prompt: "看 小鸡。", labels: ["小鸡", "小猪"] },
        { prompt: "一个 大大的 拥抱。", labels: ["小鸡", "小猫"] },
      ],
    },
    "k-penguin-cup": {
      title: "黄色的杯子",
      pages: ["Penguin 看见 一个 杯子。", "杯子 是 黄色的。", "杯子 在 哪里？", "它 在 垫子 上。", "Penguin 跑到 杯子 那里。", "我们 喜欢 黄色的 杯子。"],
      checks: [
        { prompt: "杯子 在 哪里？", labels: ["垫子", "帽子"] },
        { prompt: "看 黄色的 杯子。", labels: ["杯子", "太阳"] },
      ],
    },
    "k-otter-fish": {
      title: "Otter 和鱼",
      pages: ["Otter 看见 一条 鱼。", "鱼 很小。", "看 鱼。", "鱼 是 红色的。", "Otter 和 鱼 一起 玩。", "我 喜欢 鱼。"],
      checks: [
        { prompt: "看 鱼。", labels: ["鱼", "小虫子"] },
        { prompt: "鱼 是 红色的。", labels: ["鱼", "帽子"] },
      ],
    },
    "g1-koala-snack": {
      title: "好吃的点心",
      pages: ["Koala 有 点心。", "点心 是 黄色的。", "Koala 要 吃。", "然后 Koala 拿了 杯子。", "Koala 坐在 太阳 下。", "Koala 很 高兴。"],
      checks: [
        { prompt: "谁 有 点心？", labels: ["Koala", "小猪"] },
        { prompt: "Koala 拿了 杯子。", labels: ["杯子", "帽子"] },
      ],
    },
    "g1-hedgehog-hat": {
      title: "Hedgehog 的帽子",
      pages: ["Hedgehog 有 一顶 红帽子。", "帽子 很小。", "帽子 在 哪里？", "它 在 垫子 上。", "Hedgehog 跑去 拿 帽子。", "他 要 戴上。", "Hedgehog 很 高兴。"],
      checks: [
        { prompt: "谁 有 帽子？", labels: ["Hedgehog", "小猫"] },
        { prompt: "帽子 在 哪里？", labels: ["垫子", "杯子"] },
      ],
    },
    "g2-panda-moon": {
      title: "Panda 和月亮",
      pages: ["Panda 在 夜里 看见 月亮。", "月亮 很大， 也很 白。", "Owl 来到 房子。", "他们 坐着 看 月亮。", "Panda 说， 夜晚 非常 漂亮。", "Owl 很 高兴。", "然后 他们 去 睡觉 了。"],
      checks: [
        { prompt: "谁 看见 月亮？", labels: ["Panda", "Fox"] },
        { prompt: "Owl 来到 房子。", labels: ["房子", "小船"] },
      ],
    },
    "g2-fox-boat": {
      title: "绿色的小船",
      pages: ["Fox 看见 一条 绿色的 小船。", "小船 在 水上。", "Fox 走到 小船。", "小船 开得 很快。", "Fox 坐船 很 开心。", "然后 Fox 回来 了。", "Fox 非常 高兴。"],
      checks: [
        { prompt: "谁 看见 小船？", labels: ["Fox", "小猪"] },
        { prompt: "小船 在 水上。", labels: ["小船", "房子"] },
      ],
    },
    "g3-bear-warm": {
      title: "暖和的航行",
      pages: ["Bear 和 Duck 坐上 小船。", "今天 水 很 暖和。", "他们 看见 一条 小鱼。", "小鱼 会 跳。", "Bear 说， 我们 在 一起。", "然后 他们 回到 房子。", "航行 非常 开心。"],
      checks: [
        { prompt: "谁 坐上 小船？", labels: ["Bear", "小猪"] },
        { prompt: "他们 看见 小鱼。", labels: ["鱼", "帽子"] },
      ],
    },
    "g3-owl-story": {
      title: "一个长故事",
      pages: ["Owl 要 讲 月亮 的 故事。", "故事 很 长。", "Bunny 来到 房子。", "他们 一起 读 故事。", "Owl 说， 月亮 很 漂亮。", "今天 夜晚 很 暖和。", "然后 他们 睡觉。"],
      checks: [
        { prompt: "谁 讲 故事？", labels: ["Owl", "Fox"] },
        { prompt: "Bunny 来到 房子。", labels: ["房子", "小船"] },
      ],
    },
    "g3-fox-kind": {
      title: "友善的一天",
      pages: ["Fox 和 Peach 在 房子 玩。", "他们 一起 读 故事。", "故事 里 有 小虫子。", "Fox 说， 要 友善。", "他们 画 小虫子。", "今天 他们 笑了。", "这一天 结束 了。"],
      checks: [
        { prompt: "谁 可以 玩？", labels: ["Fox", "小猪"] },
        { prompt: "他们 画 小虫子。", labels: ["小虫子", "帽子"] },
      ],
    },
    "g4-owl-habitat": {
      title: "夜晚的栖息地",
      pages: ["Owl 观察 夜晚 的 栖息地。", "月亮 是 那里 的 光。", "Bunny 来到 房子。", "Owl 要 解释 栖息地。", "Bunny 比较 月亮 和 太阳。", "我 预测 太阳 会 来。", "然后 他们 睡觉。"],
      checks: [
        { prompt: "谁 观察 栖息地？", labels: ["Owl", "Fox"] },
        { prompt: "Bunny 来到 房子。", labels: ["房子", "小船"] },
      ],
    },
    "g4-duck-water": {
      title: "水里的栖息地",
      pages: ["Duck 观察 水。", "水 是 一个 栖息地。", "Duck 看见 一条 小鱼。", "小鱼 会 跳。", "Duck 要 解释 栖息地。", "我 预测 小鱼 会 游。", "Duck 很 高兴。"],
      checks: [
        { prompt: "谁 观察 水？", labels: ["Duck", "小猫"] },
        { prompt: "Duck 看见 鱼。", labels: ["鱼", "帽子"] },
      ],
    },
    "g4-bear-measure": {
      title: "量一量小船",
      pages: ["Bear 看见 一条 小船。", "Bear 要 量 小船。", "Duck 比较 小船 和 鱼。", "小船 很 长。", "Bear 要 解释 水里 的 栖息地。", "我 预测 小船 会 开。", "Bear 很 高兴。"],
      checks: [
        { prompt: "谁 要 量 小船？", labels: ["Bear", "小猪"] },
        { prompt: "Bear 看见 小船。", labels: ["小船", "房子"] },
      ],
    },
  },
  hi: {
    "pk-panda-sun": {
      title: "बड़ा सूरज",
      pages: ["Panda सूरज देखता है।", "सूरज बड़ा है।", "सूरज पीला है।", "देखो! Panda दौड़ता है।", "Panda और मैं खेलते हैं।"],
      checks: [
        { prompt: "सूरज देखो।", labels: ["सूरज", "टोपी"] },
        { prompt: "Panda दौड़ता है।", labels: ["Panda", "बिल्ली"] },
      ],
    },
    "pk-chick-hug": {
      title: "एक बड़ी झप्पी",
      pages: ["मैं एक चूजा देखता हूँ।", "चूजा छोटा है।", "चूजा पीला है।", "देखो! एक बड़ी झप्पी।", "हम खेलते हैं।"],
      checks: [
        { prompt: "चूजा देखो।", labels: ["चूजा", "सूअर"] },
        { prompt: "एक बड़ी झप्पी।", labels: ["चूजा", "बिल्ली"] },
      ],
    },
    "k-penguin-cup": {
      title: "पीला कप",
      pages: ["Penguin एक कप देखता है।", "कप पीला है।", "कप कहाँ है?", "वह चटाई पर है।", "Penguin कप तक दौड़ा।", "हमें पीला कप पसंद है।"],
      checks: [
        { prompt: "कप कहाँ है?", labels: ["चटाई", "टोपी"] },
        { prompt: "पीला कप देखो।", labels: ["कप", "सूरज"] },
      ],
    },
    "k-otter-fish": {
      title: "Otter और मछली",
      pages: ["Otter एक मछली देखता है।", "मछली छोटी है।", "मछली देखो।", "मछली लाल है।", "Otter और मछली खेलते हैं।", "मुझे मछली पसंद है।"],
      checks: [
        { prompt: "मछली देखो।", labels: ["मछली", "कीड़ा"] },
        { prompt: "मछली लाल है।", labels: ["मछली", "टोपी"] },
      ],
    },
    "g1-koala-snack": {
      title: "अच्छा नाश्ता",
      pages: ["Koala के पास नाश्ता है।", "नाश्ता पीला है।", "Koala इसे खाएगा।", "फिर Koala ने कप लिया।", "Koala धूप में बैठा।", "Koala खुश है।"],
      checks: [
        { prompt: "नाश्ता किसके पास है?", labels: ["Koala", "सूअर"] },
        { prompt: "Koala ने कप लिया।", labels: ["कप", "टोपी"] },
      ],
    },
    "g1-hedgehog-hat": {
      title: "Hedgehog की टोपी",
      pages: [
        "Hedgehog के पास लाल टोपी है।",
        "टोपी छोटी है।",
        "टोपी कहाँ है?",
        "वह चटाई पर है।",
        "Hedgehog टोपी लेने दौड़ा।",
        "वह टोपी लगाएगा।",
        "Hedgehog खुश है।",
      ],
      checks: [
        { prompt: "टोपी किसके पास है?", labels: ["Hedgehog", "बिल्ली"] },
        { prompt: "टोपी कहाँ है?", labels: ["चटाई", "कप"] },
      ],
    },
    "g2-panda-moon": {
      title: "Panda और चाँद",
      pages: [
        "Panda रात में चाँद देखता है।",
        "चाँद बड़ा और सफेद है।",
        "Owl घर आया।",
        "वे बैठकर चाँद देखते हैं।",
        "Panda बोला, रात बहुत सुंदर है।",
        "Owl खुश था।",
        "फिर वे सो गए।",
      ],
      checks: [
        { prompt: "चाँद कौन देखता है?", labels: ["Panda", "Fox"] },
        { prompt: "Owl घर आया।", labels: ["घर", "नाव"] },
      ],
    },
    "g2-fox-boat": {
      title: "हरी नाव",
      pages: [
        "Fox एक हरी नाव देखता है।",
        "नाव पानी पर है।",
        "Fox नाव तक गया।",
        "नाव तेज चल सकती है।",
        "Fox की सैर अच्छी रही।",
        "फिर Fox वापस आया।",
        "Fox बहुत खुश था।",
      ],
      checks: [
        { prompt: "नाव कौन देखता है?", labels: ["Fox", "सूअर"] },
        { prompt: "नाव पानी पर है।", labels: ["नाव", "घर"] },
      ],
    },
    "g3-bear-warm": {
      title: "गर्म सैर",
      pages: [
        "Bear और Duck नाव पर चलते हैं।",
        "आज पानी गर्म है।",
        "वे एक छोटी मछली देखते हैं।",
        "मछली कूद सकती है।",
        "Bear बोला, साथ रहो।",
        "फिर वे घर वापस आते हैं।",
        "सैर बहुत अच्छी रही।",
      ],
      checks: [
        { prompt: "नाव पर कौन चलता है?", labels: ["Bear", "सूअर"] },
        { prompt: "वे एक छोटी मछली देखते हैं।", labels: ["मछली", "टोपी"] },
      ],
    },
    "g3-owl-story": {
      title: "एक लंबी कहानी",
      pages: [
        "Owl चाँद की कहानी सुनाएगा।",
        "कहानी लंबी है।",
        "Bunny घर आया।",
        "वे साथ कहानी पढ़ते हैं।",
        "Owl बोला, चाँद सुंदर है।",
        "आज रात गर्म है।",
        "फिर वे सोते हैं।",
      ],
      checks: [
        { prompt: "कहानी कौन सुनाता है?", labels: ["Owl", "Fox"] },
        { prompt: "Bunny घर आया।", labels: ["घर", "नाव"] },
      ],
    },
    "g3-fox-kind": {
      title: "एक दयालु दिन",
      pages: [
        "Fox और Peach घर पर खेलते हैं।",
        "वे साथ कहानी पढ़ते हैं।",
        "कहानी एक कीड़े की है।",
        "Fox बोला, दयालु बनो।",
        "वे कीड़ा बनाते हैं।",
        "आज वे हँसते हैं।",
        "दिन पूरा हुआ।",
      ],
      checks: [
        { prompt: "कौन खेल सकता है?", labels: ["Fox", "सूअर"] },
        { prompt: "वे कीड़ा बनाते हैं।", labels: ["कीड़ा", "टोपी"] },
      ],
    },
    "g4-owl-habitat": {
      title: "रात का आवास",
      pages: [
        "Owl रात के आवास का अवलोकन करता है।",
        "चाँद वहाँ रोशनी है।",
        "Bunny घर आया।",
        "Owl आवास समझाएगा।",
        "Bunny चाँद और सूरज की तुलना करता है।",
        "मैं अनुमान लगाता हूँ सूरज आएगा।",
        "फिर वे सोते हैं।",
      ],
      checks: [
        { prompt: "आवास कौन देखता है?", labels: ["Owl", "Fox"] },
        { prompt: "Bunny घर आया।", labels: ["घर", "नाव"] },
      ],
    },
    "g4-duck-water": {
      title: "पानी का आवास",
      pages: [
        "Duck पानी का अवलोकन करता है।",
        "पानी एक आवास है।",
        "Duck एक छोटी मछली देखता है।",
        "मछली कूद सकती है।",
        "Duck आवास समझाएगा।",
        "मैं अनुमान लगाता हूँ मछली तैरेगी।",
        "Duck खुश था।",
      ],
      checks: [
        { prompt: "पानी का अवलोकन कौन करता है?", labels: ["Duck", "बिल्ली"] },
        { prompt: "Duck एक मछली देखता है।", labels: ["मछली", "टोपी"] },
      ],
    },
    "g4-bear-measure": {
      title: "नाव को मापो",
      pages: [
        "Bear एक नाव देखता है।",
        "Bear नाव को मापेगा।",
        "Duck नाव और मछली की तुलना करता है।",
        "नाव लंबी है।",
        "Bear पानी का आवास समझाएगा।",
        "मैं अनुमान लगाता हूँ नाव चलेगी।",
        "Bear खुश था।",
      ],
      checks: [
        { prompt: "नाव को कौन मापेगा?", labels: ["Bear", "सूअर"] },
        { prompt: "Bear एक नाव देखता है।", labels: ["नाव", "घर"] },
      ],
    },
  },
  ar: {
    "pk-panda-sun": {
      title: "الشمس الكبيرة",
      pages: ["يرى Panda الشمس.", "الشمس كبيرة.", "الشمس صفراء.", "انظر! يجري Panda.", "يلعب Panda معي."],
      checks: [
        { prompt: "انظر إلى الشمس.", labels: ["شمس", "قبعة"] },
        { prompt: "يجري Panda.", labels: ["Panda", "قطة"] },
      ],
    },
    "pk-chick-hug": {
      title: "حضن كبير",
      pages: ["أرى فرخا.", "الفرخ صغير.", "الفرخ أصفر.", "انظر! حضن كبير.", "نلعب."],
      checks: [
        { prompt: "انظر إلى الفرخ.", labels: ["فرخ", "خنزير"] },
        { prompt: "حضن كبير.", labels: ["فرخ", "قطة"] },
      ],
    },
    "k-penguin-cup": {
      title: "الكوب الأصفر",
      pages: ["يرى Penguin كوبا.", "الكوب أصفر.", "أين الكوب؟", "إنه على السجادة.", "ركض Penguin إلى الكوب.", "نحب الكوب الأصفر."],
      checks: [
        { prompt: "أين الكوب؟", labels: ["سجادة", "قبعة"] },
        { prompt: "انظر إلى الكوب.", labels: ["كوب", "شمس"] },
      ],
    },
    "k-otter-fish": {
      title: "Otter والسمكة",
      pages: ["يرى Otter سمكة.", "السمكة صغيرة.", "انظر إلى السمكة.", "السمكة حمراء.", "يلعب Otter مع السمكة.", "أحب السمكة."],
      checks: [
        { prompt: "انظر إلى السمكة.", labels: ["سمكة", "حشرة"] },
        { prompt: "السمكة حمراء.", labels: ["سمكة", "قبعة"] },
      ],
    },
    "g1-koala-snack": {
      title: "وجبة لذيذة",
      pages: ["لدى Koala وجبة.", "الوجبة صفراء.", "سيأكلها Koala.", "ثم أخذ Koala كوبا.", "جلس Koala في الشمس.", "Koala سعيد."],
      checks: [
        { prompt: "من لديه وجبة؟", labels: ["Koala", "خنزير"] },
        { prompt: "أخذ Koala كوبا.", labels: ["كوب", "قبعة"] },
      ],
    },
    "g1-hedgehog-hat": {
      title: "قبعة Hedgehog",
      pages: ["لدى Hedgehog قبعة حمراء.", "القبعة صغيرة.", "أين القبعة؟", "إنها على السجادة.", "ركض Hedgehog ليأخذها.", "سيضعها.", "Hedgehog سعيد."],
      checks: [
        { prompt: "من لديه قبعة؟", labels: ["Hedgehog", "قطة"] },
        { prompt: "أين القبعة؟", labels: ["سجادة", "كوب"] },
      ],
    },
    "g2-panda-moon": {
      title: "Panda والقمر",
      pages: [
        "يرى Panda القمر في الليل.",
        "القمر كبير وأبيض.",
        "جاء Owl إلى البيت.",
        "يجلسان وينظران إلى القمر.",
        "قال Panda، الليل جميل جدا.",
        "كان Owl سعيدا.",
        "ثم ناما.",
      ],
      checks: [
        { prompt: "من يرى القمر؟", labels: ["Panda", "Fox"] },
        { prompt: "جاء Owl إلى البيت.", labels: ["بيت", "قارب"] },
      ],
    },
    "g2-fox-boat": {
      title: "القارب الأخضر",
      pages: [
        "يرى Fox قاربا أخضر.",
        "القارب على الماء.",
        "ذهب Fox إلى القارب.",
        "القارب يتحرك بسرعة.",
        "استمتع Fox بالرحلة.",
        "ثم عاد Fox.",
        "كان Fox سعيدا جدا.",
      ],
      checks: [
        { prompt: "من يرى قاربا؟", labels: ["Fox", "خنزير"] },
        { prompt: "القارب على الماء.", labels: ["قارب", "بيت"] },
      ],
    },
    "g3-bear-warm": {
      title: "نزهة دافئة",
      pages: [
        "يبدأ Bear و Duck على القارب.",
        "الماء دافئ اليوم.",
        "يريان سمكة صغيرة.",
        "السمكة تقفز.",
        "قال Bear، لنبق معا.",
        "ثم يعودان إلى البيت.",
        "كانت النزهة جميلة جدا.",
      ],
      checks: [
        { prompt: "من يبدأ على القارب؟", labels: ["Bear", "خنزير"] },
        { prompt: "يريان سمكة صغيرة.", labels: ["سمكة", "قبعة"] },
      ],
    },
    "g3-owl-story": {
      title: "قصة طويلة",
      pages: [
        "سيحكي Owl قصة عن القمر.",
        "القصة طويلة.",
        "جاء Bunny إلى البيت.",
        "يقرآن القصة معا.",
        "قال Owl، القمر جميل.",
        "الليل دافئ اليوم.",
        "ثم ينامان.",
      ],
      checks: [
        { prompt: "من يحكي القصة؟", labels: ["Owl", "Fox"] },
        { prompt: "جاء Bunny إلى البيت.", labels: ["بيت", "قارب"] },
      ],
    },
    "g3-fox-kind": {
      title: "يوم لطيف",
      pages: [
        "يلعب Fox و Peach في البيت.",
        "يقرآن قصة معا.",
        "القصة عن حشرة صغيرة.",
        "قال Fox، كن لطيفا.",
        "يرسمان الحشرة.",
        "اليوم يضحكان.",
        "انتهى اليوم.",
      ],
      checks: [
        { prompt: "من يستطيع اللعب؟", labels: ["Fox", "خنزير"] },
        { prompt: "يرسمان الحشرة.", labels: ["حشرة", "قبعة"] },
      ],
    },
    "g4-owl-habitat": {
      title: "موطن الليل",
      pages: [
        "يلاحظ Owl موطن الليل.",
        "القمر ضوء هناك.",
        "جاء Bunny إلى البيت.",
        "سيشرح Owl الموطن.",
        "يقارن Bunny القمر والشمس.",
        "أتوقع أن تأتي الشمس.",
        "ثم ينامان.",
      ],
      checks: [
        { prompt: "من يلاحظ الموطن؟", labels: ["Owl", "Fox"] },
        { prompt: "جاء Bunny إلى البيت.", labels: ["بيت", "قارب"] },
      ],
    },
    "g4-duck-water": {
      title: "موطن الماء",
      pages: [
        "يلاحظ Duck الماء.",
        "الماء موطن.",
        "يرى Duck سمكة صغيرة.",
        "السمكة تقفز.",
        "سيشرح Duck الموطن.",
        "أتوقع أن تسبح السمكة.",
        "كان Duck سعيدا.",
      ],
      checks: [
        { prompt: "من يلاحظ الماء؟", labels: ["Duck", "قطة"] },
        { prompt: "يرى Duck سمكة.", labels: ["سمكة", "قبعة"] },
      ],
    },
    "g4-bear-measure": {
      title: "قياس القارب",
      pages: [
        "يرى Bear قاربا.",
        "سيقيس Bear القارب.",
        "يقارن Duck القارب والسمكة.",
        "القارب طويل.",
        "سيشرح Bear موطن الماء.",
        "أتوقع أن يتحرك القارب.",
        "كان Bear سعيدا.",
      ],
      checks: [
        { prompt: "من سيقيس القارب؟", labels: ["Bear", "خنزير"] },
        { prompt: "يرى Bear قاربا.", labels: ["قارب", "بيت"] },
      ],
    },
  },
};
