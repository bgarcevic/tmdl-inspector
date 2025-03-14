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
 
 	const scanWorkspaceCommand = vscode.commands.registerCommand('tmdl-inspector.scanWorkspace', async () => {
 		const workspaceFolders = vscode.workspace.workspaceFolders;
 		if (!workspaceFolders) {
 			vscode.window.showInformationMessage('No workspace folder opened.');
 			return;
 		}
 
 		const outputChannel = vscode.window.createOutputChannel('TMDL File Scan');
 		outputChannel.clear();
 		outputChannel.show(true);
 		outputChannel.appendLine('Scanning workspace for .tmdl files...');
 
 		const tmdlFiles = await vscode.workspace.findFiles('**/*.tmdl');
 		if (tmdlFiles.length === 0) {
 			outputChannel.appendLine('No .tmdl files found in the workspace.');
 		} else {
 			outputChannel.appendLine('.tmdl files found:');
 			tmdlFiles.forEach(file => {
 				outputChannel.appendLine(`- ${file.fsPath}`);
 			});
 		}
 	});
 	context.subscriptions.push(scanWorkspaceCommand);
 }

// This method is called when your extension is deactivated
export function deactivate() {}
