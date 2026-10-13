import { squisheeById } from "@/lib/squishees";
import type { Board } from "../games/boards";
import type { Visual } from "../games/types";
import { getLocale } from "../i18n";
import type { RoundSlot } from "../round-flow";
import { personaOf } from "./persona";

function nameOf(id: string, fallback: string): string {
  return squisheeById(id)?.name ?? fallback;
}

export function storyLine(visual: Visual, buddyId: string, hostId: string): string {
  const buddy = nameOf(buddyId, "Peach");
  const host = nameOf(hostId, "Panda");
  const es = getLocale() === "es";
  const trait = personaOf(buddyId).trait;
  switch (visual.kind) {
    case "times":
      return es
        ? `${host} pone ${visual.a} grupos de ${visual.b} squishees. ¿Cuántos hay?`
        : `${host} sets out ${visual.a} groups of ${visual.b} squishees. How many?`;
    case "add":
      if (visual.op === "+") {
        return es
          ? `${buddy}, ${trait}, tiene ${visual.pink} squishees. ${host} trae ${visual.teal} más. ¿Cuántos hay en total?`
          : `${buddy} the ${trait} has ${visual.pink} squishees. ${host} brings ${visual.teal} more. How many in all?`;
      }
      return es
        ? `${buddy}, ${trait}, tiene ${visual.pink + visual.teal} squishees y comparte ${visual.teal} con ${host}. ¿Cuántos quedan?`
        : `${buddy} the ${trait} has ${visual.pink + visual.teal} squishees and shares ${visual.teal} with ${host}. How many are left?`;
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
