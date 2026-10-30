import { squisheeById } from "@/lib/squishees";
import type { Board, CountBoard, GraphsBoard, MeasureBoard, PhonicsBoard, PlaceBoard, ShapeBoard } from "../games/boards";
import type { Visual } from "../games/types";
import { getLocale, thingName, type Locale } from "../i18n";
import type { RoundSlot } from "../round-flow";
import { personaOf } from "./persona";

function nameOf(id: string, fallback: string): string {
  return squisheeById(id)?.name ?? fallback;
}

function pals(n: number): string {
  const word = n === 1 ? "squishee" : "squishees";
  return `${n} ${thingName("squishees", n, word)}`;
}

function say(en: string, es: string, pt: string, fr?: string, zh?: string, hi?: string, ar?: string): string {
  const locale: Locale = getLocale();
  switch (locale) {
    case "es":
      return es;
    case "pt":
      return pt;
    case "fr":
      return fr ?? en;
    case "zh":
      return zh ?? en;
    case "hi":
      return hi ?? en;
    case "ar":
      return ar ?? en;
    case "en":
      return en;
    default: {
      const neverLocale: never = locale;
      return neverLocale;
    }
  }
}

/** Name only the numbers the equation shows. A hidden addend stays hidden. */
function addStory(visual: Extract<Visual, { kind: "add" }>, buddy: string, host: string, trait: string): string {
  const total = visual.pink + visual.teal;
  if (visual.op === "+" && (visual.pink === 0 || visual.teal === 0)) {
    return say(
      `${buddy} the ${trait} has ${pals(total)}. How many is that?`,
      `${buddy}, ${trait}, tiene ${pals(total)}. ¿Cuántos son?`,
      `${buddy}, ${trait}, tem ${pals(total)}. Quantos são?`,
      `${buddy}, ${trait}, a ${pals(total)}. Combien ça fait ?`,
      `${buddy}，${trait}，有${pals(total)}。一共几个？`,
      `${buddy} ${trait} के पास ${pals(total)} हैं। कुल कितने हैं?`,
      `${buddy} ${trait} معه ${pals(total)}. كم هذا؟`,
    );
  }
  if (visual.op === "-" && visual.teal === 0) {
    return say(
      `${buddy} the ${trait} has ${pals(visual.pink)}. How many are left?`,
      `${buddy}, ${trait}, tiene ${pals(visual.pink)}. ¿Cuántos quedan?`,
      `${buddy}, ${trait}, tem ${pals(visual.pink)}. Quantos sobram?`,
      `${buddy}, ${trait}, a ${pals(visual.pink)}. Combien en reste-t-il ?`,
      `${buddy}，${trait}，有${pals(visual.pink)}。还剩几个？`,
      `${buddy} ${trait} के पास ${pals(visual.pink)} हैं। कितने बचे?`,
      `${buddy} ${trait} معه ${pals(visual.pink)}. كم يبقى؟`,
    );
  }
  if (visual.op === "+") {
    if (visual.result == null) {
      return say(
        `${buddy} the ${trait} has ${pals(visual.pink)}. ${host} brings ${pals(visual.teal)}. How many in all?`,
        `${buddy}, ${trait}, tiene ${pals(visual.pink)}. ${host} trae ${pals(visual.teal)}. ¿Cuántos hay en total?`,
        `${buddy}, ${trait}, tem ${pals(visual.pink)}. ${host} traz ${pals(visual.teal)}. Quantos tem ao todo?`,
        `${buddy}, ${trait}, a ${pals(visual.pink)}. ${host} apporte ${pals(visual.teal)}. Combien en tout ?`,
      `${buddy}，${trait}，有${pals(visual.pink)}。${host}拿来${pals(visual.teal)}。一共有几个？`,
        `${buddy} ${trait} के पास ${pals(visual.pink)} हैं। ${host} ${pals(visual.teal)} लाता है। कुल कितने हैं?`,
        `${buddy} ${trait} معه ${pals(visual.pink)}. ${host} يحضر ${pals(visual.teal)}. كم المجموع؟`,
      );
    }
    if (visual.right == null) {
      return say(
        `${buddy} the ${trait} has ${pals(visual.pink)}. Together they have ${pals(total)}. How many did ${host} bring?`,
        `${buddy}, ${trait}, tiene ${pals(visual.pink)}. Juntos tienen ${pals(total)}. ¿Cuántos trajo ${host}?`,
        `${buddy}, ${trait}, tem ${pals(visual.pink)}. Juntos eles têm ${pals(total)}. Quantos ${host} trouxe?`,
        `${buddy}, ${trait}, a ${pals(visual.pink)}. Ensemble, ils en ont ${pals(total)}. Combien ${host} a apporté ?`,
      `${buddy}，${trait}，有${pals(visual.pink)}。他们一共有${pals(total)}。${host}拿来了几个？`,
        `${buddy} ${trait} के पास ${pals(visual.pink)} हैं। दोनों के पास मिलकर ${pals(total)} हैं। ${host} कितने लाया?`,
        `${buddy} ${trait} معه ${pals(visual.pink)}. معًا لديهما ${pals(total)}. كم أحضر ${host}؟`,
      );
    }
    return say(
      `${host} brings ${pals(visual.teal)}. Together they have ${pals(total)}. How many did ${buddy} start with?`,
      `${host} trae ${pals(visual.teal)}. Juntos tienen ${pals(total)}. ¿Con cuántos empezó ${buddy}?`,
      `${host} traz ${pals(visual.teal)}. Juntos eles têm ${pals(total)}. Com quantos ${buddy} começou?`,
      `${host} apporte ${pals(visual.teal)}. Ensemble, ils en ont ${pals(total)}. Avec combien ${buddy} a commencé ?`,
    `${host}拿来${pals(visual.teal)}。他们一共有${pals(total)}。${buddy}一开始有几个？`,
      `${host} ${pals(visual.teal)} लाता है। दोनों के पास मिलकर ${pals(total)} हैं। ${buddy} के पास शुरू में कितने थे?`,
      `${host} يحضر ${pals(visual.teal)}. معًا لديهما ${pals(total)}. كم كان مع ${buddy} في البداية؟`,
    );
  }
  if (visual.result == null) {
    return say(
      `${buddy} the ${trait} has ${pals(total)} and shares ${pals(visual.teal)} with ${host}. How many are left?`,
      `${buddy}, ${trait}, tiene ${pals(total)} y comparte ${pals(visual.teal)} con ${host}. ¿Cuántos quedan?`,
      `${buddy}, ${trait}, tem ${pals(total)} e reparte ${pals(visual.teal)} com ${host}. Quantos sobram?`,
      `${buddy}, ${trait}, a ${pals(total)} et en partage ${pals(visual.teal)} avec ${host}. Combien en reste-t-il ?`,
    `${buddy}，${trait}，有${pals(total)}，分给${host} ${pals(visual.teal)}。还剩几个？`,
      `${buddy} ${trait} के पास ${pals(total)} हैं और ${pals(visual.teal)} को ${host} के साथ बाँटता है। कितने बचे?`,
      `${buddy} ${trait} معه ${pals(total)} ويشارك ${host} بـ ${pals(visual.teal)}. كم يبقى؟`,
    );
  }
  if (visual.right == null) {
    return say(
      `${buddy} the ${trait} has ${pals(total)} and has ${pals(visual.pink)} left. How many did ${buddy} share with ${host}?`,
      `${buddy}, ${trait}, tiene ${pals(total)} y le quedan ${pals(visual.pink)}. ¿Cuántos compartió con ${host}?`,
      `${buddy}, ${trait}, tem ${pals(total)} e sobram ${pals(visual.pink)}. Quantos ${buddy} repartiu com ${host}?`,
      `${buddy}, ${trait}, a ${pals(total)} et il en reste ${pals(visual.pink)}. Combien ${buddy} a partagé avec ${host} ?`,
    `${buddy}，${trait}，有${pals(total)}，还剩${pals(visual.pink)}。${buddy}分给${host}几个？`,
      `${buddy} ${trait} के पास ${pals(total)} हैं और ${pals(visual.pink)} बचे हैं। ${buddy} ने ${host} के साथ कितने बाँटे?`,
      `${buddy} ${trait} معه ${pals(total)} وبقي ${pals(visual.pink)}. كم شارك ${buddy} مع ${host}؟`,
    );
  }
  return say(
    `${buddy} the ${trait} shares ${pals(visual.teal)} with ${host} and has ${pals(visual.pink)} left. How many did ${buddy} start with?`,
    `${buddy}, ${trait}, comparte ${pals(visual.teal)} con ${host} y le quedan ${pals(visual.pink)}. ¿Con cuántos empezó?`,
    `${buddy}, ${trait}, reparte ${pals(visual.teal)} com ${host} e sobram ${pals(visual.pink)}. Com quantos começou?`,
    `${buddy}, ${trait}, partage ${pals(visual.teal)} avec ${host} et il en reste ${pals(visual.pink)}. Avec combien a-t-il commencé ?`,
  `${buddy}，${trait}，分给${host} ${pals(visual.teal)}，还剩${pals(visual.pink)}。${buddy}一开始有几个？`,
    `${buddy} ${trait} ${pals(visual.teal)} को ${host} के साथ बाँटता है और ${pals(visual.pink)} बचे हैं। ${buddy} के पास शुरू में कितने थे?`,
    `${buddy} ${trait} يشارك ${host} بـ ${pals(visual.teal)} ويبقى ${pals(visual.pink)}. كم كان معه في البداية؟`,
  );
}

