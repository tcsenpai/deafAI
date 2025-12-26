#!/usr/bin/env bun
/**
 * DeafAI - Deaf Simulator for LLMs
 *
 * Simulates hearing loss by degrading user prompts before sending to an LLM.
 * This helps understand how deaf individuals might experience communication.
 */

import { DeafSimulator, type Language } from './src/deaf-simulator';
import { ApiClient, type ChatMessage, type Model } from './src/api-client';
import { getStrings, type I18nStrings } from './src/i18n';
import * as readline from 'readline';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
};

interface AppState {
  simulator: DeafSimulator;
  client: ApiClient;
  language: Language;
  strings: I18nStrings;
  conversationHistory: ChatMessage[];
  models: Model[];
  hasSystemPrompt: boolean;
}

function loadConfig(): { baseUrl: string; apiKey: string; model: string; level: number; language: Language; systemPrompt: string | null } {
  const baseUrl = process.env.OPENAI_URL || 'http://127.0.0.1:8080/v1';
  const apiKey = process.env.OPENAI_API_KEY || '';
  const model = process.env.MODEL || 'default';
  const level = parseInt(process.env.DEAF_LEVEL || '5', 10);
  const language = (process.env.LANGUAGE || 'en') as Language;
  const systemPrompt = process.env.SYSTEM_PROMPT || null;

  if (!['en', 'it', 'agnostic'].includes(language)) {
    console.warn(`Invalid language "${language}", defaulting to "en"`);
    return { baseUrl, apiKey, model, level, language: 'en', systemPrompt };
  }

  return { baseUrl, apiKey, model, level, language, systemPrompt };
}

function printBanner(state: AppState): void {
  const { strings, simulator, client } = state;

  console.log('\n');
  console.log(`${colors.bgBlue}${colors.white}${colors.bold}  ${strings.welcome}  ${colors.reset}`);
  console.log(`${colors.dim}${'─'.repeat(50)}${colors.reset}`);
  console.log();
  console.log(`${colors.cyan}${strings.configTitle}:${colors.reset}`);
  console.log(`  ${colors.dim}${strings.apiEndpoint}:${colors.reset} ${state.client['config'].baseUrl}`);
  console.log(`  ${colors.dim}${strings.model}:${colors.reset} ${client.getModel()}`);
  console.log(`  ${colors.dim}${strings.deafLevel}:${colors.reset} ${simulator.getLevel()}/10 (${simulator.getLevelDescription()})`);
  console.log(`  ${colors.dim}${strings.language}:${colors.reset} ${simulator.getLanguageLabel()}`);
  console.log(`  ${colors.dim}System Prompt:${colors.reset} ${state.hasSystemPrompt ? `${colors.green}configured${colors.reset}` : `${colors.dim}none${colors.reset}`}`);
  console.log();
  console.log(`${colors.yellow}${strings.commands}:${colors.reset}`);
  console.log(`  ${colors.dim}${strings.cmdExit}${colors.reset}`);
  console.log(`  ${colors.dim}${strings.cmdModels}${colors.reset}`);
  console.log(`  ${colors.dim}${strings.cmdLevel}${colors.reset}`);
  console.log(`  ${colors.dim}${strings.cmdLang}${colors.reset}`);
  console.log(`  ${colors.dim}${strings.cmdHelp}${colors.reset}`);
  console.log(`  ${colors.dim}${strings.cmdClear}${colors.reset}`);
  console.log(`${colors.dim}${'─'.repeat(50)}${colors.reset}`);
  console.log();
}

