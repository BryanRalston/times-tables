import { squisheeById } from "@/lib/squishees";
import type { Board } from "../games/boards";
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

function say(en: string, es: string, pt: string, fr?: string, zh?: string, hi?: string): string {
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
  if (visual.op === "+") {
    if (visual.result == null) {
      return say(
        `${buddy} the ${trait} has ${pals(visual.pink)}. ${host} brings ${pals(visual.teal)}. How many in all?`,
        `${buddy}, ${trait}, tiene ${pals(visual.pink)}. ${host} trae ${pals(visual.teal)}. ¿Cuántos hay en total?`,
        `${buddy}, ${trait}, tem ${pals(visual.pink)}. ${host} traz ${pals(visual.teal)}. Quantos tem ao todo?`,
        `${buddy}, ${trait}, a ${pals(visual.pink)}. ${host} apporte ${pals(visual.teal)}. Combien en tout ?`,
      `${buddy}，${trait}，有${pals(visual.pink)}。${host}拿来${pals(visual.teal)}。一共有几个？`, `${buddy} ${trait} के पास ${pals(visual.pink)} हैं। ${host} ${pals(visual.teal)} लाता है। कुल कितने हैं?`);
    }
    if (visual.right == null) {
      return say(
        `${buddy} the ${trait} has ${pals(visual.pink)}. Together they have ${pals(total)}. How many did ${host} bring?`,
        `${buddy}, ${trait}, tiene ${pals(visual.pink)}. Juntos tienen ${pals(total)}. ¿Cuántos trajo ${host}?`,
        `${buddy}, ${trait}, tem ${pals(visual.pink)}. Juntos eles têm ${pals(total)}. Quantos ${host} trouxe?`,
        `${buddy}, ${trait}, a ${pals(visual.pink)}. Ensemble, ils en ont ${pals(total)}. Combien ${host} a apporté ?`,
      `${buddy}，${trait}，有${pals(visual.pink)}。他们一共有${pals(total)}。${host}拿来了几个？`, `${buddy} ${trait} के पास ${pals(visual.pink)} हैं। दोनों के पास मिलकर ${pals(total)} हैं। ${host} कितने लाया?`);
    }
    return say(
      `${host} brings ${pals(visual.teal)}. Together they have ${pals(total)}. How many did ${buddy} start with?`,
      `${host} trae ${pals(visual.teal)}. Juntos tienen ${pals(total)}. ¿Con cuántos empezó ${buddy}?`,
      `${host} traz ${pals(visual.teal)}. Juntos eles têm ${pals(total)}. Com quantos ${buddy} começou?`,
      `${host} apporte ${pals(visual.teal)}. Ensemble, ils en ont ${pals(total)}. Avec combien ${buddy} a commencé ?`,
    `${host}拿来${pals(visual.teal)}。他们一共有${pals(total)}。${buddy}一开始有几个？`, `${host} ${pals(visual.teal)} लाता है। दोनों के पास मिलकर ${pals(total)} हैं। ${buddy} के पास शुरू में कितने थे?`);
  }
  if (visual.result == null) {
    return say(
      `${buddy} the ${trait} has ${pals(total)} and shares ${pals(visual.teal)} with ${host}. How many are left?`,
      `${buddy}, ${trait}, tiene ${pals(total)} y comparte ${pals(visual.teal)} con ${host}. ¿Cuántos quedan?`,
      `${buddy}, ${trait}, tem ${pals(total)} e reparte ${pals(visual.teal)} com ${host}. Quantos sobram?`,
      `${buddy}, ${trait}, a ${pals(total)} et en partage ${pals(visual.teal)} avec ${host}. Combien en reste-t-il ?`,
    `${buddy}，${trait}，有${pals(total)}，分给${host} ${pals(visual.teal)}。还剩几个？`, `${buddy} ${trait} के पास ${pals(total)} हैं और ${pals(visual.teal)} को ${host} के साथ बाँटता है। कितने बचे?`);
  }
  if (visual.right == null) {
    return say(
      `${buddy} the ${trait} has ${pals(total)} and has ${pals(visual.pink)} left. How many did ${buddy} share with ${host}?`,
      `${buddy}, ${trait}, tiene ${pals(total)} y le quedan ${pals(visual.pink)}. ¿Cuántos compartió con ${host}?`,
      `${buddy}, ${trait}, tem ${pals(total)} e sobram ${pals(visual.pink)}. Quantos ${buddy} repartiu com ${host}?`,
      `${buddy}, ${trait}, a ${pals(total)} et il en reste ${pals(visual.pink)}. Combien ${buddy} a partagé avec ${host} ?`,
    `${buddy}，${trait}，有${pals(total)}，还剩${pals(visual.pink)}。${buddy}分给${host}几个？`, `${buddy} ${trait} के पास ${pals(total)} हैं और ${pals(visual.pink)} बचे हैं। ${buddy} ने ${host} के साथ कितने बाँटे?`);
  }
  return say(
    `${buddy} the ${trait} shares ${pals(visual.teal)} with ${host} and has ${pals(visual.pink)} left. How many did ${buddy} start with?`,
    `${buddy}, ${trait}, comparte ${pals(visual.teal)} con ${host} y le quedan ${pals(visual.pink)}. ¿Con cuántos empezó?`,
    `${buddy}, ${trait}, reparte ${pals(visual.teal)} com ${host} e sobram ${pals(visual.pink)}. Com quantos começou?`,
    `${buddy}, ${trait}, partage ${pals(visual.teal)} avec ${host} et il en reste ${pals(visual.pink)}. Avec combien a-t-il commencé ?`,
  `${buddy}，${trait}，分给${host} ${pals(visual.teal)}，还剩${pals(visual.pink)}。${buddy}一开始有几个？`, `${buddy} ${trait} ${pals(visual.teal)} को ${host} के साथ बाँटता है और ${pals(visual.pink)} बचे हैं। ${buddy} के पास शुरू में कितने थे?`);
}

