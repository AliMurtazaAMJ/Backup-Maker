import * as vscode from 'vscode';
import { MetadataService } from '../services/metadataService';
export declare class StatisticsWebview {
    panel: vscode.WebviewPanel;
    static currentPanel: StatisticsWebview | undefined;
    static createOrShow(extensionUri: vscode.Uri, metadataService: MetadataService): void;
    private constructor();
    private update;
    private computeStats;
    private getHtml;
}
