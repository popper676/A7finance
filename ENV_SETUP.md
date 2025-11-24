# Environment Variables Setup Guide

## How Environment Variables Are Injected

### 1. **In Production (GitHub Actions)**

The GitHub Actions workflow injects the API key from GitHub Secrets into the build process:

```yaml
# .github/workflows/deploy.yml (lines 35-41)
- name: Build with API Key
  env:
    # Inject secret as VITE_ variable for import.meta.env usage
    VITE_OPENAI_API_KEY: ${{ secrets.OPENAIAPI }}
    # Inject secret as standard variable for vite config define usage
    OPENAIAPI: ${{ secrets.OPENAIAPI }}
  run: npm run build
```

**What happens:**
- GitHub Secret `OPENAIAPI` → becomes environment variable `VITE_OPENAI_API_KEY`
- GitHub Secret `OPENAIAPI` → becomes environment variable `OPENAIAPI`
- Both are available during `npm run build`

### 2. **In Vite Config (vite.config.ts)**

```typescript
// vite.config.ts (lines 5-16)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    define: {
      // This replaces 'process.env.OPENAIAPI' in your code with the actual value
      'process.env.OPENAIAPI': JSON.stringify(
        env.OPENAIAPI || env.VITE_OPENAI_API_KEY || ''
      ),
    },
  };
});
```

**What happens:**
- Vite loads environment variables from `.env` files
- It checks for `OPENAIAPI` first, then `VITE_OPENAI_API_KEY`
- Replaces `process.env.OPENAIAPI` in your code with the actual value

### 3. **In Your App Code (App.tsx)**

```typescript
// App.tsx (lines 70-88)
const getEnvApiKey = () => {
  let key = '';
  
  // Priority order:
  // 1. Check process.env.OPENAIAPI (from vite.config.ts define)
  if (typeof process !== 'undefined' && process.env?.OPENAIAPI) 
    key = process.env.OPENAIAPI;
  
  // 2. Check import.meta.env.OPENAIAPI (from .env file)
  else if (typeof import.meta !== 'undefined' && import.meta.env?.OPENAIAPI) 
    key = import.meta.env.OPENAIAPI;
  
  // 3. Check import.meta.env.VITE_OPENAI_API_KEY (from .env file)
  else if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENAI_API_KEY) 
    key = import.meta.env.VITE_OPENAI_API_KEY;

  // Validate the key format
  if (key && !key.startsWith('sk-')) {
    console.warn("Invalid API Key format");
    return '';
  }

  return key;
};
```

## Local Development Setup

### Step 1: Create a `.env` file in your project root

```bash
# .env
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

**OR**

```bash
# .env
OPENAIAPI=sk-your-actual-api-key-here
```

### Step 2: The file structure should look like:

```
your-project/
├── .env                 # Your local API key (NOT committed to git)
├── .gitignore          # Should include .env
├── env.example.txt     # Example file (safe to commit)
├── vite.config.ts
├── App.tsx
└── ...
```

### Step 3: Restart your dev server

After creating `.env`, restart Vite:
```bash
npm run dev
```

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ PRODUCTION (GitHub Actions)                              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  GitHub Secret: OPENAIAPI                                │
│         ↓                                                 │
│  Workflow sets:                                           │
│    - VITE_OPENAI_API_KEY = ${{ secrets.OPENAIAPI }}      │
│    - OPENAIAPI = ${{ secrets.OPENAIAPI }}                │
│         ↓                                                 │
│  npm run build                                            │
│         ↓                                                 │
│  vite.config.ts reads env vars                           │
│         ↓                                                 │
│  App.tsx getEnvApiKey() finds the key                   │
│                                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ LOCAL DEVELOPMENT                                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  .env file:                                               │
│    VITE_OPENAI_API_KEY=sk-xxx...                         │
│         ↓                                                 │
│  npm run dev                                              │
│         ↓                                                 │
│  Vite loads .env automatically                           │
│         ↓                                                 │
│  App.tsx getEnvApiKey() finds the key                   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Sample Files

### `.env` (create this locally, DO NOT commit)
```env
VITE_OPENAI_API_KEY=sk-proj-abc123xyz789...
```

### `env.example.txt` (safe to commit)
```env
# Copy this to .env and add your actual key
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
```

## Testing

To verify your setup works:

1. **Local:** Check browser console - no warning about missing API key
2. **Production:** After deployment, check the deployed app - no warning

## Important Notes

- ✅ `.env` files are in `.gitignore` - they won't be committed
- ✅ GitHub Secrets are encrypted and secure
- ✅ The app checks multiple variable names for flexibility
- ✅ Keys must start with `sk-` to be valid

