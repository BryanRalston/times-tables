/// <reference types="vite/client" />

interface G3QaQuestion {
  answer: string;
  needsInteract: boolean;
  kind: string;
  input: string;
  choices: string[] | null;
  prompt: string;
  interacted: boolean;
  checkDisabled: boolean;
}

interface Window {
  __G3_Q?: G3QaQuestion | null;
}
