# Add GLM 5.1 to Cursor/Z.ai Coding Plan

## Using Your Existing GLM 4.7 API Key

**Good news!** Your existing Zhipu AI API key works for both GLM 4.7 **and** GLM 5.1. You don't need a new key!

---

## Method 1: Cursor UI (Easiest)

### Step 1: Open Cursor Settings
- Press `Ctrl + ,` (comma)
- OR go to **File → Settings**
- Navigate to **Models → Custom Models**

### Step 2: Add GLM 5.1
Click **"Add Custom Model"** and enter:

| Field | Value |
|-------|-------|
| **Name** | `GLM 5.1` |
| **Provider** | Select "Zhipu AI" or "Custom" |
| **API Base** | `https://open.bigmodel.cn/api/paas/v4` |
| **API Key** | Your existing GLM 4.7 API key |
| **Model Name** | `glm-5.1` |
| **Max Tokens** | `128000` |
| **Context Window** | `128000` |

### Step 3: Save and Select
- Click **Save**
- In the chat panel, click the model dropdown (top-left)
- Select **GLM 5.1** from the list

---

## Method 2: Edit Settings JSON (Direct)

### Step 1: Close Cursor completely
Make sure Cursor is not running.

### Step 2: Edit Settings File
Open this file in a text editor:
```
C:\Users\DICT\AppData\Roaming\Cursor\User\settings.json
```

### Step 3: Add GLM 5.1 Configuration
Add the following to your `settings.json`:

```json
{
  "chatgpt.config": {
    "customModels": [
      {
        "id": "zhipu-glm-5.1",
        "name": "GLM 5.1",
        "description": "Zhipu AI GLM 5.1 - 128K context window",
        "maxTokens": 128000,
        "provider": "zhipuai",
        "apiKey": "YOUR_EXISTING_API_KEY",
        "apiBase": "https://open.bigmodel.cn/api/paas/v4",
        "modelName": "glm-5.1",
        "contextLength": 128000,
        "supportsFunctionCalling": true,
        "supportsStreaming": true
      }
    ]
  }
}
```

### Step 4: Replace and Save
- Replace `YOUR_EXISTING_API_KEY` with your actual GLM 4.7 API key
- Save the file
- Restart Cursor

---

## GLM 5.1 Benefits

| Feature | GLM 4.7 | GLM 5.1 |
|---------|----------|----------|
| Context Window | 128K tokens | **128K tokens** ✅ |
| Max Output | 8K tokens | **8K tokens** |
| Code Understanding | Excellent | **Enhanced** ✅ |
| Function Calling | ✅ | ✅ |
| Streaming | ✅ | ✅ |
| Reasoning | Strong | **Stronger** ✅ |

---

## When to Use GLM 5.1

Perfect for:
- ✅ Large codebase analysis (entire projects in context!)
- ✅ Multi-file refactoring
- ✅ Complex debugging across many files
- ✅ Long documentation review
- ✅ Architecture design for large systems
- ✅ Code migrations and upgrades

---

## Quick Test

Once configured, test it with a prompt like:

```
Can you analyze the entire Divide Rule project structure and summarize the main components? Use GLM 5.1's full 128K context.
```

GLM 5.1 should handle analyzing all your rule files in a single conversation!

---

## Troubleshooting

**Issue**: "Model not found" error
- **Fix**: Check that `apiBase` is exactly: `https://open.bigmodel.cn/api/paas/v4`

**Issue**: "Invalid API key"
- **Fix**: Verify your API key from GLM 4.7 is active at https://open.bigmodel.cn/

**Issue**: Model not appearing in dropdown
- **Fix**: Restart Cursor completely (close all windows, then reopen)

---

## Where's Your API Key?

Your existing GLM 4.7 API key should be in one of these places:
- Zhipu AI Platform console (https://open.bigmodel.cn/)
- Your project's environment variables
- Previous Cursor configurations

If you can't find it, get a new key at: https://open.bigmodel.cn/usercenter/apikeys

---

**Ready to upgrade?** Follow Method 1 for the easiest setup! 🚀