export function storyLine(visual: Visual, buddyId: string, hostId: string): string {
  const buddy = nameOf(buddyId, "Peach");
  const host = nameOf(hostId, "Panda");
  const trait = personaOf(buddyId).trait;
  switch (visual.kind) {
    case "times":
      if (visual.ask === "factor") {
        return say(`${host} looks for a factor of ${visual.a}.`, `${host} busca un factor de ${visual.a}.`, `${host} procura um fator de ${visual.a}.`, `${host} cherche un facteur de ${visual.a}.`, `${host}在找${visual.a}的因数。`, `${host} ${visual.a} का गुणनखंड ढूँढता है।`, `${host} يبحث عن عامل للعدد ${visual.a}.`);
      }
      if (visual.ask === "multiple") {
        return say(`${host} skip counts by ${visual.a}.`, `${host} cuenta de ${visual.a} en ${visual.a}.`, `${host} conta de ${visual.a} em ${visual.a}.`, `${host} compte de ${visual.a} en ${visual.a}.`, `${host}按${visual.a}个一数。`, `${host} ${visual.a} की गिनती छोड़कर गिनता है।`, `${host} يعدّ قفزًا بمقدار ${visual.a}.`);
      }
      if (visual.ask === "divide") {
        return say(
          `${host} shares ${visual.a} into groups of ${visual.b}.`,
          `${host} reparte ${visual.a} en grupos de ${visual.b}.`,
          `${host} reparte ${visual.a} em grupos de ${visual.b}.`,
          `${host} partage ${visual.a} en groupes de ${visual.b}.`,
        `${host}把${visual.a}分成每组${visual.b}个。`,
          `${host} ${visual.a} को ${visual.b} के समूहों में बाँटता है।`,
          `${host} يقسم ${visual.a} إلى مجموعات من ${visual.b}.`,
        );
      }
      return say(
        `${host} sets out ${visual.a} groups of ${pals(visual.b)}. How many?`,
        `${host} pone ${visual.a} grupos de ${pals(visual.b)}. ¿Cuántos hay?`,
        `${host} põe ${visual.a} grupos de ${pals(visual.b)}. Quantos tem?`,
        `${host} pose ${visual.a} groupes de ${pals(visual.b)}. Combien ?`,
      `${host}摆了${visual.a}组，每组${pals(visual.b)}。一共有几个？`,
        `${host} ${pals(visual.b)} के ${visual.a} समूह रखता है। कितने हैं?`,
        `${host} يضع ${visual.a} مجموعات من ${pals(visual.b)}. كم العدد؟`,
      );
    case "add":
      return addStory(visual, buddy, host, trait);
    case "time":
      if (visual.level === "elapsed") {
        return say(
          `${host} waits. How much time passed?`,
          `${host} espera. ¿Cuánto tiempo pasó?`,
          `${host} espera. Quanto tempo passou?`,
          `${host} attend. Combien de temps a passé ?`,
          `${host}等了一会儿。过了多久？`,
          `${host} इंतज़ार करता है। कितना समय बीता?`,
          `${host} ينتظر. كم مضى من الوقت؟`,
        );
      }
      return say(`${host} checks the clock. What time is it?`, `${host} mira el reloj. ¿Qué hora es?`, `${host} olha o relógio. Que horas são?`, `${host} regarde l'horloge. Quelle heure est-il ?`, `${host}看了看钟。现在几点？`, `${host} घड़ी देखता है। क्या समय हुआ है?`, `${host} ينظر إلى الساعة. كم الساعة؟`);
    case "money":
      if (visual.mode === "name") {
        return say(`${host} holds up a coin. What coin is it?`, `${host} muestra una moneda. ¿Qué moneda es?`, `${host} mostra uma moeda. Que moeda é?`, `${host} montre une pièce. Quelle pièce est-ce ?`, `${host}举起一枚硬币。这是哪种硬币？`, `${host} एक सिक्का दिखाता है। यह कौन सा सिक्का है?`, `${host} يرفع قطعة نقد. ما هذه القطعة؟`);
      }
      if (visual.mode === "change") {
        return say(`${buddy} pays ${host}. How much change is left?`, `${buddy} le paga a ${host}. ¿Cuánto cambio queda?`, `${buddy} paga ${host}. Quanto de troco sobra?`, `${buddy} paie ${host}. Combien de monnaie reste-t-il ?`, `${buddy}付给${host}。要找回多少钱？`, `${buddy} ${host} देता है। कितने पैसे बचे?`, `${buddy} يدفع إلى ${host}. كم الباقي؟`);
      }
      if (visual.mode === "make") {
        return say(
          `${buddy} and ${host} make the amount with coins.`,
          `${buddy} y ${host} forman la cantidad con monedas.`,
          `${buddy} e ${host} montam o valor com moedas.`,
          `${buddy} et ${host} forment la somme avec des pièces.`,
        `${buddy}和${host}用硬币凑出这个钱数。`,
          `${buddy} और ${host} सिक्कों से राशि बनाते हैं।`,
          `${buddy} و${host} يكوّنان المبلغ بالقطع.`,
        );
      }
      return say(
        `${buddy} and ${host} share the coins. How much do they have?`,
        `${buddy} y ${host} comparten las monedas. ¿Cuánto tienen?`,
        `${buddy} e ${host} compartilham as moedas. Quanto eles têm?`,
        `${buddy} et ${host} se partagent les pièces. Combien ont-ils ?`,
      `${buddy}和${host}一起数这些硬币。一共多少钱？`, `${buddy} और ${host} सिक्के बाँटते हैं। उनके पास कितने हैं?`, `${buddy} و${host} يتقاسمان القطع. كم معهما؟`);
    case "sight":
      return say(
        `${host} and ${buddy} read a word together. What does it say?`,
        `${host} y ${buddy} leen una palabra juntos. ¿Qué dice?`,
        `${host} e ${buddy} leem uma palavra juntos. O que está escrito?`,
        `${host} et ${buddy} lisent un mot ensemble. Qu'est-ce qui est écrit ?`,
      `${host}和${buddy}一起读一个词。上面写的是什么？`, `${host} और ${buddy} साथ में एक शब्द पढ़ते हैं। वह क्या कहता है?`, `${host} و${buddy} يقرأان كلمة معًا. ماذا تقول؟`);
    case "spell":
      return say(`${buddy} helps ${host} spell the word.`, `${buddy} ayuda a ${host} a deletrear la palabra.`, `${buddy} ajuda ${host} a soletrar a palavra.`, `${buddy} aide ${host} à épeler le mot.`, `${buddy}帮${host}拼这个词。`, `${buddy} ${host} को शब्द लिखने में मदद करता है।`, `${buddy} يساعد ${host} على تهجئة الكلمة.`);
    case "scene":
      return sceneStory(visual.board, buddy, host, trait);
    default: {
      const neverVisual: never = visual;
      return neverVisual;
    }
  }
}

