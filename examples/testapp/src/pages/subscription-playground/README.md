# Subscription Playground

An interactive playground for testing the Base Subscribe SDK function (`subscribe`).

## Features

- **Interactive Code Editor**: Edit and execute subscription code in real-time
- **Live Output**: See results, errors, and console output immediately
- **Quick Tips**: Helpful hints and examples for creating spend permissions
- **Focused Experience**: Dedicated page for subscription management testing

## Layout

This page uses a custom layout without the main app header (SDK type switcher, environment selector, and Reset button) to provide a cleaner, focused experience for testing subscription functionality.

## Components

- `CodeEditor`: Monaco-based code editor with syntax highlighting
- `Output`: Displays execution results, errors, and console logs
- `QuickTips`: Shows contextual help and examples
- `Header`: Simple header specific to the subscription playground

## Usage

1. Navigate to `/subscription-playground` in the testapp
2. Edit the code in the editor
3. Click "Run" to execute the code
4. View results in the output panel
5. Use Quick Tips for guidance on creating spend permissions

## Development

The playground executes code in a sandboxed environment with access to the Base Subscribe SDK function. Console output is captured and displayed in real-time.

## Subscription Function Details

The `subscribe` function creates spend permissions for recurring USDC payments:
- **amount**: Maximum USDC per period (e.g., "10.00" = $10 USDC)
- **to**: The spender address (your application)
- **periodInDays**: Recurring interval (e.g., 30 for monthly)
- **testnet**: Whether to use testnet (Base Sepolia)

Only USDC on Base and Base Sepolia are supported.
