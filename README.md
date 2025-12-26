# DeafAI

A deaf simulator for LLMs. Degrades user input to simulate hearing loss before sending to an OpenAI-compatible API, testing how well language models can infer meaning from incomplete or garbled text.

## Why

This idea was born while I was at my Grandma's house for dinner. She is 95 years old, so she has a lot of hearing loss. My father and I discussed briefly how LLMs could manage hearing loss: can they infer like us humans? How well? And so, here we are.

## How It Works

1. User enters a message
2. The simulator degrades the text based on the configured hearing loss level (1-10)
3. The degraded message is sent to the LLM
4. The LLM responds based on what it "heard"

Hearing loss simulation is based on clinical audiological data (ASHA/WHO classifications), with recognition rates ranging from ~97% at level 1 (normal) to ~8% at level 10 (profound loss).

## Requirements

- Node.js 18+ or [Bun](https://bun.sh)
- OpenAI-compatible API endpoint

## Installation

```bash
# Using bun
bun install

# Or npm
npm install

# Or yarn
yarn install
```

Then configure:
```bash
cp .env.example .env
# Edit .env with your API settings
```

## Configuration

Edit `.env` to configure:

- `OPENAI_URL` - API endpoint (default: http://127.0.0.1:8080/v1)
- `OPENAI_API_KEY` - Your API key
- `MODEL` - Model to use
- `DEAF_LEVEL` - Hearing loss level 1-10 (default: 5)
- `LANGUAGE` - Language for phonetic simulation: `en`, `it`, or `agnostic`
- `SYSTEM_PROMPT` - Optional system prompt for the AI
- `WEB_PORT` - Web UI port (default: 3000)

## Usage

### CLI

```bash
bun run start
```

Commands:
- `/models` - List and select available models
- `/level <1-10>` - Change hearing loss level
- `/lang <en|it|agnostic>` - Change language
- `/clear` - Clear screen
- `/exit` - Quit

### Web UI

```bash
bun run web
```

Then open http://localhost:3000 in your browser.

## Hearing Loss Levels

| Level | Classification | Recognition |
|-------|---------------|-------------|
| 1 | Normal | ~97% |
| 2 | Slight | ~92% |
| 3-4 | Mild | ~85-78% |
| 5-6 | Moderate | ~70-60% |
| 7 | Moderately Severe | ~45% |
| 8-9 | Severe | ~30-18% |
| 10 | Profound | ~8% |

## License

WTFPL
