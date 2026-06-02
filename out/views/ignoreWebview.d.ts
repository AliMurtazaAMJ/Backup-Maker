import * as vscode from 'vscode';
import { IgnoreService } from '../services/ignoreService';
export declare class IgnoreWebview {
    panel: vscode.WebviewPanel;
    static currentPanel: IgnoreWebview | undefined;
    static createOrShow(extensionUri: vscode.Uri, ignoreService: IgnoreService): Promise<void>;
    private constructor();
    private refresh;
    private getNonce;
    private getHtml;
}
