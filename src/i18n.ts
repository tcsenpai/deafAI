/**
 * Internationalization strings for the CLI
 */

import type { Language } from './deaf-simulator';

export interface I18nStrings {
  welcome: string;
  configTitle: string;
  apiEndpoint: string;
  model: string;
  deafLevel: string;
  language: string;
  commands: string;
  cmdExit: string;
  cmdModels: string;
  cmdLevel: string;
  cmdLang: string;
  cmdHelp: string;
  cmdClear: string;
  promptLabel: string;
  thinking: string;
  degradedPrompt: string;
  lossPercentage: string;
  response: string;
  error: string;
  modelsAvailable: string;
  noModels: string;
  modelChanged: string;
  levelChanged: string;
  langChanged: string;
  invalidLevel: string;
  invalidLang: string;
  goodbye: string;
  selectModel: string;
  currentSettings: string;
}

const strings: Record<Language, I18nStrings> = {
  en: {
    welcome: 'DeafAI - Deaf Simulator for LLMs',
    configTitle: 'Configuration',
    apiEndpoint: 'API Endpoint',
    model: 'Model',
    deafLevel: 'Deaf Level',
    language: 'Language',
    commands: 'Commands',
    cmdExit: '/exit, /quit - Exit the program',
    cmdModels: '/models - List available models',
    cmdLevel: '/level <1-10> - Change hearing loss level',
    cmdLang: '/lang <en|it|agnostic> - Change language',
    cmdHelp: '/help - Show this help',
    cmdClear: '/clear - Clear screen',
    promptLabel: 'You',
    thinking: 'Thinking...',
    degradedPrompt: 'What the AI heard',
    lossPercentage: 'Signal loss',
    response: 'AI Response',
    error: 'Error',
    modelsAvailable: 'Available models',
    noModels: 'No models found or model discovery not supported',
    modelChanged: 'Model changed to',
    levelChanged: 'Hearing loss level changed to',
    langChanged: 'Language changed to',
    invalidLevel: 'Invalid level. Use a number between 1 and 10',
    invalidLang: 'Invalid language. Use: en, it, or agnostic',
    goodbye: 'Goodbye!',
    selectModel: 'Select a model (number or name)',
    currentSettings: 'Current settings',
  },
  it: {
    welcome: 'DeafAI - Simulatore di Sordità per LLM',
    configTitle: 'Configurazione',
    apiEndpoint: 'Endpoint API',
    model: 'Modello',
    deafLevel: 'Livello Sordità',
    language: 'Lingua',
    commands: 'Comandi',
    cmdExit: '/exit, /quit - Esci dal programma',
    cmdModels: '/models - Elenca modelli disponibili',
    cmdLevel: '/level <1-10> - Cambia livello di perdita uditiva',
    cmdLang: '/lang <en|it|agnostic> - Cambia lingua',
    cmdHelp: '/help - Mostra questa guida',
    cmdClear: '/clear - Pulisci schermo',
    promptLabel: 'Tu',
    thinking: 'Sto pensando...',
    degradedPrompt: 'Cosa ha sentito la AI',
    lossPercentage: 'Perdita del segnale',
    response: 'Risposta AI',
    error: 'Errore',
    modelsAvailable: 'Modelli disponibili',
    noModels: 'Nessun modello trovato o scoperta modelli non supportata',
    modelChanged: 'Modello cambiato in',
    levelChanged: 'Livello perdita uditiva cambiato a',
    langChanged: 'Lingua cambiata in',
    invalidLevel: 'Livello non valido. Usa un numero tra 1 e 10',
    invalidLang: 'Lingua non valida. Usa: en, it, o agnostic',
    goodbye: 'Arrivederci!',
    selectModel: 'Seleziona un modello (numero o nome)',
    currentSettings: 'Impostazioni attuali',
  },
  agnostic: {
    welcome: 'DeafAI - Deaf Simulator for LLMs / Simulatore di Sordità per LLM',
    configTitle: 'Configuration / Configurazione',
    apiEndpoint: 'API Endpoint',
    model: 'Model / Modello',
    deafLevel: 'Deaf Level / Livello Sordità',
    language: 'Language / Lingua',
    commands: 'Commands / Comandi',
    cmdExit: '/exit, /quit - Exit / Esci',
    cmdModels: '/models - List models / Elenca modelli',
    cmdLevel: '/level <1-10> - Change level / Cambia livello',
    cmdLang: '/lang <en|it|agnostic> - Change language / Cambia lingua',
    cmdHelp: '/help - Show help / Mostra guida',
    cmdClear: '/clear - Clear screen / Pulisci schermo',
    promptLabel: 'You / Tu',
    thinking: 'Thinking... / Sto pensando...',
    degradedPrompt: 'What AI heard / Cosa ha sentito la AI',
    lossPercentage: 'Signal loss / Perdita segnale',
    response: 'AI Response / Risposta AI',
    error: 'Error / Errore',
    modelsAvailable: 'Available models / Modelli disponibili',
    noModels: 'No models found / Nessun modello trovato',
    modelChanged: 'Model changed to / Modello cambiato in',
    levelChanged: 'Level changed to / Livello cambiato a',
    langChanged: 'Language changed to / Lingua cambiata in',
    invalidLevel: 'Invalid level (1-10) / Livello non valido (1-10)',
    invalidLang: 'Invalid language: en, it, agnostic',
    goodbye: 'Goodbye! / Arrivederci!',
    selectModel: 'Select model / Seleziona modello',
    currentSettings: 'Current settings / Impostazioni attuali',
  },
};

export function getStrings(language: Language): I18nStrings {
  return strings[language];
}