function countStory(board: CountBoard, buddy: string, host: string, trait: string): string {
  switch (board.mode) {
    case "compare":
      return say(
        `${buddy} the ${trait} looks at the groups. Which one?`,
        `${buddy}, ${trait}, mira los grupos. ¿Cuál es?`,
        `${buddy}, ${trait}, olha os grupos. Qual é?`,
        `${buddy}, ${trait}, regarde les groupes. Lequel ?`,
        `${buddy}，${trait}，看看这些组。是哪一组？`,
        `${buddy} ${trait} समूह देखता है। कौन सा?`,
        `${buddy} ${trait} ينظر إلى المجموعات. أي واحدة؟`,
      );
    case "neighbor":
      return say(
        `${host} counts. What number is next to ${board.n}?`,
        `${host} cuenta. ¿Qué número está junto a ${board.n}?`,
        `${host} conta. Que número fica perto de ${board.n}?`,
        `${host} compte. Quel nombre est à côté de ${board.n} ?`,
        `${host}在数。${board.n}旁边是哪个数？`,
        `${host} गिनता है। ${board.n} के पास कौन सी संख्या है?`,
        `${host} يعدّ. ما العدد بجانب ${board.n}؟`,
      );
    case "objects":
    case "to20":
    case "subitize":
    case "tenframe":
    case "build":
      return say(
        `${buddy} the ${trait} and ${host} count together.`,
        `${buddy}, ${trait}, y ${host} cuentan juntos.`,
        `${buddy}, ${trait}, e ${host} contam juntos.`,
        `${buddy}, ${trait}, et ${host} comptent ensemble.`,
        `${buddy}，${trait}，和${host}一起数。`,
        `${buddy} ${trait} और ${host} साथ गिनते हैं।`,
        `${buddy} ${trait} و${host} يعدّان معًا.`,
      );
    default: {
      const neverMode: never = board;
      return neverMode;
    }
  }
}

