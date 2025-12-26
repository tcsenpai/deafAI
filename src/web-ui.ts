/**
 * DeafAI Web UI - Optional web interface for the deaf simulator
 */

import { Hono } from 'hono';
import { DeafSimulator, type Language } from './deaf-simulator';
import { ApiClient, type ChatMessage } from './api-client';
import { getStrings } from './i18n';

const app = new Hono();

// Configuration from environment
const webPort = parseInt(process.env.WEB_PORT || '3000', 10);
const config = {
  baseUrl: process.env.OPENAI_URL || 'http://127.0.0.1:8080/v1',
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.MODEL || 'default',
  level: parseInt(process.env.DEAF_LEVEL || '5', 10),
  language: (process.env.LANGUAGE || 'en') as Language,
  port: webPort,
  devPort: process.env.DEV_PORT ? parseInt(process.env.DEV_PORT, 10) : webPort + 1,
  systemPrompt: process.env.SYSTEM_PROMPT || null,
};

// Session storage (in-memory for simplicity)
const sessions = new Map<string, {
  simulator: DeafSimulator;
  client: ApiClient;
  history: ChatMessage[];
  language: Language;
}>();

function getOrCreateSession(sessionId: string) {
  if (!sessions.has(sessionId)) {
    // Initialize history with system prompt if configured
    const initialHistory: ChatMessage[] = [];
    if (config.systemPrompt) {
      initialHistory.push({
        role: 'system',
        content: config.systemPrompt,
      });
    }

    sessions.set(sessionId, {
      simulator: new DeafSimulator({ level: config.level, language: config.language }),
      client: new ApiClient({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        model: config.model,
      }),
      history: initialHistory,
      language: config.language,
    });
  }
  return sessions.get(sessionId)!;
}

