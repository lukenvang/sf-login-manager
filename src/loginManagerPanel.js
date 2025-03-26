const vscode = require('vscode');
const { getLoginInfo } = require('./utils');

class LoginManagerPanel {
    static currentPanel = undefined;
    static viewType = 'loginManager';

    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (LoginManagerPanel.currentPanel) {
            LoginManagerPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            LoginManagerPanel.viewType,
            'Salesforce Login Manager',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri]
            }
        );

        LoginManagerPanel.currentPanel = new LoginManagerPanel(panel, extensionUri);
    }

    constructor(panel, extensionUri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._disposables = [];

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'setDefault':
                        vscode.commands.executeCommand('user-manager.setDefaultOrg', message.username);
                        this._update();
                        return;
                    case 'logoutOrg':
                        vscode.commands.executeCommand('user-manager.logoutOrg', {
                            username: message.username,
                            alias: message.alias
                        });
                        this._update();
                        return;
                    case 'openOrg':
                        vscode.commands.executeCommand('user-manager.openOrgInBrowser', message.username);
                        return;
                    case 'refreshLogins':
                        this._update();
                        vscode.commands.executeCommand('user-manager.refreshLoginView');
                        return;
                    case 'openOrgIncognito':
                        vscode.commands.executeCommand('user-manager.openOrgInBrowserIncognito', message.username);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    dispose() {
        LoginManagerPanel.currentPanel = undefined;

        // Clean up resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    _update() {
        this._panel.title = 'Salesforce Login Manager';
        this._panel.webview.html = this._getHtmlForWebview();
    }

    refresh() {
        this._update();
    }

    _getHtmlForWebview() {
        const loginInfo = getLoginInfo();

        // Generate HTML for the login list
        let loginListHtml = '';
        if (loginInfo.logins.length === 0) {
            loginListHtml = '<div class="no-logins">No Salesforce logins found</div>';
        } else {
            loginListHtml = '<div class="login-list">';
            for (const login of loginInfo.logins) {
                const displayName = login.alias || login.username;
                const isDefaultClass = login.isDefault ? 'is-default' : '';
                const isSandbox = login.isSandbox ? 'Sandbox' : 'Production';

                loginListHtml += `
                    <div class="login-item ${isDefaultClass}" data-username="${login.username}" data-alias="${login.alias}">
                        <div class="login-details">
                            <div class="login-name">${displayName}</div>
                            <div class="login-email">${login.username}</div>
                            ${login.instanceUrl ? `<div class="login-instance">${login.instanceUrl}</div>` : ''}
                            ${login.isDefault ? '<div class="default-badge">Default</div>' : ''}
                            <div class="login-instance">${isSandbox}</div>
                        </div>
                        <div class="login-actions">
                            <button class="action-button open-org" data-username="${login.username}">
                                Open Org
                            </button>
                            <button class="action-button open-org-incognito" data-username="${login.username}">
                                Open Org Incognito
                            </button>
                            ${!login.isDefault ?
                                `<button class="action-button set-default" data-username="${login.username}">
                                    Set as Default
                                </button>` : ''}
                            <button class="action-button logout-org" data-username="${login.username}" data-alias="${login.alias}">
                               Log Out
                            </button>
                        </div>
                    </div>
                `;
            }
            loginListHtml += '</div>';
        }

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Salesforce Login Manager</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    padding: 20px;
                }
                .header {
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .refresh-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 6px 12px;
                    cursor: pointer;
                    border-radius: 2px;
                }
                .refresh-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .login-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .login-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                    border-radius: 4px;
                }
                .login-item.is-default {
                    background-color: var(--vscode-list-activeSelectionBackground);
                    color: var(--vscode-list-activeSelectionForeground);
                }
                .login-details {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .login-name {
                    font-weight: bold;
                }
                .login-email {
                    font-size: 0.9em;
                    opacity: 0.8;
                }
                .login-instance {
                    font-size: 0.8em;
                    opacity: 0.7;
                }
                .login-actions {
                    display: flex;
                    gap: 8px;
                }
                .action-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 4px 8px;
                    cursor: pointer;
                    border-radius: 2px;
                    font-size: 12px;
                }
                .action-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .open-org {
                    background-color: var(--vscode-button-background);
                }
                .logout-org {
                    background-color: var(--vscode-errorForeground);
                }
                .no-logins {
                    font-style: italic;
                    opacity: 0.7;
                    text-align: center;
                    padding: 20px;
                }
                .default-badge {
                    display: inline-block;
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    font-size: 11px;
                    padding: 2px 6px;
                    border-radius: 10px;
                    margin-top: 4px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Salesforce Logins</h1>
                <button class="refresh-button" id="refresh-button">Refresh</button>
            </div>
            ${loginListHtml}
            <script>
                (function() {
                    const vscode = acquireVsCodeApi();
                    
                    // Handle refresh button
                    document.getElementById('refresh-button').addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'refreshLogins'
                        });
                    });
                    
                    // Handle set default buttons
                    document.querySelectorAll('.set-default').forEach(button => {
                        button.addEventListener('click', () => {
                            const username = button.getAttribute('data-username');
                            vscode.postMessage({
                                command: 'setDefault',
                                username: username
                            });
                        });
                    });
                    
                    // Handle open org buttons
                    document.querySelectorAll('.open-org').forEach(button => {
                        button.addEventListener('click', () => {
                            const username = button.getAttribute('data-username');
                            vscode.postMessage({
                                command: 'openOrg',
                                username: username
                            });
                        });
                    });

                    // Handle open org incognito buttons
                    document.querySelectorAll('.open-org-incognito').forEach(button => {
                        button.addEventListener('click', () => {
                            const username = button.getAttribute('data-username');
                            vscode.postMessage({
                                command: 'openOrgIncognito',
                                username: username
                            });
                        });
                    });
                    
                    // Handle logout login buttons
                    document.querySelectorAll('.logout-org').forEach(button => {
                        button.addEventListener('click', () => {
                            const username = button.getAttribute('data-username');
                            const alias = button.getAttribute('data-alias');
                            vscode.postMessage({
                                command: 'logoutOrg',
                                username: username,
                                alias: alias
                            });
                        });
                    });
                })();
            </script>
        </body>
        </html>`;
    }
}

module.exports = LoginManagerPanel; 