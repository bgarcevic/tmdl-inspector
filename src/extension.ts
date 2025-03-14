// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const isTmdlFile = (editor: vscode.TextEditor | undefined): boolean => {
	if (editor && editor.document) {
		return editor.document.fileName.endsWith('.tmdl');
	}
	return false;
}

const findTmdlRoot = (currentPath: string): string | null => {
	let depth = 0;
	let currentDir = path.dirname(currentPath);

	while (depth < 4 && currentDir !== path.parse(currentDir).root) {
		const hasDatabase = fs.existsSync(path.join(currentDir, 'database.tmdl'));
		const hasModel = fs.existsSync(path.join(currentDir, 'model.tmdl'));

		if (hasDatabase && hasModel) {
			return currentDir;
		}

		currentDir = path.dirname(currentDir);
		depth++;
	}
	return null;
};

const indexTmdlFiles = (rootPath: string): string[] => {
	const tmdlFiles: string[] = [];
	const outputChannel = vscode.window.createOutputChannel('TMDL File Index');


	const walk = (dir: string) => {
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(fullPath);
			} else if (entry.isFile() && entry.name.endsWith('.tmdl')) {
				tmdlFiles.push(fullPath);
			}
		}
	};

	walk(rootPath);
	// Log the result to the output channel
	outputChannel.clear();
	outputChannel.appendLine('Indexed .tmdl files:');
	tmdlFiles.forEach(file => outputChannel.appendLine(file));
	outputChannel.show(true);
	return tmdlFiles;
};

interface ValidationResult {
	isValid: boolean;
	missingFiles: string[];
	errors: string[];
}


const validateStructure = (tmdlFiles: string[]): ValidationResult => {
	const result: ValidationResult = {
		isValid: true,
		missingFiles: [],
		errors: []
	};

	const hasDatabase = tmdlFiles.some(file => path.basename(file) === 'database.tmdl');
	const hasModel = tmdlFiles.some(file => path.basename(file) === 'model.tmdl');

	if (!hasDatabase) {
		result.isValid = false;
		result.errors.push('Missing database.tmdl');
	}
	if (!hasModel) {
		result.isValid = false;
		result.errors.push('Missing model.tmdl');
	}

	return result;
};

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

	const validationChannel = vscode.window.createOutputChannel('TMDL Structure Validation');

	const showValidation = (result: ValidationResult) => {
		validationChannel.clear();

		if (result.errors.length > 0) {
			result.errors.forEach(error => validationChannel.appendLine(`[ERROR] ${error}`));
		}

		if (result.isValid) {
			validationChannel.appendLine('TMDL structure is valid.');
		}

		validationChannel.show(true);
	};

	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (!editor) return;
		if (!isTmdlFile(editor)) return;

		const rootPath = findTmdlRoot(editor.document.fileName);
		if (!rootPath) {
			vscode.window.showWarningMessage(
				`No TMDL root folder found for ${path.basename(editor.document.fileName)}`
			);
			return;
		}

		const tmdlFiles = indexTmdlFiles(rootPath);
		const validationResult = validateStructure(tmdlFiles);
		showValidation(validationResult);
	});

	vscode.workspace.onDidSaveTextDocument(document => {
		const editor = vscode.window.visibleTextEditors.find(e => e.document === document);
		if (!editor || !isTmdlFile(editor)) return;

		const rootPath = findTmdlRoot(editor.document.fileName);
		if (!rootPath) {
			vscode.window.showWarningMessage(
				`No TMDL root folder found for ${path.basename(editor.document.fileName)}`
			);
			return;
		}

		const tmdlFiles = indexTmdlFiles(rootPath);
		const validationResult = validateStructure(tmdlFiles);
		showValidation(validationResult);
	});

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
export function deactivate() { }