export function storyLine(visual: Visual, buddyId: string, hostId: string): string {
  const buddy = nameOf(buddyId, "Peach");
  const host = nameOf(hostId, "Panda");
  const trait = personaOf(buddyId).trait;
  switch (visual.kind) {
    case "times":
      if (visual.ask === "factor") {
        return say(`${host} looks for a factor of ${visual.a}.`, `${host} busca un factor de ${visual.a}.`, `${host} procura um fator de ${visual.a}.`, `${host} cherche un facteur de ${visual.a}.`, `${host}在找${visual.a}的因数。`, `${host} ${visual.a} का गुणनखंड ढूँढता है।`);
      }
      if (visual.ask === "multiple") {
        return say(`${host} skip counts by ${visual.a}.`, `${host} cuenta de ${visual.a} en ${visual.a}.`, `${host} conta de ${visual.a} em ${visual.a}.`, `${host} compte de ${visual.a} en ${visual.a}.`, `${host}按${visual.a}个一数。`, `${host} ${visual.a} की गिनती छोड़कर गिनता है।`);
      }
      if (visual.ask === "divide") {
        return say(
          `${host} shares ${visual.a} into groups of ${visual.b}.`,
          `${host} reparte ${visual.a} en grupos de ${visual.b}.`,
          `${host} reparte ${visual.a} em grupos de ${visual.b}.`,
          `${host} partage ${visual.a} en groupes de ${visual.b}.`,
        `${host}把${visual.a}分成每组${visual.b}个。`, `${host} ${visual.a} को ${visual.b} के समूहों में बाँटता है।`);
      }
      return say(
        `${host} sets out ${visual.a} groups of ${pals(visual.b)}. How many?`,
        `${host} pone ${visual.a} grupos de ${pals(visual.b)}. ¿Cuántos hay?`,
        `${host} põe ${visual.a} grupos de ${pals(visual.b)}. Quantos tem?`,
        `${host} pose ${visual.a} groupes de ${pals(visual.b)}. Combien ?`,
      `${host}摆了${visual.a}组，每组${pals(visual.b)}。一共有几个？`, `${host} ${pals(visual.b)} के ${visual.a} समूह रखता है। कितने हैं?`);
    case "add":
      return addStory(visual, buddy, host, trait);
    case "time":
      return say(`${host} checks the clock. What time is it?`, `${host} mira el reloj. ¿Qué hora es?`, `${host} olha o relógio. Que horas são?`, `${host} regarde l'horloge. Quelle heure est-il ?`, `${host}看了看钟。现在几点？`, `${host} घड़ी देखता है। क्या समय हुआ है?`);
    case "money":
      if (visual.mode === "name") {
        return say(`${host} holds up a coin. What coin is it?`, `${host} muestra una moneda. ¿Qué moneda es?`, `${host} mostra uma moeda. Que moeda é?`, `${host} montre une pièce. Quelle pièce est-ce ?`, `${host}举起一枚硬币。这是哪种硬币？`, `${host} एक सिक्का दिखाता है। यह कौन सा सिक्का है?`);
      }
      if (visual.mode === "change") {
        return say(`${buddy} pays ${host}. How much change is left?`, `${buddy} le paga a ${host}. ¿Cuánto cambio queda?`, `${buddy} paga ${host}. Quanto de troco sobra?`, `${buddy} paie ${host}. Combien de monnaie reste-t-il ?`, `${buddy}付给${host}。要找回多少钱？`, `${buddy} ${host} देता है। कितने पैसे बचे?`);
      }
      if (visual.mode === "make") {
        return say(
          `${buddy} and ${host} make the amount with coins.`,
          `${buddy} y ${host} forman la cantidad con monedas.`,
          `${buddy} e ${host} montam o valor com moedas.`,
          `${buddy} et ${host} forment la somme avec des pièces.`,
        `${buddy}和${host}用硬币凑出这个钱数。`, `${buddy} और ${host} सिक्कों से राशि बनाते हैं।`);
      }
      return say(
        `${buddy} and ${host} share the coins. How much do they have?`,
        `${buddy} y ${host} comparten las monedas. ¿Cuánto tienen?`,
        `${buddy} e ${host} compartilham as moedas. Quanto eles têm?`,
        `${buddy} et ${host} se partagent les pièces. Combien ont-ils ?`,
      `${buddy}和${host}一起数这些硬币。一共多少钱？`, `${buddy} और ${host} सिक्के बाँटते हैं। उनके पास कितने हैं?`);
    case "sight":
      return say(
        `${host} and ${buddy} read a word together. What does it say?`,
        `${host} y ${buddy} leen una palabra juntos. ¿Qué dice?`,
        `${host} e ${buddy} leem uma palavra juntos. O que está escrito?`,
        `${host} et ${buddy} lisent un mot ensemble. Qu'est-ce qui est écrit ?`,
      `${host}和${buddy}一起读一个词。上面写的是什么？`, `${host} और ${buddy} साथ में एक शब्द पढ़ते हैं। वह क्या कहता है?`);
    case "spell":
      return say(`${buddy} helps ${host} spell the word.`, `${buddy} ayuda a ${host} a deletrear la palabra.`, `${buddy} ajuda ${host} a soletrar a palavra.`, `${buddy} aide ${host} à épeler le mot.`, `${buddy}帮${host}拼这个词。`, `${buddy} ${host} को शब्द लिखने में मदद करता है।`);
    case "scene":
      return sceneStory(visual.board, buddy, host, trait);
    default: {
      const neverVisual: never = visual;
      return neverVisual;
    }
  }
}