function placeStory(board: PlaceBoard, host: string): string {
  switch (board.mode) {
    case "blocks":
    case "build":
      return say(
        `${host} sets out base-ten blocks. What number is that?`,
        `${host} pone bloques de base diez. ¿Qué número es?`,
        `${host} põe o material dourado. Que número é?`,
        `${host} pose les blocs base dix. Quel nombre est-ce ?`,
        `${host}摆出数位积木。这是哪个数？`,
        `${host} स्थानीय मान के गुटके रखता है। वह कौन सी संख्या है?`,
        `${host} يضع مكعبات القيمة المنزلية. ما هذا العدد؟`,
      );
    case "expanded":
      return say(
        `${host} breaks the number apart.`,
        `${host} separa el número.`,
        `${host} separa o número.`,
        `${host} sépare le nombre.`,
        `${host}把这个数拆开。`,
        `${host} संख्या को तोड़ता है।`,
        `${host} يفكك العدد.`,
      );
    case "compare":
      return say(
        `${host} compares two numbers.`,
        `${host} compara dos números.`,
        `${host} compara dois números.`,
        `${host} compare deux nombres.`,
        `${host}比较两个数。`,
        `${host} दो संख्याओं की तुलना करता है।`,
        `${host} يقارن عددين.`,
      );
    case "round10":
    case "round100":
    case "roundBig":
      return say(
        `${host} rounds the number.`,
        `${host} redondea el número.`,
        `${host} arredonda o número.`,
        `${host} arrondit le nombre.`,
        `${host}把这个数四舍五入。`,
        `${host} संख्या को पूर्णांक बनाता है।`,
        `${host} يقرّب العدد.`,
      );
    case "big":
      return say(
        `${host} points to one digit.`,
        `${host} señala un dígito.`,
        `${host} aponta um algarismo.`,
        `${host} montre un chiffre.`,
        `${host}指着一位数字。`,
        `${host} एक अंक दिखाता है।`,
        `${host} يشير إلى رقم.`,
      );
    default: {
      const neverMode: never = board;
      return neverMode;
    }
  }
}

function shapeStory(board: ShapeBoard, host: string): string {
  switch (board.mode) {
    case "color":
      return say(
        `${host} holds up a color. Which one matches?`,
        `${host} muestra un color. ¿Cuál es igual?`,
        `${host} mostra uma cor. Qual é igual?`,
        `${host} montre une couleur. Laquelle est pareille ?`,
        `${host}举起一种颜色。哪个一样？`,
        `${host} एक रंग दिखाता है। कौन सा मेल खाता है?`,
        `${host} يرفع لونًا. أي واحد يطابقه؟`,
      );
    case "pattern":
      return say(
        `${host} made a pattern. What comes next?`,
        `${host} hizo un patrón. ¿Qué sigue?`,
        `${host} fez um padrão. O que vem depois?`,
        `${host} a fait un motif. Qu'est-ce qui vient ensuite ?`,
        `${host}排了一个规律。接下来是什么？`,
        `${host} ने एक पैटर्न बनाया। आगे क्या आएगा?`,
        `${host} صنع نمطًا. ماذا يأتي بعد ذلك؟`,
      );
    case "match":
      return say(
        `${host} wants the matching shape.`,
        `${host} busca la figura igual.`,
        `${host} quer a figura igual.`,
        `${host} cherche la même figure.`,
        `${host}要找一样的图形。`,
        `${host} वही आकृति चाहता है।`,
        `${host} يريد الشكل المطابق.`,
      );
    case "angles":
      return say(
        `${host} shows an angle.`,
        `${host} muestra un ángulo.`,
        `${host} mostra um ângulo.`,
        `${host} montre un angle.`,
        `${host}展示一个角。`,
        `${host} एक कोण दिखाता है।`,
        `${host} يُظهر زاوية.`,
      );
    case "position":
      return say(
        `Where did ${host} put the shape?`,
        `¿Dónde puso ${host} la figura?`,
        `Onde ${host} colocou a figura?`,
        `Où ${host} a posé la figure ?`,
        `${host}把图形放在哪里了？`,
        `${host} ने आकृति कहाँ रखी?`,
        `أين وضع ${host} الشكل؟`,
      );
    case "rows":
    case "cover":
      return say(
        `${host} covers a rectangle with squares.`,
        `${host} cubre un rectángulo con cuadrados.`,
        `${host} cobre um retângulo com quadrados.`,
        `${host} couvre un rectangle avec des carrés.`,
        `${host}用小方块铺一个长方形。`,
        `${host} वर्गों से एक आयत ढकता है।`,
        `${host} يغطي مستطيلًا بمربعات.`,
      );
    case "symmetry":
    case "fold":
      return say(
        `${host} looks for a matching half.`,
        `${host} busca la mitad igual.`,
        `${host} procura a metade igual.`,
        `${host} cherche la moitié pareille.`,
        `${host}在找对称的一半。`,
        `${host} मेल खाता आधा ढूँढता है।`,
        `${host} يبحث عن نصف مطابق.`,
      );
    case "parts":
    case "share":
      return say(
        `${host} shares a shape into equal parts.`,
        `${host} parte una figura en partes iguales.`,
        `${host} divide uma figura em partes iguais.`,
        `${host} partage une figure en parts égales.`,
        `${host}把一个图形分成一样大的份。`,
        `${host} एक आकृति को बराबर भागों में बाँटता है।`,
        `${host} يقسم شكلًا إلى أجزاء متساوية.`,
      );
    case "sort":
      return say(
        `${host} sorts flat shapes and solid shapes.`,
        `${host} clasifica figuras planas y cuerpos.`,
        `${host} separa figuras planas e sólidos.`,
        `${host} trie les figures plates et les solides.`,
        `${host}把平面图形和立体图形分开。`,
        `${host} सपाट और ठोस आकृतियाँ छाँटता है।`,
        `${host} يفرز الأشكال المسطحة والمجسمة.`,
      );
    case "flat":
    case "solid":
    case "sides":
    case "traits":
    case "compose":
    case "faces":
    case "quads":
      return say(
        `${host} holds up a shape. What shape is it?`,
        `${host} muestra una figura. ¿Qué figura es?`,
        `${host} mostra uma figura. Que figura é?`,
        `${host} montre une figure. Quelle figure est-ce ?`,
        `${host}举起一个图形。这是什么图形？`,
        `${host} एक आकृति दिखाता है। वह कौन सी आकृति है?`,
        `${host} يرفع شكلًا. ما هذا الشكل؟`,
      );
    default: {
      const neverMode: never = board;
      return neverMode;
    }
  }
}

