# Quick Start Scripts

These PowerShell scripts make it easy to start the Voice Converter system.

## 🚀 One-Command Startup (Recommended)

```powershell
.\start.ps1
```

This will:
- ✅ Start backend in Terminal 1
- ✅ Start frontend in Terminal 2
- ✅ Configure all environment variables
- ✅ Suppress harmless warnings

Then open: **http://localhost:3000**

---

## 📋 Individual Scripts

### Backend Only
```powershell
cd python-backend
.\start_backend.ps1
```

### Frontend Only
```powershell
.\start_frontend.ps1
```

---

## ⚙️ Configuration

Edit `python-backend/start_backend.ps1` to change:
- **Model size**: `tiny` (fast) | `small` (balanced) | `medium` (accurate)
- **Device**: `cpu` (no GPU) | `cuda` (with GPU)
- **Compute type**: `int8` (CPU) | `float16` (GPU)

---

## 🛑 Stopping

- Close the PowerShell windows, or
- Press `Ctrl+C` in each terminal

---

## 🐛 Troubleshooting

### "Script cannot be loaded because running scripts is disabled"
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Backend won't start
```powershell
cd python-backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Frontend won't start
```powershell
npm install
```

### Port already in use
- Stop any existing instances
- Or change ports in the scripts
