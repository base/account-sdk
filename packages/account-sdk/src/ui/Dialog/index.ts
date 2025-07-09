import { injectFontStyle } from ':ui/assets/injectFontStyle.js';
import { Dialog } from './Dialog.js';

let dialog: Dialog | null = null;

export function initDialog() {
  if (!dialog) {
    const root = document.createElement('div');
    root.className = '-base-acc-sdk-css-reset';
    document.body.appendChild(root);
    dialog = new Dialog();
    dialog.attach(root);
  }
  injectFontStyle();
  return dialog;
}