async function handleModelsCommand(state: AppState, rl: readline.Interface): Promise<void> {
  const { strings, client } = state;

  try {
    console.log(`${colors.dim}Fetching models...${colors.reset}`);
    const models = await client.discoverModels();
    state.models = models;

    if (models.length === 0) {
      console.log(`${colors.yellow}${strings.noModels}${colors.reset}`);
      return;
    }

    console.log(`\n${colors.cyan}${strings.modelsAvailable}:${colors.reset}`);
    models.forEach((model, index) => {
      const isCurrent = model.id === client.getModel();
      const marker = isCurrent ? `${colors.green}*${colors.reset}` : ' ';
      console.log(`  ${marker} ${colors.dim}[${index + 1}]${colors.reset} ${model.id}`);
    });
    console.log();

    const answer = await question(rl, `${colors.cyan}${strings.selectModel}: ${colors.reset}`);
    if (!answer.trim()) return;

    let selectedModel: string | undefined;

    const num = parseInt(answer, 10);
    if (!isNaN(num) && num >= 1 && num <= models.length) {
      const model = models[num - 1];
      selectedModel = model?.id;
    } else {
      const found = models.find(m => m.id.toLowerCase() === answer.toLowerCase());
      if (found) {
        selectedModel = found.id;
      }
    }

    if (selectedModel) {
      client.setModel(selectedModel);
      console.log(`${colors.green}${strings.modelChanged}: ${selectedModel}${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}${strings.error}: ${error instanceof Error ? error.message : 'Unknown error'}${colors.reset}`);
  }
}

function handleLevelCommand(state: AppState, args: string): void {
  const { strings, language } = state;
  const level = parseInt(args, 10);

  if (isNaN(level) || level < 1 || level > 10) {
    console.log(`${colors.red}${strings.invalidLevel}${colors.reset}`);
    return;
  }

  state.simulator = new DeafSimulator({ level, language });
  console.log(`${colors.green}${strings.levelChanged}: ${level}/10 (${state.simulator.getLevelDescription()})${colors.reset}`);
}

function handleLangCommand(state: AppState, args: string): void {
  const { strings } = state;
  const lang = args.trim().toLowerCase() as Language;

  if (!['en', 'it', 'agnostic'].includes(lang)) {
    console.log(`${colors.red}${strings.invalidLang}${colors.reset}`);
    return;
  }

  state.language = lang;
  state.strings = getStrings(lang);
  state.simulator = new DeafSimulator({ level: state.simulator.getLevel(), language: lang });
  console.log(`${colors.green}${state.strings.langChanged}: ${state.simulator.getLanguageLabel()}${colors.reset}`);
}

function question(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function processUserInput(state: AppState, input: string): Promise<void> {
  const { simulator, client, strings, conversationHistory } = state;

  // Simulate hearing loss
  const result = simulator.simulate(input);

  console.log();
  console.log(`${colors.yellow}┌─ ${strings.degradedPrompt} (${strings.lossPercentage}: ${result.lossPercentage}%)${colors.reset}`);
  console.log(`${colors.yellow}│${colors.reset} ${colors.dim}${result.degraded}${colors.reset}`);
  console.log(`${colors.yellow}└${'─'.repeat(40)}${colors.reset}`);
  console.log();

  // Add degraded message to history
  conversationHistory.push({
    role: 'user',
    content: result.degraded,
  });

  // Send to API with streaming
  console.log(`${colors.cyan}┌─ ${strings.response}${colors.reset}`);
  process.stdout.write(`${colors.cyan}│${colors.reset} `);

  try {
    let fullResponse = '';

    for await (const chunk of client.chatStream(conversationHistory)) {
      process.stdout.write(chunk);
      fullResponse += chunk;
    }

    // Add assistant response to history
    conversationHistory.push({
      role: 'assistant',
      content: fullResponse,
    });

    console.log();
    console.log(`${colors.cyan}└${'─'.repeat(40)}${colors.reset}`);
  } catch (error) {
    console.log();
    console.log(`${colors.red}${strings.error}: ${error instanceof Error ? error.message : 'Unknown error'}${colors.reset}`);
  }

  console.log();
}

async function main(): Promise<void> {
  const config = loadConfig();

  // Initialize conversation history with system prompt if provided
  const initialHistory: ChatMessage[] = [];
  if (config.systemPrompt) {
    initialHistory.push({
      role: 'system',
      content: config.systemPrompt,
    });
  }

  const state: AppState = {
    simulator: new DeafSimulator({ level: config.level, language: config.language }),
    client: new ApiClient({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: config.model,
    }),
    language: config.language,
    strings: getStrings(config.language),
    conversationHistory: initialHistory,
    models: [],
    hasSystemPrompt: !!config.systemPrompt,
  };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Handle Ctrl+C gracefully
  rl.on('close', () => {
    console.log(`\n${colors.dim}${state.strings.goodbye}${colors.reset}`);
    process.exit(0);
  });

  printBanner(state);

  // Main loop
  while (true) {
    const prompt = `${colors.green}${colors.bold}${state.strings.promptLabel}${colors.reset}${colors.dim} ❯${colors.reset} `;
    const input = await question(rl, prompt);

    if (!input.trim()) continue;

    const trimmed = input.trim().toLowerCase();

    // Handle commands
    if (trimmed === '/exit' || trimmed === '/quit') {
      console.log(`${colors.dim}${state.strings.goodbye}${colors.reset}`);
      rl.close();
      break;
    }

    if (trimmed === '/help') {
      printBanner(state);
      continue;
    }

    if (trimmed === '/clear') {
      console.clear();
      printBanner(state);
      continue;
    }

    if (trimmed === '/models') {
      await handleModelsCommand(state, rl);
      continue;
    }

    if (trimmed.startsWith('/level ')) {
      handleLevelCommand(state, input.slice(7));
      continue;
    }

    if (trimmed.startsWith('/lang ')) {
      handleLangCommand(state, input.slice(6));
      continue;
    }

    if (trimmed.startsWith('/')) {
      console.log(`${colors.dim}Unknown command. Type /help for available commands.${colors.reset}`);
      continue;
    }

    // Process user message
    await processUserInput(state, input);
  }
}

main().catch(console.error);
