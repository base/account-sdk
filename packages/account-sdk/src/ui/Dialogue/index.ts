import { injectFontStyle } from ':ui/assets/injectFontStyle.js';
import { Dialogue } from './Dialogue.js';

let dialogue: Dialogue | null = null;

export function initDialogue() {
  if (!dialogue) {
    const root = document.createElement('div');
    root.className = '-cbwsdk-css-reset';
    document.body.appendChild(root);
    dialogue = new Dialogue();
    dialogue.attach(root);
  }
  injectFontStyle();
  return dialogue;
}