// Escape strings for safe JS embedding
function escapeJs(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

// Serve the main HTML page
app.get('/', (c) => {
  const lang = (c.req.query('lang') || config.language) as Language;
  const rawStrings = getStrings(lang);

  // Escape all strings for JS embedding
  const strings = {
    welcome: escapeJs(rawStrings.welcome),
    promptLabel: escapeJs(rawStrings.promptLabel),
    degradedPrompt: escapeJs(rawStrings.degradedPrompt),
    response: escapeJs(rawStrings.response),
    error: escapeJs(rawStrings.error),
    language: escapeJs(rawStrings.language),
    deafLevel: escapeJs(rawStrings.deafLevel),
    model: escapeJs(rawStrings.model),
  };

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DeafAI - ${strings.welcome}</title>
  <style>
    :root {
      --bg: #1a1a2e;
      --surface: #16213e;
      --primary: #0f3460;
      --accent: #e94560;
      --text: #eee;
      --text-dim: #888;
      --success: #4ade80;
      --warning: #fbbf24;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: var(--primary);
      padding: 1rem 2rem;
      border-bottom: 2px solid var(--accent);
    }
    header h1 { font-size: 1.5rem; }
    header p { color: var(--text-dim); font-size: 0.9rem; }
    .config-bar {
      background: var(--surface);
      padding: 0.75rem 2rem;
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
      align-items: center;
      border-bottom: 1px solid var(--primary);
    }
    .config-bar label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }
    .config-bar select, .config-bar input[type="range"] {
      background: var(--primary);
      color: var(--text);
      border: none;
      padding: 0.4rem 0.6rem;
      border-radius: 4px;
    }
    .config-bar input[type="range"] {
      width: 120px;
      accent-color: var(--accent);
    }
    .level-display {
      min-width: 80px;
      text-align: center;
      font-size: 0.8rem;
      color: var(--text-dim);
    }
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 1rem 2rem;
      gap: 1rem;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
    }
    .chat-container {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem 0;
      min-height: 300px;
    }
    .message {
      padding: 1rem;
      border-radius: 8px;
      max-width: 85%;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .message.user {
      background: var(--primary);
      align-self: flex-end;
    }
    .message.degraded {
      background: var(--surface);
      border-left: 3px solid var(--warning);
      font-style: italic;
      color: var(--text-dim);
      font-size: 0.9rem;
    }
    .message.assistant {
      background: var(--surface);
      align-self: flex-start;
      border-left: 3px solid var(--accent);
    }
    .message-label {
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-bottom: 0.5rem;
    }
    .loss-badge {
      background: var(--warning);
      color: #000;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.7rem;
      margin-left: 0.5rem;
    }
    .input-container {
      display: flex;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--primary);
    }
    .input-container textarea {
      flex: 1;
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--primary);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      resize: none;
      min-height: 60px;
      font-family: inherit;
    }
    .input-container textarea:focus {
      outline: none;
      border-color: var(--accent);
    }
    .input-container button {
      background: var(--accent);
      color: white;
      border: none;
      padding: 0 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      transition: opacity 0.2s;
    }
    .input-container button:hover { opacity: 0.9; }
    .input-container button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .loading {
      display: flex;
      gap: 0.3rem;
      padding: 1rem;
    }
    .loading span {
      width: 8px;
      height: 8px;
      background: var(--accent);
      border-radius: 50%;
      animation: bounce 0.6s infinite alternate;
    }
    .loading span:nth-child(2) { animation-delay: 0.2s; }
    .loading span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce {
      to { transform: translateY(-8px); }
    }
    .models-btn {
      background: var(--primary);
      color: var(--text);
      border: 1px solid var(--accent);
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .models-btn:hover { background: var(--accent); }
    .model-list {
      position: absolute;
      top: 100%;
      left: 0;
      background: var(--surface);
      border: 1px solid var(--primary);
      border-radius: 4px;
      padding: 0.5rem;
      display: none;
      z-index: 100;
      min-width: 200px;
      max-height: 300px;
      overflow-y: auto;
    }
    .model-list.open { display: block; }
    .model-list .model-item {
      padding: 0.4rem 0.6rem;
      cursor: pointer;
      border-radius: 4px;
    }
    .model-list .model-item:hover { background: var(--primary); }
    .model-list .model-item.active { color: var(--success); }
    .model-container { position: relative; }
    .error-msg { color: var(--accent); }
  </style>
</head>
<body>
  <header>
    <h1>🦻 DeafAI</h1>
    <p>${strings.welcome}</p>
  </header>

  <div class="config-bar">
    <label>
      ${strings.language}:
      <select id="language">
        <option value="en" ${lang === 'en' ? 'selected' : ''}>English</option>
        <option value="it" ${lang === 'it' ? 'selected' : ''}>Italiano</option>
        <option value="agnostic" ${lang === 'agnostic' ? 'selected' : ''}>Agnostic</option>
      </select>
    </label>

    <label>
      ${strings.deafLevel}:
      <input type="range" id="level" min="1" max="10" value="${config.level}">
      <span id="levelDisplay" class="level-display">${config.level}/10</span>
    </label>

    <div class="model-container">
      <button type="button" class="models-btn" id="modelsBtn">${strings.model}: <span id="currentModel">${config.model}</span></button>
      <div id="modelList" class="model-list"></div>
    </div>
  </div>

  <main>
    <div class="chat-container" id="chat"></div>

    <div class="input-container">
      <textarea id="input" placeholder="${strings.promptLabel}..."></textarea>
      <button type="button" id="sendBtn">Send</button>
    </div>
  </main>

  <script>
    (function() {
      const sessionId = crypto.randomUUID();
      const chat = document.getElementById('chat');
      const input = document.getElementById('input');
      const sendBtn = document.getElementById('sendBtn');
      const levelSlider = document.getElementById('level');
      const levelDisplay = document.getElementById('levelDisplay');
      const languageSelect = document.getElementById('language');
      const modelsBtn = document.getElementById('modelsBtn');
      const modelList = document.getElementById('modelList');
      const currentModelSpan = document.getElementById('currentModel');

      let currentModel = '${config.model}';
      let currentLevel = ${config.level};
      let currentLang = '${lang}';
      let isLoading = false;

      // Event listeners
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          send();
        }
      });

      sendBtn.addEventListener('click', send);

      levelSlider.addEventListener('input', function() {
        currentLevel = parseInt(this.value, 10);
        levelDisplay.textContent = currentLevel + '/10';
      });

      languageSelect.addEventListener('change', function() {
        currentLang = this.value;
        window.location.href = '/?lang=' + currentLang;
      });

      modelsBtn.addEventListener('click', toggleModels);

      document.addEventListener('click', function(e) {
        if (!e.target.closest('.model-container')) {
          modelList.classList.remove('open');
        }
      });

      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      function addMessage(type, content, extra) {
        extra = extra || {};
        const div = document.createElement('div');
        div.className = 'message ' + type;

        let label = '';
        if (type === 'user') label = '${strings.promptLabel}';
        else if (type === 'degraded') {
          label = '${strings.degradedPrompt}';
          if (extra.loss !== undefined) {
            label += ' <span class="loss-badge">' + extra.loss + '% loss</span>';
          }
        }
        else if (type === 'assistant') label = '${strings.response}';

        const labelDiv = document.createElement('div');
        labelDiv.className = 'message-label';
        labelDiv.innerHTML = label;

        const contentDiv = document.createElement('div');
        contentDiv.textContent = content;

        div.appendChild(labelDiv);
        div.appendChild(contentDiv);
        chat.appendChild(div);
        chat.scrollTop = chat.scrollHeight;
        return div;
      }

      function addLoading() {
        const div = document.createElement('div');
        div.className = 'loading';
        div.id = 'loading';
        div.innerHTML = '<span></span><span></span><span></span>';
        chat.appendChild(div);
        chat.scrollTop = chat.scrollHeight;
      }

      function removeLoading() {
        const el = document.getElementById('loading');
        if (el) el.remove();
      }

      async function send() {
        const text = input.value.trim();
        if (!text || isLoading) return;

        isLoading = true;
        input.value = '';
        sendBtn.disabled = true;

        addMessage('user', text);
        addLoading();

        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sessionId,
              message: text,
              level: currentLevel,
              language: currentLang
            })
          });

          removeLoading();

          if (!res.ok) {
            const errText = await res.text();
            throw new Error('Request failed: ' + errText);
          }

          const data = await res.json();
          addMessage('degraded', data.degraded, { loss: data.lossPercentage });
          addMessage('assistant', data.response);
        } catch (err) {
          removeLoading();
          addMessage('assistant', '${strings.error}: ' + err.message);
        }

        isLoading = false;
        sendBtn.disabled = false;
        input.focus();
      }

      async function toggleModels() {
        if (modelList.classList.contains('open')) {
          modelList.classList.remove('open');
          return;
        }

        modelList.innerHTML = '<div class="model-item">Loading...</div>';
        modelList.classList.add('open');

        try {
          const res = await fetch('/api/models');
          if (!res.ok) throw new Error('Failed to fetch');

          const models = await res.json();

          if (!models || models.length === 0) {
            modelList.innerHTML = '<div class="model-item">No models found</div>';
            return;
          }

          modelList.innerHTML = '';
          models.forEach(function(m) {
            const item = document.createElement('div');
            item.className = 'model-item' + (m.id === currentModel ? ' active' : '');
            item.textContent = m.id;
            item.addEventListener('click', function() {
              selectModel(m.id);
            });
            modelList.appendChild(item);
          });
        } catch (err) {
          console.error('Failed to fetch models:', err);
          modelList.innerHTML = '<div class="model-item error-msg">Error loading models</div>';
        }
      }

      function selectModel(id) {
        currentModel = id;
        currentModelSpan.textContent = id;
        modelList.classList.remove('open');

        fetch('/api/model', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sessionId, model: id })
        }).catch(function(err) {
          console.error('Failed to set model:', err);
        });
      }

      input.focus();
    })();
  </script>
