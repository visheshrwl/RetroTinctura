'use strict';

import * as vscode from 'vscode';

let codingSessionStartTime: number = 0;
let codingSessionEndTime: number = 0;
let totalCodingTime: number = 0;

export function activate(context: vscode.ExtensionContext) {
	const writeEmitter = new vscode.EventEmitter<string>();
	startCodingSession();
	const disposable = vscode.commands.registerCommand('helloworld.helloWorld', () => {
		let line = "";
		const pty = {
			onDidWrite: writeEmitter.event,
			open: () => writeEmitter.fire('Type and Press enter to echo the text\r\n\r\n'),
			close: () => {
				// noop
			},
			handleInput: (data: string) => {
				if(data === '\r'){
					writeEmitter.fire(`\r\necho: "${colorText(line)}"\r\n\n`);
					line = '';
					return;
				}
				if( data === "\x7f"){
					if(line.length === 0){
						return;
					} 
					line = line.substr(0, line.length -1);
					writeEmitter.fire('\x1b[D');
					writeEmitter.fire('\x1b[P');
					return;
				}
				line+=data;
				writeEmitter.fire(data);
			}
		};
		const terminal = vscode.window.createTerminal({
			name: `Terminal Extension VS Code`, pty
		});
		terminal.show();

		const editor = vscode.window.activeTextEditor;

		if(editor){
			const document = editor.document;
			const selection = editor.selection;

			const word = document.getText(selection);
			const reversed = word.split('').reverse().join('');
			editor.edit(editBuilder => {
				editBuilder.replace(selection, reversed);
			});
		}
	});

	context.subscriptions.push(disposable);
}

function startCodingSession() {
	codingSessionStartTime = Date.now();
}

function endCodingSession(){
	codingSessionEndTime = Date.now();
	totalCodingTime += codingSessionEndTime - codingSessionStartTime;
	totalCodingTime /= 6000;
}

function colorText(text: string): string {
	let output = '';
	let colorIndex = 1;
	for (let i = 0; i < text.length; i++) {
		const char = text.charAt(i);
		if (char === ' ' || char === '\r' || char === '\n') {
			output += char;
		} else {
			output += `\x1b[3${colorIndex++}m${text.charAt(i)}\x1b[0m`;
			if (colorIndex > 6) {
				colorIndex = 1;
			}
		}
	}
	return output;
}

export function deactivate() {
	endCodingSession();
	console.log(`Total Coding Time: ${totalCodingTime} minutes`);
}
