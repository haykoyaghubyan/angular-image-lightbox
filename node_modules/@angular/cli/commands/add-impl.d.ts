import { SchematicCommand } from '../models/schematic-command';
export declare class AddCommand extends SchematicCommand {
    readonly allowPrivateSchematics: boolean;
    readonly packageManager: string;
    private _parseSchematicOptions;
    validate(options: any): boolean;
    run(options: any): Promise<number | void>;
    private isPackageInstalled;
    private executeSchematic;
    private findProjectVersion;
    private hasMismatchedPeer;
}