function sceneStory(board: Board, buddy: string, host: string, trait: string): string {
  switch (board.game) {
    case "count":
      return say(`${buddy} the ${trait} and ${host} count together.`, `${buddy}, ${trait}, y ${host} cuentan juntos.`, `${buddy}, ${trait}, e ${host} contam juntos.`, `${buddy}, ${trait}, et ${host} comptent ensemble.`, `${buddy}，${trait}，和${host}一起数。`, `${buddy} ${trait} और ${host} साथ गिनते हैं।`);
    case "place":
      return say(
        `${host} sets out base-ten blocks. What number is that?`,
        `${host} pone bloques de base diez. ¿Qué número es?`,
        `${host} põe o material dourado. Que número é?`,
        `${host} pose les blocs base dix. Quel nombre est-ce ?`,
      `${host}摆出数位积木。这是哪个数？`, `${host} स्थानीय मान के गुटके रखता है। वह कौन सी संख्या है?`);
    case "shapes":
      return say(`${host} holds up a shape. What shape is it?`, `${host} muestra una figura. ¿Qué figura es?`, `${host} mostra uma figura. Que figura é?`, `${host} montre une figure. Quelle figure est-ce ?`, `${host}举起一个图形。这是什么图形？`, `${host} एक आकृति दिखाता है। वह कौन सी आकृति है?`);
    case "fractions":
      return say(
        `${buddy} and ${host} share a shape. What fraction is that?`,
        `${buddy} y ${host} comparten una figura. ¿Qué fracción es?`,
        `${buddy} e ${host} dividem uma figura. Que fração é?`,
        `${buddy} et ${host} se partagent une figure. Quelle fraction est-ce ?`,
      `${buddy}和${host}在分一个图形。这是几分之几？`, `${buddy} और ${host} एक आकृति बाँटते हैं। वह कौन सा भिन्न है?`);
    case "measure":
      return say(`${host} measures with ${buddy}. How long is it?`, `${host} mide con ${buddy}. ¿Qué tan largo es?`, `${host} mede com ${buddy}. Qual é o comprimento?`, `${host} mesure avec ${buddy}. Quelle est la longueur ?`, `${host}和${buddy}一起量。有多长？`, `${host} ${buddy} से नापता है। यह कितना लंबा है?`);
    case "phonics":
      return say(
        `${host} says a sound for ${buddy}. What do you hear?`,
        `${host} dice un sonido para ${buddy}. ¿Qué escuchas?`,
        `${host} diz um som para ${buddy}. O que você ouve?`,
        `${host} dit un son pour ${buddy}. Qu'est-ce que tu entends ?`,
      `${host}给${buddy}读一个音。你听到了什么？`, `${host} ${buddy} की एक ध्वनि कहता है। तुम क्या सुनते हो?`);
    case "problems":
      return say(
        `${buddy} the ${trait} and ${host} solve a story.`,
        `${buddy}, ${trait}, y ${host} resuelven una historia.`,
        `${buddy}, ${trait}, e ${host} resolvem uma história.`,
        `${buddy}, ${trait}, et ${host} résolvent une histoire.`,
      `${buddy}，${trait}，和${host}一起解这道故事题。`, `${buddy} ${trait} और ${host} एक कहानी हल करते हैं।`);
    case "variables":
      return say(
        `${buddy} the ${trait} and ${host} find the missing number.`,
        `${buddy}, ${trait}, y ${host} buscan el número que falta.`,
        `${buddy}, ${trait}, e ${host} procuram o número que falta.`,
        `${buddy}, ${trait}, et ${host} cherchent le nombre qui manque.`,
      `${buddy}，${trait}，和${host}一起找缺少的数。`, `${buddy} ${trait} और ${host} छिपी संख्या ढूँढते हैं।`);
    case "graphs":
      return say(
        `${buddy} and ${host} sort the pictures and read the graph.`,
        `${buddy} y ${host} ordenan los dibujos y leen la gráfica.`,
        `${buddy} e ${host} organizam os desenhos e leem o gráfico.`,
        `${buddy} et ${host} trient les images et lisent le graphique.`,
      `${buddy}和${host}把图片分类，再看统计图。`, `${buddy} और ${host} चित्र छाँटते हैं और आलेख पढ़ते हैं।`);
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

function handsStory(kind: Exclude<RoundSlot, { kind: "choice" }>["kind"], buddy: string, host: string): string {
  switch (kind) {
    case "clock":
      return say(`${host} checks the clock. What time is it?`, `${host} mira el reloj. ¿Qué hora es?`, `${host} olha o relógio. Que horas são?`, `${host} regarde l'horloge. Quelle heure est-il ?`, `${host}看了看钟。现在几点？`, `${host} घड़ी देखता है। क्या समय हुआ है?`);
    case "pay":
      return say(
        `${buddy} and ${host} share the coins. How much do they have?`,
        `${buddy} y ${host} comparten las monedas. ¿Cuánto tienen?`,
        `${buddy} e ${host} compartilham as moedas. Quanto eles têm?`,
        `${buddy} et ${host} se partagent les pièces. Combien ont-ils ?`,
      `${buddy}和${host}一起数这些硬币。一共多少钱？`, `${buddy} और ${host} सिक्के बाँटते हैं। उनके पास कितने हैं?`);
    case "array":
      return say(`${host} sets out rows. Build the array.`, `${host} pone filas. Arma el arreglo.`, `${host} põe as linhas. Monte o arranjo.`, `${host} pose les rangées. Construis le tableau.`, `${host}摆好了行。把阵列搭出来。`, `${host} पंक्तियाँ रखता है। सरणी बनाओ।`);
    case "frame":
      return say(`${buddy} and ${host} move the counters.`, `${buddy} y ${host} mueven las fichas.`, `${buddy} e ${host} movem as fichas.`, `${buddy} et ${host} déplacent les jetons.`, `${buddy}和${host}移动小圆片。`, `${buddy} और ${host} गिनतारे हिलाते हैं।`);
    case "count":
      return say(`${buddy} and ${host} make a number.`, `${buddy} y ${host} forman un número.`, `${buddy} e ${host} formam um número.`, `${buddy} et ${host} forment un nombre.`, `${buddy}和${host}摆一个数。`, `${buddy} और ${host} एक संख्या बनाते हैं।`);
    case "blocks":
      return say(
        `${host} sets out base-ten blocks. Build the number.`,
        `${host} pone bloques de base diez. Forma el número.`,
        `${host} põe o material dourado. Monte o número.`,
        `${host} pose les blocs base dix. Construis le nombre.`,
      `${host}摆出数位积木。把这个数搭出来。`, `${host} स्थानीय मान के गुटके रखता है। संख्या बनाओ।`);
    case "shade":
      return say(`${buddy} and ${host} shade a shape.`, `${buddy} y ${host} sombrean una figura.`, `${buddy} e ${host} pintam uma figura.`, `${buddy} et ${host} colorient une figure.`, `${buddy}和${host}给图形涂上颜色。`, `${buddy} और ${host} एक आकृति रंगते हैं।`);
    case "letters":
      return say(`${buddy} helps ${host} spell the word.`, `${buddy} ayuda a ${host} a deletrear la palabra.`, `${buddy} ajuda ${host} a soletrar a palavra.`, `${buddy} aide ${host} à épeler le mot.`, `${buddy}帮${host}拼这个词。`, `${buddy} ${host} को शब्द लिखने में मदद करता है।`);
    case "sight":
      return say(`${host} and ${buddy} read a word together.`, `${host} y ${buddy} leen una palabra juntos.`, `${host} e ${buddy} leem uma palavra juntos.`, `${host} et ${buddy} lisent un mot ensemble.`, `${host}和${buddy}一起读一个词。`, `${host} और ${buddy} साथ में एक शब्द पढ़ते हैं।`);
    case "phonics":
      return say(
        `${host} says a sound for ${buddy}. Build what you hear.`,
        `${host} dice un sonido para ${buddy}. Arma lo que escuchas.`,
        `${host} diz um som para ${buddy}. Monte o que você ouve.`,
        `${host} dit un son pour ${buddy}. Construis ce que tu entends.`,
      `${host}给${buddy}读一个音。把你听到的拼出来。`, `${host} ${buddy} की एक ध्वनि कहता है। जो सुनो उसे बनाओ।`);
    case "measure":
      return say(`${host} measures with ${buddy}.`, `${host} mide con ${buddy}.`, `${host} mede com ${buddy}.`, `${host} mesure avec ${buddy}.`, `${host}和${buddy}一起量。`, `${host} ${buddy} से नापता है।`);
    case "shapes":
      return say(`${host} sorts the shapes.`, `${host} ordena las figuras.`, `${host} organiza as figuras.`, `${host} trie les figures.`, `${host}给图形分类。`, `${host} आकृतियाँ छाँटता है।`);
    case "story":
      return say(`${buddy} and ${host} act out the story.`, `${buddy} y ${host} actúan la historia.`, `${buddy} e ${host} representam a história.`, `${buddy} et ${host} jouent l'histoire.`, `${buddy}和${host}把故事演出来。`, `${buddy} और ${host} कहानी करके दिखाते हैं।`);
    case "blank":
      return say(`${buddy} and ${host} fill the box.`, `${buddy} y ${host} llenan la caja.`, `${buddy} e ${host} preenchem a caixa.`, `${buddy} et ${host} remplissent la case.`, `${buddy}和${host}把空格填上。`, `${buddy} और ${host} डिब्बा भरते हैं।`);
    case "trace":
      return say(`${buddy} and ${host} trace together.`, `${buddy} y ${host} trazan juntos.`, `${buddy} e ${host} traçam juntos.`, `${buddy} et ${host} tracent ensemble.`, `${buddy}和${host}一起描。`, `${buddy} और ${host} साथ ट्रेस करते हैं।`);
    case "graphs":
      return say(`${buddy} and ${host} build the graph.`, `${buddy} y ${host} arman la gráfica.`, `${buddy} e ${host} montam o gráfico.`, `${buddy} et ${host} construisent le graphique.`, `${buddy}和${host}把统计图做出来。`, `${buddy} और ${host} आलेख बनाते हैं।`);
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