function measureStory(board: MeasureBoard, buddy: string, host: string): string {
  switch (board.mode) {
    case "size":
      return say(
        `${host} compares two pictures. Which size?`,
        `${host} compara dos dibujos. ¿Cuál tamaño?`,
        `${host} compara dois desenhos. Qual tamanho?`,
        `${host} compare deux images. Quelle taille ?`,
        `${host}比较两张图。哪个更大或更小？`,
        `${host} दो चित्रों की तुलना करता है। कौन सा आकार?`,
        `${host} يقارن صورتين. أي حجم؟`,
      );
    case "compare":
      return say(
        `${host} lines them up. Which is longer or shorter?`,
        `${host} los pone en fila. ¿Cuál es más largo o más corto?`,
        `${host} coloca em fila. Qual é mais comprido ou mais curto?`,
        `${host} les aligne. Lequel est plus long ou plus court ?`,
        `${host}把它们排成一排。哪个更长或更短？`,
        `${host} उन्हें पंक्ति में रखता है। कौन लंबा या छोटा है?`,
        `${host} يصفّها. أيها أطول أو أقصر؟`,
      );
    case "ruler":
      return say(
        `${host} measures with ${buddy}. How long is it?`,
        `${host} mide con ${buddy}. ¿Qué tan largo es?`,
        `${host} mede com ${buddy}. Qual é o comprimento?`,
        `${host} mesure avec ${buddy}. Quelle est la longueur ?`,
        `${host}和${buddy}一起量。有多长？`,
        `${host} ${buddy} से नापता है। यह कितना लंबा है?`,
        `${host} يقيس مع ${buddy}. كم الطول؟`,
      );
    case "picture":
    case "bar":
    case "more":
      return say(
        `${host} reads the graph.`,
        `${host} lee la gráfica.`,
        `${host} lê o gráfico.`,
        `${host} lit le graphique.`,
        `${host}看统计图。`,
        `${host} आलेख पढ़ता है।`,
        `${host} يقرأ المخطط.`,
      );
    case "area":
    case "perimeter":
      return say(
        `${host} looks at the rectangle.`,
        `${host} mira el rectángulo.`,
        `${host} olha o retângulo.`,
        `${host} regarde le rectangle.`,
        `${host}看这个长方形。`,
        `${host} आयत देखता है।`,
        `${host} ينظر إلى المستطيل.`,
      );
    default: {
      const neverMode: never = board;
      return neverMode;
    }
  }
}

function phonicsStory(board: PhonicsBoard, buddy: string, host: string): string {
  switch (board.mode) {
    case "letters":
      return say(
        `${host} holds up a letter for ${buddy}.`,
        `${host} muestra una letra para ${buddy}.`,
        `${host} mostra uma letra para ${buddy}.`,
        `${host} montre une lettre à ${buddy}.`,
        `${host}给${buddy}举起一个字母。`,
        `${host} ${buddy} के लिए एक अक्षर दिखाता है।`,
        `${host} يرفع حرفًا لـ ${buddy}.`,
      );
    case "rhyme":
      return say(
        `${host} says a word that rhymes.`,
        `${host} dice una palabra que rima.`,
        `${host} diz uma palavra que rima.`,
        `${host} dit un mot qui rime.`,
        `${host}说一个押韵的词。`,
        `${host} एक तुकबंदी वाला शब्द कहता है।`,
        `${host} يقول كلمة لها قافية.`,
      );
    case "cvc":
      return say(
        `${host} blends a word for ${buddy}.`,
        `${host} une los sonidos para ${buddy}.`,
        `${host} junta os sons para ${buddy}.`,
        `${host} assemble un mot pour ${buddy}.`,
        `${host}给${buddy}把音拼成词。`,
        `${host} ${buddy} के लिए शब्द जोड़ता है।`,
        `${host} يدمج كلمة لـ ${buddy}.`,
      );
    case "sounds":
    case "begin":
    case "end":
      return say(
        `${host} says a sound for ${buddy}. What do you hear?`,
        `${host} dice un sonido para ${buddy}. ¿Qué escuchas?`,
        `${host} diz um som para ${buddy}. O que você ouve?`,
        `${host} dit un son pour ${buddy}. Qu'est-ce que tu entends ?`,
        `${host}给${buddy}读一个音。你听到了什么？`,
        `${host} ${buddy} की एक ध्वनि कहता है। तुम क्या सुनते हो?`,
        `${host} يقول صوتًا لـ ${buddy}. ماذا تسمع؟`,
      );
    default: {
      const neverMode: never = board;
      return neverMode;
    }
  }
}

