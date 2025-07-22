import { AccountSDKTranslationKeys } from '../index.js';

export const fr: AccountSDKTranslationKeys = {
  // Dialog messages
  'dialog.base_account': 'Base Account',
  'dialog.signed_in_as': 'Connecté en tant que {username}',
  'dialog.popup_blocked.title': '{app} souhaite continuer dans Base Account',
  'dialog.popup_blocked.message':
    'Cette action nécessite votre permission pour ouvrir une nouvelle fenêtre.',
  'dialog.insufficient_balance.title': 'Autorisation de dépense insuffisante',
  'dialog.insufficient_balance.message':
    'Le solde restant de votre autorisation de dépense ne peut pas couvrir cette transaction. Veuillez choisir comment procéder :',
  'dialog.reauthorize.title': 'Ré-autoriser {app}',
  'dialog.reauthorize.message':
    "{app} a perdu l'accès à votre compte. Veuillez signer à l'étape suivante pour ré-autoriser {app}",

  // Button text
  'button.try_again': 'Réessayer',
  'button.cancel': 'Annuler',
  'button.edit_spend_permission': "Modifier l'autorisation de dépense",
  'button.use_primary_account': 'Utiliser le compte principal',
  'button.continue': 'Continuer',
  'button.not_now': 'Pas maintenant',
};
