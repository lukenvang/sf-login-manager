const vscode = require('vscode');
const { executeCommand } = require('./src/utils');
const SalesforceLoginProvider = require('./src/salesforceLoginProvider');
const LoginManagerPanel = require('./src/loginManagerPanel');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // Create the Salesforce login tree view provider
    const loginProvider = new SalesforceLoginProvider();

    // Register command to open the login panel
    let openLoginPanel = vscode.commands.registerCommand('user-manager.openLoginPanel', function () {
        LoginManagerPanel.createOrShow(context.extensionUri);
    });

    // Register command to refresh the login view
    let refreshLoginView = vscode.commands.registerCommand('user-manager.refreshLoginView', function () {
        loginProvider.refresh();
    });

    // Register command to open org in browser
    let openOrgInBrowser = vscode.commands.registerCommand('user-manager.openOrgInBrowser', function (item) {
        const username = typeof item === 'string' ? item : item.username;

        if (!username) {
            vscode.window.showErrorMessage('No username provided');
            return;
        }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Opening org ${username} in browser...`
        },
            async (progress) => {
                progress.report({ message: 'Opening salesforce org' });
                try {
                    await executeCommand(`sf org open -o ${username} --json`);

                } catch (e) {
                    vscode.window.showErrorMessage(`Error opening org in incognito mode: ${e.message}`);
                }

            }
        );
    });

    let openOrgInBrowserIncognito = vscode.commands.registerCommand('user-manager.openOrgInBrowserIncognito', function (item) {
        const username = typeof item === 'string' ? item : item.username;

        if (!username) {
            vscode.window.showErrorMessage('No username provided');
            return;
        }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Opening org ${username} in browser (Incognito) ...`
        },
            async (progress) => {
                progress.report({ message: 'Opening salesforce org ( Incognito )' });
                try {
                    await executeCommand(`sf org open -o ${username} --private --json`);
                } catch (e) {
                    vscode.window.showErrorMessage(`Error opening org in incognito mode: ${e.message}`);
                }
            }
        );
    });

    // Register command to set default org
    let setDefaultOrg = vscode.commands.registerCommand('user-manager.setDefaultOrg', function (item) {
        const username = typeof item === 'string' ? item : item.username;

        if (!username) {
            vscode.window.showErrorMessage('No username provided');
            return;
        }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Setting ${username} as default org...`
        },
            async (progress, token) => {
                await executeCommand(`sf config set target-org ${username}`);
                token.report({ message: 'Default org set successfully' });
            }
        );
    });

    // Register command to log out an org's authentication
    let logOutOfOrg = vscode.commands.registerCommand('user-manager.logoutOrg', async function (item) {
        const username = typeof item === 'string' ? item : item.username;

        if (!username) {
            vscode.window.showErrorMessage('No username provided');
            return;
        }

        // Ask for confirmation
        const answer = await vscode.window.showWarningMessage(
            `Are you sure you want to logout of ${username}?`,
            { modal: true },
            'Yes',
            'No'
        );

        if (answer === 'Yes') {
            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Logging out of ${username}...`,
                    cancellable: false
                }, async (progress) => {

                    // Revoke the org access using SF CLI
                    try {
                        await executeCommand(`sf org logout -o ${username} --no-prompt --json`);
                    } catch (error) {
                        console.warn(`Warning: Could not revoke org access: ${error.message}`);
                    }

                    progress.report({ message: 'Logged out successfully' });
                    loginProvider.refresh();
                    if (LoginManagerPanel.currentPanel) {
                        LoginManagerPanel.currentPanel.refresh();
                    }
                });

                vscode.window.showInformationMessage(`Logged out of ${username} successfully`);
            } catch (error) {
                console.error('Error logging out of org:', error);
                vscode.window.showErrorMessage(`Failed to logout org: ${error.message}`);
            }
        }
    });

    // Add commands to subscriptions
    context.subscriptions.push(openLoginPanel);
    context.subscriptions.push(refreshLoginView);
    context.subscriptions.push(openOrgInBrowser);
    context.subscriptions.push(openOrgInBrowserIncognito);
    context.subscriptions.push(setDefaultOrg);
    context.subscriptions.push(logOutOfOrg);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}