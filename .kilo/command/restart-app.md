# restart-app

Kill any running Electron app instances and restart the application.

This command is useful during development when you have multiple app instances running or need to restart after making changes.

## Usage

```bash
kilo restart-app
```

## What it does

1. **Kill running processes**: Finds and terminates any running Electron processes for the Hailstorm app
2. **Clean restart**: Launches a fresh instance of the application using `npm run start`

## Requirements

- Must be run from the project root directory
- Node.js and npm must be available
- The application must be properly configured with electron-forge

## Implementation

The command executes a shell script (`.kilo/command/restart-app.sh`) that:

1. **Detects platform** and uses appropriate process killing commands:
   - **macOS/Linux**: `pkill -f "electron.*hailstorm"`
   - **Windows**: `taskkill /F /IM electron.exe /T`

2. **Waits briefly** for processes to terminate completely

3. **Restarts the app** with `npm run start`

## Common Use Cases

- **Multiple instances**: When you have several app windows open during development
- **Stuck processes**: When the app doesn't close properly
- **Fresh start**: When you need to restart after configuration changes
- **Development workflow**: Quick restart during iterative development

## Troubleshooting

If the command doesn't work:
- Ensure you're in the project root directory
- Check that Node.js and npm are installed
- Verify that no other processes are holding Electron resources
- Try manually killing processes with your system's task manager