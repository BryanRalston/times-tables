import { squisheeById } from "@/lib/squishees";
import type { Board } from "../games/boards";
import type { Visual } from "../games/types";
import { getLocale, thingName } from "../i18n";
import type { RoundSlot } from "../round-flow";
import { personaOf } from "./persona";

function nameOf(id: string, fallback: string): string {
  return squisheeById(id)?.name ?? fallback;
}

function pals(n: number): string {
  const word = n === 1 ? "squishee" : "squishees";
  return `${n} ${thingName("squishees", n, word)}`;
}

/** Name only the numbers the equation shows. A hidden addend stays hidden. */
function addStory(visual: Extract<Visual, { kind: "add" }>, buddy: string, host: string, trait: string, es: boolean): string {
  const total = visual.pink + visual.teal;
  if (visual.op === "+") {
    if (visual.result == null) {
      return es
        ? `${buddy}, ${trait}, tiene ${pals(visual.pink)}. ${host} trae ${pals(visual.teal)}. ¿Cuántos hay en total?`
        : `${buddy} the ${trait} has ${pals(visual.pink)}. ${host} brings ${pals(visual.teal)}. How many in all?`;
    }
    if (visual.right == null) {
      return es
        ? `${buddy}, ${trait}, tiene ${pals(visual.pink)}. Juntos tienen ${pals(total)}. ¿Cuántos trajo ${host}?`
        : `${buddy} the ${trait} has ${pals(visual.pink)}. Together they have ${pals(total)}. How many did ${host} bring?`;
    }
    return es
      ? `${host} trae ${pals(visual.teal)}. Juntos tienen ${pals(total)}. ¿Con cuántos empezó ${buddy}?`
      : `${host} brings ${pals(visual.teal)}. Together they have ${pals(total)}. How many did ${buddy} start with?`;
  }
  if (visual.result == null) {
    return es
      ? `${buddy}, ${trait}, tiene ${pals(total)} y comparte ${pals(visual.teal)} con ${host}. ¿Cuántos quedan?`
      : `${buddy} the ${trait} has ${pals(total)} and shares ${pals(visual.teal)} with ${host}. How many are left?`;
  }
  if (visual.right == null) {
    return es
      ? `${buddy}, ${trait}, tiene ${pals(total)} y le quedan ${pals(visual.pink)}. ¿Cuántos compartió con ${host}?`
      : `${buddy} the ${trait} has ${pals(total)} and has ${pals(visual.pink)} left. How many did ${buddy} share with ${host}?`;
  }
  return es
    ? `${buddy}, ${trait}, comparte ${pals(visual.teal)} con ${host} y le quedan ${pals(visual.pink)}. ¿Con cuántos empezó?`
    : `${buddy} the ${trait} shares ${pals(visual.teal)} with ${host} and has ${pals(visual.pink)} left. How many did ${buddy} start with?`;
}

export function storyLine(visual: Visual, buddyId: string, hostId: string): string {
  const buddy = nameOf(buddyId, "Peach");
  const host = nameOf(hostId, "Panda");
  const es = getLocale() === "es";
  const trait = personaOf(buddyId).trait;
  switch (visual.kind) {
    case "times":
      if (visual.ask === "factor") {
        return es ? `${host} busca un factor de ${visual.a}.` : `${host} looks for a factor of ${visual.a}.`;
      }
      if (visual.ask === "multiple") {
        return es ? `${host} cuenta de ${visual.a} en ${visual.a}.` : `${host} skip counts by ${visual.a}.`;
      }
      if (visual.ask === "divide") {
        return es ? `${host} reparte ${visual.a} en grupos de ${visual.b}.` : `${host} shares ${visual.a} into groups of ${visual.b}.`;
      }
      return es
        ? `${host} pone ${visual.a} grupos de ${pals(visual.b)}. ¿Cuántos hay?`
        : `${host} sets out ${visual.a} groups of ${pals(visual.b)}. How many?`;
    case "add":
      return addStory(visual, buddy, host, trait, es);
    case "time":
      return es ? `${host} mira el reloj. ¿Qué hora es?` : `${host} checks the clock. What time is it?`;
    case "money":
      if (visual.mode === "name") return es ? `${host} muestra una moneda. ¿Qué moneda es?` : `${host} holds up a coin. What coin is it?`;
      if (visual.mode === "change") return es ? `${buddy} le paga a ${host}. ¿Cuánto cambio queda?` : `${buddy} pays ${host}. How much change is left?`;
      if (visual.mode === "make") return es ? `${buddy} y ${host} forman la cantidad con monedas.` : `${buddy} and ${host} make the amount with coins.`;
      return es ? `${buddy} y ${host} comparten las monedas. ¿Cuánto tienen?` : `${buddy} and ${host} share the coins. How much do they have?`;
    case "sight":
      return es ? `${host} y ${buddy} leen una palabra juntos. ¿Qué dice?` : `${host} and ${buddy} read a word together. What does it say?`;
    case "spell":
      return es ? `${buddy} ayuda a ${host} a deletrear la palabra.` : `${buddy} helps ${host} spell the word.`;
    case "scene":
      return sceneStory(visual.board, buddy, host, trait);
    default: {
      const neverVisual: never = visual;
      return neverVisual;
    }
  }
}

