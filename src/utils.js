const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

/**
 * Execute a shell command
 * @param {string} command The command to execute
 * @returns {Promise<string>} The command output
 */
function executeCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error}`);
                return reject(error);
            }
            if (stderr) {
                console.error(`Command stderr: ${stderr}`);
            }
            return resolve(stdout);
        });
    });
}

/**
 * Get the path to the Salesforce CLI config directory
 * @returns {string} The path to the .sfdx directory
 */
function getSfdxConfigPath() {
    const homeDir = os.homedir();
    return path.join(homeDir, '.sfdx');
}

/**
 * Find alias for a username
 * @param {string} username The username to find alias for
 * @returns {string|null} The alias if found, null otherwise
 */
function findAliasForUsername(username) {
    try {
        const configPath = getSfdxConfigPath();

        // Get all JSON files except sfdx-config.json
        const files = fs.readdirSync(configPath).filter(f =>
            f.endsWith('.json') && f !== 'sfdx-config.json' && f !== `${username}.json`
        );

        for (const file of files) {
            try {
                const filePath = path.join(configPath, file);
                const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

                if (content.username === username) {
                    return file.replace('.json', '');
                }
            } catch (err) {
                // Skip files that can't be parsed
                continue;
            }
        }

        return null;
    } catch (err) {
        console.error('Error finding alias:', err);
        return null;
    }
}

/**
 * Get login information from Salesforce CLI config
 * @returns {Object} Object containing logins and default username
 */
function getLoginInfo() {
    try {
        const configPath = getSfdxConfigPath();

        if (!fs.existsSync(configPath)) {
            return { logins: [], defaultUsername: null };
        }

        // Get all alias files
        const files = fs.readdirSync(configPath).filter(f => f.endsWith('.json'));

        // Find the defaultusername in sfdx-config.json
        const configFile = path.join(configPath, 'sfdx-config.json');
        let defaultUsername = null;

        if (fs.existsSync(configFile)) {
            const configContent = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            defaultUsername = configContent.defaultusername;
        }

        const logins = [];


        const filePath = path.join(configPath, 'alias.json');
        const aliasContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const usernameToAliasMap = new Map();

        Object.keys(aliasContent.orgs).forEach((key) => {
            const alias = key;
            const username = aliasContent.orgs[key];
            usernameToAliasMap.set(username, alias);
        });

        for (const file of files) {
            try {
                if (file === 'sfdx-config.json') continue;

                const filePath = path.join(configPath, file);
                const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

                // Extract the alias from the filename (remove .json extension)
                const alias = file.replace('.json', '');

                if (content.username) {
                    logins.push({
                        username: content.username,
                        alias: alias,
                        orgId: content.orgId || null,
                        instanceUrl: content.instanceUrl || null,
                        isDefault: content.username === defaultUsername,
                        isSandbox: content.isSandbox || false,
                        alias: usernameToAliasMap.get(content.username)

                    });
                }
            } catch (err) {
                console.error(`Error processing file ${file}:`, err);
            }
        }

        return { logins, defaultUsername };
    } catch (err) {
        console.error('Error getting login info:', err);
        return { logins: [], defaultUsername: null };
    }
}

module.exports = {
    executeCommand,
    getSfdxConfigPath,
    findAliasForUsername,
    getLoginInfo
}; 