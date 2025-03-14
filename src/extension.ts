// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const selectFolderCommand = vscode.commands.registerCommand('tmdl-inspector.selectProjectFolder', async () => {
		const folderUri = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			title: 'Select TMDL Project Folder'
		});

		if (folderUri && folderUri[0]) {
			const selectedFolderPath = folderUri[0].fsPath;
			vscode.workspace.getConfiguration('tmdl-inspector').update('projectFolderPath', selectedFolderPath, vscode.ConfigurationTarget.Workspace);
			vscode.window.showInformationMessage(`TMDL project folder selected: ${selectedFolderPath}`);
		}
	});
	context.subscriptions.push(selectFolderCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
