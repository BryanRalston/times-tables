import type { Locale } from "../i18n";
import { SHELF_COPY } from "./shelf-copy";

/** One book's words in a language. Choice labels follow the English choice order. */
export interface StoryCopy {
  title: string;
  pages: readonly string[];
  checks: readonly { prompt: string; labels: readonly [string, string] }[];
}

export type StoryLang = Exclude<Locale, "en">;

function withShelf(books: Record<StoryLang, Record<string, StoryCopy>>): Record<StoryLang, Record<string, StoryCopy>> {
  return {
    es: { ...books.es, ...SHELF_COPY.es },
    pt: { ...books.pt, ...SHELF_COPY.pt },
    fr: { ...books.fr, ...SHELF_COPY.fr },
    zh: { ...books.zh, ...SHELF_COPY.zh },
    hi: { ...books.hi, ...SHELF_COPY.hi },
    ar: { ...books.ar, ...SHELF_COPY.ar },
  };
}

/**
 * Kid-friendly read-along text. Character names stay Peach, Frog, Bunny, and
 * the rest, the same way the games say them. Chinese words are spaced so each
 * one can light up with its own clip.
 */
export const STORY_COPY: Record<StoryLang, Record<string, StoryCopy>> = withShelf({
  es: {
    "pk-peach-cat": {
      title: "La gatita",
      pages: [
        "Peach ve una gatita.",
        "La gatita es pequeña.",
        "¡Mira! La gatita salta.",
        "Peach y la gatita juegan.",
        "Veo un abrazo grande.",
      ],
      checks: [
        { prompt: "Mira la gatita.", labels: ["gatita", "cerdito"] },
        { prompt: "La gatita salta.", labels: ["gatita", "Peach"] },
      ],
    },
    "pk-frog-hop": {
      title: "Frog salta",
      pages: ["Frog puede saltar.", "¡Salta, salta, salta!", "Frog es rojo.", "¡Mira! El sol.", "Jugamos. Saltamos."],
      checks: [
        { prompt: "Mira a Frog.", labels: ["Frog", "gatita"] },
        { prompt: "Frog salta.", labels: ["Frog", "cerdito"] },
      ],
    },
    "k-bunny-hat": {
      title: "El gorro rojo",
      pages: [
        "Bunny ve un gorro rojo.",
        "El gorro es pequeño.",
        "¿Dónde está el gorro?",
        "Está en el tapete.",
        "Bunny corrió al gorro.",
        "Nos gusta el gorro rojo.",
      ],
      checks: [
        { prompt: "¿Dónde está el gorro?", labels: ["tapete", "vaso"] },
        { prompt: "Mira el gorro rojo.", labels: ["gorro", "sol"] },
      ],
    },
    "k-pig-bug": {
      title: "Un bichito",
      pages: [
        "Pig ve un bichito.",
        "El bichito es pequeño.",
        "El bichito está en un vaso.",
        "Pig dijo: ven aquí.",
        "El bichito puede saltar.",
        "Pig y el bichito juegan.",
      ],
      checks: [
        { prompt: "Mira el bichito.", labels: ["bichito", "gatita"] },
        { prompt: "El bichito está en un vaso.", labels: ["vaso", "gorro"] },
      ],
    },
    "g1-fox-kite": {
      title: "La cometa roja",
      pages: [
        "Fox tiene una cometa roja.",
        "La cometa puede volar.",
        "¡Mira! Subió.",
        "Luego la cometa bajó.",
        "Fox corrió a buscar la cometa.",
        "La va a volar otra vez.",
        "Fox está contento.",
      ],
      checks: [
        { prompt: "¿Quién tiene la cometa?", labels: ["Fox", "cerdito"] },
        { prompt: "La cometa vuela.", labels: ["cometa", "gorro"] },
      ],
    },
    "g1-duck-fish": {
      title: "Duck nada",
      pages: [
        "Duck ve al pez.",
        "El pez sabe nadar.",
        "Duck va a nadar con el pez.",
        "Juegan bajo el sol.",
        "Luego Duck se sentó en un tronco.",
        "Comió una merienda rica.",
      ],
      checks: [
        { prompt: "¿Quién nada?", labels: ["Duck", "gatita"] },
        { prompt: "Duck se sentó en un tronco.", labels: ["tronco", "gorro"] },
      ],
    },
    "g2-owl-night": {
      title: "La luna de noche",
      pages: [
        "Owl ve la luna de noche.",
        "La luna es grande y blanca.",
        "Bunny llegó a la casa.",
        "Se sientan a mirar la luna.",
        "Owl dijo: la noche es muy linda.",
        "Bunny estaba contenta.",
        "Luego se fueron a dormir.",
      ],
      checks: [
        { prompt: "¿Quién ve la luna?", labels: ["Owl", "Fox"] },
        { prompt: "Bunny llegó a la casa.", labels: ["casa", "barco"] },
      ],
    },
    "g2-bear-boat": {
      title: "El barco",
      pages: [
        "Bear ve un barco.",
        "El barco está en el agua.",
        "Bear fue al barco.",
        "El barco puede ir.",
        "Bear paseó muy a gusto.",
        "Luego Bear volvió.",
        "Bear estaba contento.",
      ],
      checks: [
        { prompt: "¿Quién ve un barco?", labels: ["Bear", "cerdito"] },
        { prompt: "El barco está en el agua.", labels: ["barco", "casa"] },
      ],
    },
  },
  pt: {
    "pk-peach-cat": {
      title: "A gatinha",
      pages: [
        "Peach vê uma gatinha.",
        "A gatinha é pequena.",
        "Olha! A gatinha pula.",
        "Peach e a gatinha brincam.",
        "Eu vejo um abraço grande.",
      ],
      checks: [
        { prompt: "Olha a gatinha.", labels: ["gatinha", "porquinho"] },
        { prompt: "A gatinha pula.", labels: ["gatinha", "Peach"] },
      ],
    },
    "pk-frog-hop": {
      title: "Frog pula",
      pages: ["Frog pode pular.", "Pula, pula, pula!", "Frog é vermelho.", "Olha! O sol.", "A gente brinca. A gente pula."],
      checks: [
        { prompt: "Olha o Frog.", labels: ["Frog", "gatinha"] },
        { prompt: "Frog pula.", labels: ["Frog", "porquinho"] },
      ],
    },
    "k-bunny-hat": {
      title: "O chapéu vermelho",
      pages: [
        "Bunny vê um chapéu vermelho.",
        "O chapéu é pequeno.",
        "Onde está o chapéu?",
        "Está no tapete.",
        "Bunny correu até o chapéu.",
        "A gente gosta do chapéu vermelho.",
      ],
      checks: [
        { prompt: "Onde está o chapéu?", labels: ["tapete", "copo"] },
        { prompt: "Olha o chapéu vermelho.", labels: ["chapéu", "sol"] },
      ],
    },
    "k-pig-bug": {
      title: "Um bichinho",
      pages: [
        "Pig vê um bichinho.",
        "O bichinho é pequeno.",
        "O bichinho está num copo.",
        "Pig disse: vem aqui.",
        "O bichinho pode pular.",
        "Pig e o bichinho brincam.",
      ],
      checks: [
        { prompt: "Olha o bichinho.", labels: ["bichinho", "gatinha"] },
        { prompt: "O bichinho está num copo.", labels: ["copo", "chapéu"] },
      ],
    },
    "g1-fox-kite": {
      title: "A pipa vermelha",
      pages: [
        "Fox tem uma pipa vermelha.",
        "A pipa pode voar.",
        "Olha! Ela subiu.",
        "Depois a pipa desceu.",
        "Fox correu para pegar a pipa.",
        "Ele vai soltar de novo.",
        "Fox está feliz.",
      ],
      checks: [
        { prompt: "Quem tem a pipa?", labels: ["Fox", "porquinho"] },
        { prompt: "A pipa voa.", labels: ["pipa", "chapéu"] },
      ],
    },
    "g1-duck-fish": {
      title: "Duck nada",
      pages: [
        "Duck vê o peixe.",
        "O peixe sabe nadar.",
        "Duck vai nadar com o peixe.",
        "Eles brincam no sol.",
        "Depois Duck sentou num tronco.",
        "Duck comeu um lanche gostoso.",
      ],
      checks: [
        { prompt: "Quem nada?", labels: ["Duck", "gatinha"] },
        { prompt: "Duck sentou num tronco.", labels: ["tronco", "chapéu"] },
      ],
    },
    "g2-owl-night": {
      title: "A lua da noite",
      pages: [
        "Owl vê a lua de noite.",
        "A lua é grande e branca.",
        "Bunny chegou na casa.",
        "Eles sentam e olham a lua.",
        "Owl disse: a noite está muito bonita.",
        "Bunny ficou feliz.",
        "Depois eles foram dormir.",
      ],
      checks: [
        { prompt: "Quem vê a lua?", labels: ["Owl", "Fox"] },
        { prompt: "Bunny chegou na casa.", labels: ["casa", "barco"] },
      ],
    },
    "g2-bear-boat": {
      title: "O barco",
      pages: [
        "Bear vê um barco.",
        "O barco está na água.",
        "Bear foi até o barco.",
        "O barco pode andar.",
        "Bear fez um passeio bom.",
        "Depois Bear voltou.",
        "Bear ficou feliz.",
      ],
      checks: [
        { prompt: "Quem vê um barco?", labels: ["Bear", "porquinho"] },
        { prompt: "O barco está na água.", labels: ["barco", "casa"] },
      ],
    },
  },
  fr: {
    "pk-peach-cat": {
      title: "Le petit chat",
      pages: [
        "Peach voit un petit chat.",
        "Le chat est petit.",
        "Regarde! Le chat saute.",
        "Peach et le chat jouent.",
        "Je vois un gros câlin.",
      ],
      checks: [
        { prompt: "Regarde le chat.", labels: ["chat", "cochon"] },
        { prompt: "Le chat saute.", labels: ["chat", "Peach"] },
      ],
    },
    "pk-frog-hop": {
      title: "Frog saute",
      pages: ["Frog peut sauter.", "Saute, saute, saute!", "Frog est rouge.", "Regarde! Le soleil.", "On joue. On saute."],
      checks: [
        { prompt: "Regarde Frog.", labels: ["Frog", "chat"] },
        { prompt: "Frog saute.", labels: ["Frog", "cochon"] },
      ],
    },
    "k-bunny-hat": {
      title: "Le chapeau rouge",
      pages: [
        "Bunny voit un chapeau rouge.",
        "Le chapeau est petit.",
        "Où est le chapeau?",
        "Il est sur le tapis.",
        "Bunny a couru vers le chapeau.",
        "On aime le chapeau rouge.",
      ],
      checks: [
        { prompt: "Où est le chapeau?", labels: ["tapis", "tasse"] },
        { prompt: "Regarde le chapeau rouge.", labels: ["chapeau", "soleil"] },
      ],
    },
    "k-pig-bug": {
      title: "Une bestiole",
      pages: [
        "Pig voit une bestiole.",
        "La bestiole est petite.",
        "La bestiole est sur une tasse.",
        "Pig a dit: viens ici.",
        "La bestiole peut sauter.",
        "Pig et la bestiole jouent.",
      ],
      checks: [
        { prompt: "Regarde la bestiole.", labels: ["bestiole", "chat"] },
        { prompt: "La bestiole est sur une tasse.", labels: ["tasse", "chapeau"] },
      ],
    },
    "g1-fox-kite": {
      title: "Le cerf-volant rouge",
      pages: [
        "Fox a un cerf-volant rouge.",
        "Le cerf-volant peut voler.",
        "Regarde! Il est monté.",
        "Puis le cerf-volant est redescendu.",
        "Fox a couru chercher le cerf-volant.",
        "Il va le faire voler encore.",
        "Fox est content.",
      ],
      checks: [
        { prompt: "Qui a un cerf-volant?", labels: ["Fox", "cochon"] },
        { prompt: "Le cerf-volant vole.", labels: ["cerf-volant", "chapeau"] },
      ],
    },
    "g1-duck-fish": {
      title: "Duck nage",
      pages: [
        "Duck voit le poisson.",
        "Le poisson sait nager.",
        "Duck va nager avec le poisson.",
        "Ils jouent au soleil.",
        "Puis Duck s'est assis sur une bûche.",
        "Duck a mangé un bon goûter.",
      ],
      checks: [
        { prompt: "Qui sait nager?", labels: ["Duck", "chat"] },
        { prompt: "Duck s'est assis sur une bûche.", labels: ["bûche", "chapeau"] },
      ],
    },
    "g2-owl-night": {
      title: "La lune du soir",
      pages: [
        "Owl voit la lune le soir.",
        "La lune est grande et blanche.",
        "Bunny est venue à la maison.",
        "Ils s'assoient et regardent la lune.",
        "Owl a dit: la nuit est très jolie.",
        "Bunny était contente.",
        "Puis ils sont allés dormir.",
      ],
      checks: [
        { prompt: "Qui voit la lune?", labels: ["Owl", "Fox"] },
        { prompt: "Bunny est venue à la maison.", labels: ["maison", "bateau"] },
      ],
    },
    "g2-bear-boat": {
      title: "Le bateau",
      pages: [
        "Bear voit un bateau.",
        "Le bateau est sur l'eau.",
        "Bear est allé au bateau.",
        "Le bateau peut avancer.",
        "Bear a fait une belle promenade.",
        "Puis Bear est revenu.",
        "Bear était content.",
      ],
      checks: [
        { prompt: "Qui voit un bateau?", labels: ["Bear", "cochon"] },
        { prompt: "Le bateau est sur l'eau.", labels: ["bateau", "maison"] },
      ],
    },
  },
  zh: {
    "pk-peach-cat": {
      title: "小猫",
      pages: ["Peach 看见 一只 小猫。", "小猫 很小。", "看！ 小猫 会 跳。", "Peach 和 小猫 一起 玩。", "我 看见 一个 大大的 拥抱。"],
      checks: [
        { prompt: "看 小猫。", labels: ["小猫", "小猪"] },
        { prompt: "小猫 会 跳。", labels: ["小猫", "Peach"] },
      ],
    },
    "pk-frog-hop": {
      title: "Frog 会跳",
      pages: ["Frog 会 跳。", "跳， 跳， 跳！", "Frog 是 红色的。", "看！ 太阳。", "我们 玩。 我们 跳。"],
      checks: [
        { prompt: "看 Frog。", labels: ["Frog", "小猫"] },
        { prompt: "Frog 会 跳。", labels: ["Frog", "小猪"] },
      ],
    },
    "k-bunny-hat": {
      title: "红帽子",
      pages: ["Bunny 看见 一顶 红帽子。", "帽子 很小。", "帽子 在 哪里？", "它 在 垫子 上。", "Bunny 跑到 帽子 那里。", "我们 喜欢 红帽子。"],
      checks: [
        { prompt: "帽子 在 哪里？", labels: ["垫子", "杯子"] },
        { prompt: "看 红帽子。", labels: ["帽子", "太阳"] },
      ],
    },
    "k-pig-bug": {
      title: "小虫子",
      pages: ["Pig 看见 一只 小虫子。", "小虫子 很小。", "小虫子 在 杯子 上。", "Pig 说， 过来。", "小虫子 会 跳。", "Pig 和 小虫子 一起 玩。"],
      checks: [
        { prompt: "看 小虫子。", labels: ["小虫子", "小猫"] },
        { prompt: "小虫子 在 杯子 上。", labels: ["杯子", "帽子"] },
      ],
    },
    "g1-fox-kite": {
      title: "红风筝",
      pages: [
        "Fox 有 一只 红风筝。",
        "风筝 会 飞。",
        "看！ 它 飞上去 了。",
        "然后 风筝 落下来 了。",
        "Fox 跑去 拿 风筝。",
        "他 还要 再 飞 一次。",
        "Fox 很 高兴。",
      ],
      checks: [
        { prompt: "谁 有 风筝？", labels: ["Fox", "小猪"] },
        { prompt: "风筝 会 飞。", labels: ["风筝", "帽子"] },
      ],
    },
    "g1-duck-fish": {
      title: "Duck 会游泳",
      pages: ["Duck 看见 鱼。", "鱼 会 游泳。", "Duck 要 和 鱼 一起 游。", "他们 在 太阳 下 玩。", "然后 Duck 坐在 木头 上。", "Duck 吃了 好吃的 点心。"],
      checks: [
        { prompt: "谁 会 游泳？", labels: ["Duck", "小猫"] },
        { prompt: "Duck 坐在 木头 上。", labels: ["木头", "帽子"] },
      ],
    },
    "g2-owl-night": {
      title: "夜里的月亮",
      pages: [
        "Owl 在 夜里 看见 月亮。",
        "月亮 很大， 也很 白。",
        "Bunny 来到 房子。",
        "他们 坐着 看 月亮。",
        "Owl 说， 夜晚 非常 漂亮。",
        "Bunny 很 高兴。",
        "然后 他们 去 睡觉 了。",
      ],
      checks: [
        { prompt: "谁 看见 月亮？", labels: ["Owl", "Fox"] },
        { prompt: "Bunny 来到 房子。", labels: ["房子", "小船"] },
      ],
    },
    "g2-bear-boat": {
      title: "小船",
      pages: ["Bear 看见 一条 小船。", "小船 在 水上。", "Bear 走到 小船。", "小船 会 开。", "Bear 坐船 很 开心。", "然后 Bear 回来 了。", "Bear 很 高兴。"],
      checks: [
        { prompt: "谁 看见 小船？", labels: ["Bear", "小猪"] },
        { prompt: "小船 在 水上。", labels: ["小船", "房子"] },
      ],
    },
  },
  hi: {
    "pk-peach-cat": {
      title: "छोटी बिल्ली",
      pages: ["Peach एक बिल्ली देखता है।", "बिल्ली छोटी है।", "देखो! बिल्ली कूदती है।", "Peach और बिल्ली खेलते हैं।", "मुझे एक बड़ी झप्पी दिखी।"],
      checks: [
        { prompt: "बिल्ली को देखो।", labels: ["बिल्ली", "सूअर"] },
        { prompt: "बिल्ली कूदती है।", labels: ["बिल्ली", "Peach"] },
      ],
    },
    "pk-frog-hop": {
      title: "Frog कूदता है",
      pages: ["Frog कूद सकता है।", "कूदो, कूदो, कूदो!", "Frog लाल है।", "देखो! सूरज।", "हम खेलते हैं। हम कूदते हैं।"],
      checks: [
        { prompt: "Frog को देखो।", labels: ["Frog", "बिल्ली"] },
        { prompt: "Frog कूदता है।", labels: ["Frog", "सूअर"] },
      ],
    },
    "k-bunny-hat": {
      title: "लाल टोपी",
      pages: [
        "Bunny को एक लाल टोपी दिखी।",
        "टोपी छोटी है।",
        "टोपी कहाँ है?",
        "वह चटाई पर है।",
        "Bunny टोपी तक दौड़ा।",
        "हमें लाल टोपी पसंद है।",
      ],
      checks: [
        { prompt: "टोपी कहाँ है?", labels: ["चटाई", "कप"] },
        { prompt: "लाल टोपी देखो।", labels: ["टोपी", "सूरज"] },
      ],
    },
    "k-pig-bug": {
      title: "एक छोटा कीड़ा",
      pages: [
        "Pig एक कीड़ा देखता है।",
        "कीड़ा छोटा है।",
        "कीड़ा कप पर है।",
        "Pig बोला, इधर आओ।",
        "कीड़ा कूद सकता है।",
        "Pig और कीड़ा खेलते हैं।",
      ],
      checks: [
        { prompt: "कीड़ा देखो।", labels: ["कीड़ा", "बिल्ली"] },
        { prompt: "कीड़ा कप पर है।", labels: ["कप", "टोपी"] },
      ],
    },
    "g1-fox-kite": {
      title: "लाल पतंग",
      pages: [
        "Fox के पास लाल पतंग है।",
        "पतंग उड़ सकती है।",
        "देखो! वह ऊपर गई।",
        "फिर पतंग नीचे आई।",
        "Fox पतंग लेने दौड़ा।",
        "वह उसे फिर उड़ाएगा।",
        "Fox खुश है।",
      ],
      checks: [
        { prompt: "पतंग किसके पास है?", labels: ["Fox", "सूअर"] },
        { prompt: "पतंग उड़ती है।", labels: ["पतंग", "टोपी"] },
      ],
    },
    "g1-duck-fish": {
      title: "Duck तैरता है",
      pages: [
        "Duck मछली को देखता है।",
        "मछली तैर सकती है।",
        "Duck मछली के साथ तैरेगा।",
        "वे धूप में खेलते हैं।",
        "फिर Duck लट्ठे पर बैठा।",
        "Duck ने अच्छा नाश्ता किया।",
      ],
      checks: [
        { prompt: "कौन तैरता है?", labels: ["Duck", "बिल्ली"] },
        { prompt: "Duck लट्ठे पर बैठा।", labels: ["लट्ठा", "टोपी"] },
      ],
    },
    "g2-owl-night": {
      title: "रात का चाँद",
      pages: [
        "Owl रात में चाँद देखता है।",
        "चाँद बड़ा और सफेद है।",
        "Bunny घर आया।",
        "वे बैठकर चाँद देखते हैं।",
        "Owl बोला, रात बहुत सुंदर है।",
        "Bunny खुश था।",
        "फिर वे सो गए।",
      ],
      checks: [
        { prompt: "चाँद कौन देखता है?", labels: ["Owl", "Fox"] },
        { prompt: "Bunny घर आया।", labels: ["घर", "नाव"] },
      ],
    },
    "g2-bear-boat": {
      title: "नाव",
      pages: [
        "Bear एक नाव देखता है।",
        "नाव पानी पर है।",
        "Bear नाव तक गया।",
        "नाव चल सकती है।",
        "Bear की सैर अच्छी रही।",
        "फिर Bear वापस आया।",
        "Bear खुश था।",
      ],
      checks: [
        { prompt: "नाव कौन देखता है?", labels: ["Bear", "सूअर"] },
        { prompt: "नाव पानी पर है।", labels: ["नाव", "घर"] },
      ],
    },
  },
  ar: {
    "pk-peach-cat": {
      title: "القطة",
      pages: ["Peach يرى قطة صغيرة.", "القطة صغيرة.", "انظر! القطة تقفز.", "يلعب Peach مع القطة.", "أرى حضنا كبيرا."],
      checks: [
        { prompt: "انظر إلى القطة.", labels: ["قطة", "خنزير"] },
        { prompt: "القطة تقفز.", labels: ["قطة", "Peach"] },
      ],
    },
    "pk-frog-hop": {
      title: "Frog يقفز",
      pages: ["Frog يقفز.", "اقفز، اقفز، اقفز!", "Frog أحمر.", "انظر! الشمس.", "نلعب. نقفز."],
      checks: [
        { prompt: "انظر إلى Frog.", labels: ["Frog", "قطة"] },
        { prompt: "Frog يقفز.", labels: ["Frog", "خنزير"] },
      ],
    },
    "k-bunny-hat": {
      title: "القبعة الحمراء",
      pages: [
        "ترى Bunny قبعة حمراء.",
        "القبعة صغيرة.",
        "أين القبعة؟",
        "إنها على السجادة.",
        "ركض Bunny إلى القبعة.",
        "نحب القبعة الحمراء.",
      ],
      checks: [
        { prompt: "أين القبعة؟", labels: ["سجادة", "كوب"] },
        { prompt: "انظر إلى القبعة.", labels: ["قبعة", "شمس"] },
      ],
    },
    "k-pig-bug": {
      title: "حشرة صغيرة",
      pages: [
        "يرى Pig حشرة.",
        "الحشرة صغيرة.",
        "الحشرة على كوب.",
        "قال Pig، تعال هنا.",
        "الحشرة تقفز.",
        "يلعب Pig مع الحشرة.",
      ],
      checks: [
        { prompt: "انظر إلى الحشرة.", labels: ["حشرة", "قطة"] },
        { prompt: "الحشرة على كوب.", labels: ["كوب", "قبعة"] },
      ],
    },
    "g1-fox-kite": {
      title: "الطائرة الورقية",
      pages: [
        "لدى Fox طائرة ورقية.",
        "الطائرة تطير.",
        "انظر! طارت للأعلى.",
        "ثم نزلت.",
        "ركض Fox إليها.",
        "سيطيرها مرة أخرى.",
        "Fox سعيد.",
      ],
      checks: [
        { prompt: "من لديه طائرة؟", labels: ["Fox", "خنزير"] },
        { prompt: "الطائرة تطير.", labels: ["طائرة", "قبعة"] },
      ],
    },
    "g1-duck-fish": {
      title: "Duck يسبح",
      pages: [
        "يرى Duck السمكة.",
        "السمكة تسبح.",
        "سيسبح Duck مع السمكة.",
        "يلعبان في الشمس.",
        "ثم جلس Duck على جذع.",
        "أكل Duck وجبة لذيذة.",
      ],
      checks: [
        { prompt: "من يسبح؟", labels: ["Duck", "قطة"] },
        { prompt: "جلس Duck على جذع.", labels: ["جذع", "قبعة"] },
      ],
    },
    "g2-owl-night": {
      title: "قمر الليل",
      pages: [
        "يرى Owl القمر في الليل.",
        "القمر كبير وأبيض.",
        "جاء Bunny إلى البيت.",
        "يجلسان وينظران إلى القمر.",
        "قال Owl، الليل جميل جدا.",
        "كان Bunny سعيدا.",
        "ثم ناما.",
      ],
      checks: [
        { prompt: "من يرى القمر؟", labels: ["Owl", "Fox"] },
        { prompt: "جاء Bunny إلى البيت.", labels: ["بيت", "قارب"] },
      ],
    },
    "g2-bear-boat": {
      title: "القارب",
      pages: [
        "يرى Bear قاربا.",
        "القارب على الماء.",
        "ذهب Bear إلى القارب.",
        "القارب يتحرك.",
        "استمتع Bear بالرحلة.",
        "ثم عاد Bear.",
        "كان Bear سعيدا.",
      ],
      checks: [
        { prompt: "من يرى قاربا؟", labels: ["Bear", "خنزير"] },
        { prompt: "القارب على الماء.", labels: ["قارب", "بيت"] },
      ],
    },
  },
});