</body>
</html>`;

  return c.html(html);
});

// API: Chat endpoint
app.post('/api/chat', async (c) => {
  try {
    const body = await c.req.json<{
      sessionId: string;
      message: string;
      level: number;
      language: Language;
    }>();

    const session = getOrCreateSession(body.sessionId);

    // Update settings if changed
    if (session.simulator.getLevel() !== body.level || session.language !== body.language) {
      session.simulator = new DeafSimulator({ level: body.level, language: body.language });
      session.language = body.language;
    }

    // Simulate hearing loss
    const result = session.simulator.simulate(body.message);

    // Add to history
    session.history.push({
      role: 'user',
      content: result.degraded,
    });

    // Get response from LLM
    const response = await session.client.chat(session.history);

    session.history.push({
      role: 'assistant',
      content: response,
    });

    return c.json({
      original: result.original,
      degraded: result.degraded,
      lossPercentage: result.lossPercentage,
      response,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return c.json({
      original: '',
      degraded: '',
      lossPercentage: 0,
      response: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }, 500);
  }
});

// API: List models
app.get('/api/models', async (c) => {
  const client = new ApiClient({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.model,
  });

  try {
    const models = await client.discoverModels();
    return c.json(models);
  } catch (error) {
    console.error('Models error:', error);
    return c.json([], 500);
  }
});

// API: Set model for session
app.post('/api/model', async (c) => {
  try {
    const body = await c.req.json<{ sessionId: string; model: string }>();
    const session = getOrCreateSession(body.sessionId);
    session.client.setModel(body.model);
    return c.json({ ok: true });
  } catch (error) {
    return c.json({ ok: false, error: String(error) }, 500);
  }
});

// Health check
app.get('/health', (c) => c.json({ ok: true }));

export function startServer(port: number, isDev = false) {
  const modeLabel = isDev ? '🔧 Dev' : '🦻';
  console.log(`${modeLabel} DeafAI Web UI starting on http://localhost:${port}`);
  console.log(`   API Endpoint: ${config.baseUrl}`);
  console.log(`   Model: ${config.model}`);
  console.log(`   Deaf Level: ${config.level}/10`);
  console.log(`   Language: ${config.language}`);
  console.log(`   System Prompt: ${config.systemPrompt ? 'configured' : 'none'}`);
  if (isDev) {
    console.log(`   Mode: Development`);
  }
  return Bun.serve({
    port,
    fetch: app.fetch,
  });
}

export function startWebUI(port = config.port) {
  return startServer(port, false);
}

export function startDevServer(port = config.devPort) {
  return startServer(port, true);
}

// If run directly, start the server
if (import.meta.main) {
  const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
  const port = isDev ? config.devPort : config.port;
  startServer(port, isDev);
}

// Export app for testing (not as default to avoid Bun auto-serve)
export { app };