function graphStory(board: GraphsBoard, buddy: string, host: string): string {
  switch (board.mode) {
    case "sort":
      return say(
        `${buddy} and ${host} sort the pictures.`,
        `${buddy} y ${host} ordenan los dibujos.`,
        `${buddy} e ${host} organizam os desenhos.`,
        `${buddy} et ${host} trient les images.`,
        `${buddy}和${host}把图片分类。`,
        `${buddy} और ${host} चित्र छाँटते हैं।`,
        `${buddy} و${host} يفرزان الصور.`,
      );
    case "tally":
    case "picture":
    case "bar":
    case "scale":
    case "line":
      return say(
        `${buddy} and ${host} read the graph.`,
        `${buddy} y ${host} leen la gráfica.`,
        `${buddy} e ${host} leem o gráfico.`,
        `${buddy} et ${host} lisent le graphique.`,
        `${buddy}和${host}看统计图。`,
        `${buddy} और ${host} आलेख पढ़ते हैं।`,
        `${buddy} و${host} يقرآن المخطط.`,
      );
    default: {
      const neverMode: never = board.mode;
      return neverMode;
    }
  }
}

function sceneStory(board: Board, buddy: string, host: string, trait: string): string {
  switch (board.game) {
    case "count":
      return countStory(board, buddy, host, trait);
    case "place":
      return placeStory(board, host);
    case "shapes":
      return shapeStory(board, host);
    case "fractions":
      return say(
        `${buddy} and ${host} share a shape. What fraction is that?`,
        `${buddy} y ${host} comparten una figura. ¿Qué fracción es?`,
        `${buddy} e ${host} dividem uma figura. Que fração é?`,
        `${buddy} et ${host} se partagent une figure. Quelle fraction est-ce ?`,
      `${buddy}和${host}在分一个图形。这是几分之几？`, `${buddy} और ${host} एक आकृति बाँटते हैं। वह कौन सा भिन्न है?`, `${buddy} و${host} يتقاسمان شكلًا. ما هذا الكسر؟`);
    case "measure":
      return measureStory(board, buddy, host);
    case "phonics":
      return phonicsStory(board, buddy, host);
    case "problems":
      return say(
        `${buddy} the ${trait} and ${host} solve a story.`,
        `${buddy}, ${trait}, y ${host} resuelven una historia.`,
        `${buddy}, ${trait}, e ${host} resolvem uma história.`,
        `${buddy}, ${trait}, et ${host} résolvent une histoire.`,
      `${buddy}，${trait}，和${host}一起解这道故事题。`, `${buddy} ${trait} और ${host} एक कहानी हल करते हैं।`, `${buddy} ${trait} و${host} يحلّان قصة.`);
    case "variables":
      return say(
        `${buddy} the ${trait} and ${host} find the missing number.`,
        `${buddy}, ${trait}, y ${host} buscan el número que falta.`,
        `${buddy}, ${trait}, e ${host} procuram o número que falta.`,
        `${buddy}, ${trait}, et ${host} cherchent le nombre qui manque.`,
      `${buddy}，${trait}，和${host}一起找缺少的数。`, `${buddy} ${trait} और ${host} छिपी संख्या ढूँढते हैं।`, `${buddy} ${trait} و${host} يجدان العدد الناقص.`);
    case "graphs":
      return graphStory(board, buddy, host);
    case "share":
      return say(
        `${buddy} and ${host} share the cookies.`,
        `${buddy} y ${host} reparten las galletas.`,
        `${buddy} e ${host} repartem os biscoitos.`,
        `${buddy} et ${host} partagent les biscuits.`,
        `${buddy}和${host}一起分饼干。`,
        `${buddy} और ${host} बिस्कुट बाँटते हैं।`,
        `${buddy} و${host} يتقاسمان البسكويت.`,
      );
    case "grid":
      return say(
        `${buddy} and ${host} count the squares.`,
        `${buddy} y ${host} cuentan los cuadrados.`,
        `${buddy} e ${host} contam os quadrados.`,
        `${buddy} et ${host} comptent les carrés.`,
        `${buddy}和${host}一起数方格。`,
        `${buddy} और ${host} वर्ग गिनते हैं।`,
        `${buddy} و${host} يعدّان المربعات.`,
      );
    case "patterns":
      return say(
        `${buddy} and ${host} find what comes next.`,
        `${buddy} y ${host} buscan qué sigue.`,
        `${buddy} e ${host} procuram o que vem depois.`,
        `${buddy} et ${host} cherchent ce qui vient ensuite.`,
        `${buddy}和${host}找下一个数。`,
        `${buddy} और ${host} आगे की संख्या ढूँढते हैं।`,
        `${buddy} و${host} يجدان العدد التالي.`,
      );
    case "signs":
      return say(
        `${buddy} and ${host} compare the numbers.`,
        `${buddy} y ${host} comparan los números.`,
        `${buddy} e ${host} comparam os números.`,
        `${buddy} et ${host} comparent les nombres.`,
        `${buddy}和${host}比较这两个数。`,
        `${buddy} और ${host} संख्याओं की तुलना करते हैं।`,
        `${buddy} و${host} يقارنان العددين.`,
      );
    case "jumps":
      return say(
        `${buddy} and ${host} jump ten more.`,
        `${buddy} y ${host} saltan 10 más.`,
        `${buddy} e ${host} pulam mais 10.`,
        `${buddy} et ${host} sautent 10 de plus.`,
        `${buddy}和${host}跳到多10。`,
        `${buddy} और ${host} 10 और आगे कूदते हैं।`,
        `${buddy} و${host} يقفزان 10 أكثر.`,
      );
    case "ticks":
      return say(
        `${buddy} and ${host} find the dot.`,
        `${buddy} y ${host} buscan el punto.`,
        `${buddy} e ${host} acham o ponto.`,
        `${buddy} et ${host} trouvent le point.`,
        `${buddy}和${host}找这个点。`,
        `${buddy} और ${host} बिंदु ढूँढते हैं।`,
        `${buddy} و${host} يجدان النقطة.`,
      );
    case "minute":
      return say(
        `${buddy} and ${host} read the clock.`,
        `${buddy} y ${host} leen el reloj.`,
        `${buddy} e ${host} leem o relógio.`,
        `${buddy} et ${host} lisent l'horloge.`,
        `${buddy}和${host}看钟。`,
        `${buddy} और ${host} घड़ी पढ़ते हैं।`,
        `${buddy} و${host} يقرآن الساعة.`,
      );
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

function handsStory(kind: Exclude<RoundSlot, { kind: "choice" }>["kind"], buddy: string, host: string): string {
  switch (kind) {
    case "clock":
      return say(
        `${host} sets the clock.`,
        `${host} pone el reloj.`,
        `${host} ajusta o relógio.`,
        `${host} règle l'horloge.`,
        `${host}拨钟。`,
        `${host} घड़ी सेट करता है।`,
        `${host} يضبط الساعة.`,
      );
    case "pay":
      return say(
        `${buddy} and ${host} pay with coins.`,
        `${buddy} y ${host} pagan con monedas.`,
        `${buddy} e ${host} pagam com moedas.`,
        `${buddy} et ${host} paient avec des pièces.`,
        `${buddy}和${host}用硬币付钱。`,
        `${buddy} और ${host} सिक्कों से देते हैं।`,
        `${buddy} و${host} يدفعان بالقطع.`,
      );
    case "array":
      return say(`${host} sets out rows. Build the array.`, `${host} pone filas. Arma el arreglo.`, `${host} põe as linhas. Monte o arranjo.`, `${host} pose les rangées. Construis le tableau.`, `${host}摆好了行。把阵列搭出来。`, `${host} पंक्तियाँ रखता है। सरणी बनाओ।`, `${host} يضع صفوفًا. كوّن المصفوفة.`);
    case "frame":
      return say(`${buddy} and ${host} move the counters.`, `${buddy} y ${host} mueven las fichas.`, `${buddy} e ${host} movem as fichas.`, `${buddy} et ${host} déplacent les jetons.`, `${buddy}和${host}移动小圆片。`, `${buddy} और ${host} गिनतारे हिलाते हैं।`, `${buddy} و${host} يحرّكان القطع.`);
    case "count":
      return say(`${buddy} and ${host} make a number.`, `${buddy} y ${host} forman un número.`, `${buddy} e ${host} formam um número.`, `${buddy} et ${host} forment un nombre.`, `${buddy}和${host}摆一个数。`, `${buddy} और ${host} एक संख्या बनाते हैं।`, `${buddy} و${host} يكوّنان عددًا.`);
    case "blocks":
      return say(
        `${host} sets out base-ten blocks. Build the number.`,
        `${host} pone bloques de base diez. Forma el número.`,
        `${host} põe o material dourado. Monte o número.`,
        `${host} pose les blocs base dix. Construis le nombre.`,
      `${host}摆出数位积木。把这个数搭出来。`, `${host} स्थानीय मान के गुटके रखता है। संख्या बनाओ।`, `${host} يضع مكعبات القيمة المنزلية. كوّن العدد.`);
    case "shade":
      return say(`${buddy} and ${host} shade a shape.`, `${buddy} y ${host} sombrean una figura.`, `${buddy} e ${host} pintam uma figura.`, `${buddy} et ${host} colorient une figure.`, `${buddy}和${host}给图形涂上颜色。`, `${buddy} और ${host} एक आकृति रंगते हैं।`, `${buddy} و${host} يظلّلان شكلًا.`);
    case "letters":
      return say(`${buddy} helps ${host} spell the word.`, `${buddy} ayuda a ${host} a deletrear la palabra.`, `${buddy} ajuda ${host} a soletrar a palavra.`, `${buddy} aide ${host} à épeler le mot.`, `${buddy}帮${host}拼这个词。`, `${buddy} ${host} को शब्द लिखने में मदद करता है।`, `${buddy} يساعد ${host} على تهجئة الكلمة.`);
    case "sight":
      return say(`${host} and ${buddy} read a word together.`, `${host} y ${buddy} leen una palabra juntos.`, `${host} e ${buddy} leem uma palavra juntos.`, `${host} et ${buddy} lisent un mot ensemble.`, `${host}和${buddy}一起读一个词。`, `${host} और ${buddy} साथ में एक शब्द पढ़ते हैं।`, `${host} و${buddy} يقرأان كلمة معًا.`);
    case "phonics":
      return say(
        `${host} says a sound for ${buddy}. Build what you hear.`,
        `${host} dice un sonido para ${buddy}. Arma lo que escuchas.`,
        `${host} diz um som para ${buddy}. Monte o que você ouve.`,
        `${host} dit un son pour ${buddy}. Construis ce que tu entends.`,
      `${host}给${buddy}读一个音。把你听到的拼出来。`, `${host} ${buddy} की एक ध्वनि कहता है। जो सुनो उसे बनाओ।`, `${host} يقول صوتًا لـ ${buddy}. كوّن ما تسمعه.`);
    case "measure":
      return say(`${host} measures with ${buddy}.`, `${host} mide con ${buddy}.`, `${host} mede com ${buddy}.`, `${host} mesure avec ${buddy}.`, `${host}和${buddy}一起量。`, `${host} ${buddy} से नापता है।`, `${host} يقيس مع ${buddy}.`);
    case "shapes":
      return say(`${host} sorts the shapes.`, `${host} ordena las figuras.`, `${host} organiza as figuras.`, `${host} trie les figures.`, `${host}给图形分类。`, `${host} आकृतियाँ छाँटता है।`, `${host} يفرز الأشكال.`);
    case "story":
      return say(`${buddy} and ${host} act out the story.`, `${buddy} y ${host} actúan la historia.`, `${buddy} e ${host} representam a história.`, `${buddy} et ${host} jouent l'histoire.`, `${buddy}和${host}把故事演出来。`, `${buddy} और ${host} कहानी करके दिखाते हैं।`, `${buddy} و${host} يمثلان القصة.`);
    case "blank":
      return say(`${buddy} and ${host} fill the box.`, `${buddy} y ${host} llenan la caja.`, `${buddy} e ${host} preenchem a caixa.`, `${buddy} et ${host} remplissent la case.`, `${buddy}和${host}把空格填上。`, `${buddy} और ${host} डिब्बा भरते हैं।`, `${buddy} و${host} يملآن الصندوق.`);
    case "trace":
      return say(`${buddy} and ${host} trace together.`, `${buddy} y ${host} trazan juntos.`, `${buddy} e ${host} traçam juntos.`, `${buddy} et ${host} tracent ensemble.`, `${buddy}和${host}一起描。`, `${buddy} और ${host} साथ ट्रेस करते हैं।`, `${buddy} و${host} يتتبعان معًا.`);
    case "graphs":
      return say(`${buddy} and ${host} build the graph.`, `${buddy} y ${host} arman la gráfica.`, `${buddy} e ${host} montam o gráfico.`, `${buddy} et ${host} construisent le graphique.`, `${buddy}和${host}把统计图做出来。`, `${buddy} और ${host} आलेख बनाते हैं।`, `${buddy} و${host} يصنعان المخطط.`);
    case "share":
      return say(`${buddy} and ${host} deal the cookies.`, `${buddy} y ${host} reparten las galletas.`, `${buddy} e ${host} repartem os biscoitos.`, `${buddy} et ${host} distribuent les biscuits.`, `${buddy}和${host}把饼干分好。`, `${buddy} और ${host} बिस्कुट बाँटते हैं।`, `${buddy} و${host} يوزّعان البسكويت.`);
    case "grid":
      return say(`${buddy} and ${host} walk the shape.`, `${buddy} y ${host} recorren la figura.`, `${buddy} e ${host} percorrem a figura.`, `${buddy} et ${host} font le tour de la figure.`, `${buddy}和${host}沿着图形走一圈。`, `${buddy} और ${host} आकृति के चारों ओर चलते हैं।`, `${buddy} و${host} يدوران حول الشكل.`);
    case "pattern":
      return say(`${buddy} and ${host} finish the pattern.`, `${buddy} y ${host} completan el patrón.`, `${buddy} e ${host} completam o padrão.`, `${buddy} et ${host} finissent la suite.`, `${buddy}和${host}把规律补完。`, `${buddy} और ${host} पैटर्न पूरा करते हैं।`, `${buddy} و${host} يكملان النمط.`);
    case "signs":
      return say(`${buddy} and ${host} place the sign.`, `${buddy} y ${host} ponen el signo.`, `${buddy} e ${host} colocam o sinal.`, `${buddy} et ${host} posent le signe.`, `${buddy}和${host}放上符号。`, `${buddy} और ${host} चिह्न रखते हैं।`, `${buddy} و${host} يضعان الإشارة.`);
    case "jumps":
      return say(`${buddy} and ${host} add one ten.`, `${buddy} y ${host} agregan una decena.`, `${buddy} e ${host} somam uma dezena.`, `${buddy} et ${host} ajoutent une dizaine.`, `${buddy}和${host}加上一个十。`, `${buddy} और ${host} एक दहाई जोड़ते हैं।`, `${buddy} و${host} يضيفان عشرة.`);
    case "ticks":
      return say(
        `${buddy} and ${host} move the dot.`,
        `${buddy} y ${host} mueven el punto.`,
        `${buddy} e ${host} movem o ponto.`,
        `${buddy} et ${host} déplacent le point.`,
        `${buddy}和${host}移动这个点。`,
        `${buddy} और ${host} बिंदु हिलाते हैं।`,
        `${buddy} و${host} يحرّكان النقطة.`,
      );
    default: {
      const neverKind: never = kind;
      return neverKind;
    }
  }
}

export function slotStory(slot: RoundSlot, buddyId: string, hostId: string): string {
  const buddy = nameOf(buddyId, "Peach");
  const host = nameOf(hostId, "Panda");
  switch (slot.kind) {
    case "choice":
      return storyLine(slot.question.visual, buddyId, hostId);
    default:
      return handsStory(slot.kind, buddy, host);
  }
}
