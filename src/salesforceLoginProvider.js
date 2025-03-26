const vscode = require('vscode');
const { getLoginInfo } = require('./utils');

class SalesforceLoginProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }
}

module.exports = SalesforceLoginProvider; 