function sceneStory(board: Board, buddy: string, host: string, trait: string): string {
  const es = getLocale() === "es";
  switch (board.game) {
    case "count":
      return es ? `${buddy}, ${trait}, y ${host} cuentan juntos.` : `${buddy} the ${trait} and ${host} count together.`;
    case "place":
      return es ? `${host} pone bloques de base diez. ¿Qué número es?` : `${host} sets out base-ten blocks. What number is that?`;
    case "shapes":
      return es ? `${host} muestra una figura. ¿Qué figura es?` : `${host} holds up a shape. What shape is it?`;
    case "fractions":
      return es ? `${buddy} y ${host} comparten una figura. ¿Qué fracción es?` : `${buddy} and ${host} share a shape. What fraction is that?`;
    case "measure":
      return es ? `${host} mide con ${buddy}. ¿Qué tan largo es?` : `${host} measures with ${buddy}. How long is it?`;
    case "phonics":
      return es ? `${host} dice un sonido para ${buddy}. ¿Qué escuchas?` : `${host} says a sound for ${buddy}. What do you hear?`;
    case "problems":
      return es ? `${buddy}, ${trait}, y ${host} resuelven una historia.` : `${buddy} the ${trait} and ${host} solve a story.`;
    case "variables":
      return es ? `${buddy}, ${trait}, y ${host} buscan el número que falta.` : `${buddy} the ${trait} and ${host} find the missing number.`;
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

function handsStory(kind: Exclude<RoundSlot, { kind: "choice" }>["kind"], buddy: string, host: string): string {
  const es = getLocale() === "es";
  switch (kind) {
    case "clock":
      return es ? `${host} mira el reloj. ¿Qué hora es?` : `${host} checks the clock. What time is it?`;
    case "pay":
      return es ? `${buddy} y ${host} comparten las monedas. ¿Cuánto tienen?` : `${buddy} and ${host} share the coins. How much do they have?`;
    case "array":
      return es ? `${host} pone filas. Arma el arreglo.` : `${host} sets out rows. Build the array.`;
    case "frame":
      return es ? `${buddy} y ${host} mueven las fichas.` : `${buddy} and ${host} move the counters.`;
    case "count":
      return es ? `${buddy} y ${host} forman un número.` : `${buddy} and ${host} make a number.`;
    case "blocks":
      return es ? `${host} pone bloques de base diez. Forma el número.` : `${host} sets out base-ten blocks. Build the number.`;
    case "shade":
      return es ? `${buddy} y ${host} sombrean una figura.` : `${buddy} and ${host} shade a shape.`;
    case "letters":
      return es ? `${buddy} ayuda a ${host} a deletrear la palabra.` : `${buddy} helps ${host} spell the word.`;
    case "sight":
      return es ? `${host} y ${buddy} leen una palabra juntos.` : `${host} and ${buddy} read a word together.`;
    case "phonics":
      return es ? `${host} dice un sonido para ${buddy}. Arma lo que escuchas.` : `${host} says a sound for ${buddy}. Build what you hear.`;
    case "measure":
      return es ? `${host} mide con ${buddy}.` : `${host} measures with ${buddy}.`;
    case "shapes":
      return es ? `${host} ordena las figuras.` : `${host} sorts the shapes.`;
    case "story":
      return es ? `${buddy} y ${host} actúan la historia.` : `${buddy} and ${host} act out the story.`;
    case "blank":
      return es ? `${buddy} y ${host} llenan la caja.` : `${buddy} and ${host} fill the box.`;
    case "trace":
      return es ? `${buddy} y ${host} trazan juntos.` : `${buddy} and ${host} trace together.`;
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
