# Salesforce Login Manager

A Visual Studio Code extension that graphically displays and manages Salesforce CLI logins. This extension allows users to view all their Salesforce CLI authenticated orgs, switch between them, and log out directly from VS Code.

## Features

- **View Salesforce Logins**: See all your authenticated Salesforce orgs in 1 tab.
- **Set Default Org**: Quickly switch between orgs by setting a different org as default with one click.
- **Log out org**: Log out and Remove unnecessary or expired logins directly from the extension.
- **Convenient Access**: Access all functionality directly from the VS Code sidebar.

## Usage

1. Open the command palette (press Ctrl+Shift+P on Windows or Linux, or Cmd+Shift+P on macOS) and run SFDX: Open Login Manager


## Requirements

- Visual Studio Code 1.60.0 or newer
- Salesforce CLI installed
- At least one authenticated Salesforce org

## Extension Settings

This extension does not contribute any settings yet.

## How It Works

The extension reads authentication information directly from the Salesforce CLI configuration files located in your home directory (`.sfdx/` folder). It reads login information from the alias.json files stored in this directory. It does not modify or create any authentication; it only manages existing authentications created through the Salesforce CLI.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.