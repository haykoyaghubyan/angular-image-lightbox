"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// tslint:disable:no-global-tslint-disable no-any
const core_1 = require("@angular-devkit/core");
const node_1 = require("@angular-devkit/core/node");
const tools_1 = require("@angular-devkit/schematics/tools");
const path_1 = require("path");
const semver_1 = require("semver");
const command_runner_1 = require("../models/command-runner");
const schematic_command_1 = require("../models/schematic-command");
const config_1 = require("../utilities/config");
const package_metadata_1 = require("../utilities/package-metadata");
const npa = require('npm-package-arg');
class AddCommand extends schematic_command_1.SchematicCommand {
    constructor() {
        super(...arguments);
        this.allowPrivateSchematics = true;
        this.packageManager = config_1.getPackageManager();
    }
    _parseSchematicOptions(collectionName) {
        return __awaiter(this, void 0, void 0, function* () {
            const schematicOptions = yield this.getOptions({
                schematicName: 'ng-add',
                collectionName,
            });
            this.addOptions(schematicOptions);
            return command_runner_1.parseOptions(this._rawArgs, this.options);
        });
    }
    validate(options) {
        const collectionName = options._[0];
        if (!collectionName) {
            this.logger.fatal(`The "ng add" command requires a name argument to be specified eg. `
                + `${core_1.terminal.yellow('ng add [name] ')}. For more details, use "ng help".`);
            return false;
        }
        return true;
    }
    run(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const firstArg = options._[0];
            if (!firstArg) {
                this.logger.fatal(`The "ng add" command requires a name argument to be specified eg. `
                    + `${core_1.terminal.yellow('ng add [name] ')}. For more details, use "ng help".`);
                return 1;
            }
            let packageIdentifier;
            try {
                packageIdentifier = npa(options.collection);
            }
            catch (e) {
                this.logger.error(e.message);
                return 1;
            }
            if (packageIdentifier.registry && this.isPackageInstalled(packageIdentifier.name)) {
                // Already installed so just run schematic
                this.logger.info('Skipping installation: Package already installed');
                // Reparse the options with the new schematic accessible.
                options = yield this._parseSchematicOptions(packageIdentifier.name);
                return this.executeSchematic(packageIdentifier.name, options);
            }
            const usingYarn = this.packageManager === 'yarn';
            if (packageIdentifier.type === 'tag' && !packageIdentifier.rawSpec) {
                // only package name provided; search for viable version
                // plus special cases for packages that did not have peer deps setup
                let packageMetadata;
                try {
                    packageMetadata = yield package_metadata_1.fetchPackageMetadata(packageIdentifier.name, this.logger, { usingYarn });
                }
                catch (e) {
                    this.logger.error('Unable to fetch package metadata: ' + e.message);
                    return 1;
                }
                const latestManifest = packageMetadata.tags['latest'];
                if (latestManifest && Object.keys(latestManifest.peerDependencies).length === 0) {
                    if (latestManifest.name === '@angular/pwa') {
                        const version = yield this.findProjectVersion('@angular/cli');
                        // tslint:disable-next-line:no-any
                        const semverOptions = { includePrerelease: true };
                        if (version
                            && ((semver_1.validRange(version) && semver_1.intersects(version, '6', semverOptions))
                                || (semver_1.valid(version) && semver_1.satisfies(version, '6', semverOptions)))) {
                            packageIdentifier = npa.resolve('@angular/pwa', 'v6-lts');
                        }
                    }
                }
                else if (!latestManifest || (yield this.hasMismatchedPeer(latestManifest))) {
                    // 'latest' is invalid so search for most recent matching package
                    const versionManifests = Array.from(packageMetadata.versions.values())
                        .filter(value => !semver_1.prerelease(value.version));
                    versionManifests.sort((a, b) => semver_1.rcompare(a.version, b.version, true));
                    let newIdentifier;
                    for (const versionManifest of versionManifests) {
                        if (!(yield this.hasMismatchedPeer(versionManifest))) {
                            newIdentifier = npa.resolve(packageIdentifier.name, versionManifest.version);
                            break;
                        }
                    }
                    if (!newIdentifier) {
                        this.logger.warn('Unable to find compatible package.  Using \'latest\'.');
                    }
                    else {
                        packageIdentifier = newIdentifier;
                    }
                }
            }
            let collectionName = packageIdentifier.name;
            if (!packageIdentifier.registry) {
                try {
                    const manifest = yield package_metadata_1.fetchPackageManifest(packageIdentifier, this.logger, { usingYarn });
                    collectionName = manifest.name;
                    if (yield this.hasMismatchedPeer(manifest)) {
                        console.warn('Package has unmet peer dependencies. Adding the package may not succeed.');
                    }
                }
                catch (e) {
                    this.logger.error('Unable to fetch package manifest: ' + e.message);
                    return 1;
                }
            }
            const npmInstall = require('../tasks/npm-install').default;
            // We don't actually add the package to package.json, that would be the work of the package
            // itself.
            yield npmInstall(packageIdentifier.raw, this.logger, this.packageManager, this.project.root);
            // Reparse the options with the new schematic accessible.
            options = yield this._parseSchematicOptions(collectionName);
            return this.executeSchematic(collectionName, options);
        });
    }
    isPackageInstalled(name) {
        try {
            node_1.resolve(name, { checkLocal: true, basedir: this.project.root });
            return true;
        }
        catch (e) {
            if (!(e instanceof node_1.ModuleNotFoundException)) {
                throw e;
            }
        }
        return false;
    }
    executeSchematic(collectionName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const runOptions = {
                schematicOptions: options || [],
                workingDir: this.project.root,
                collectionName,
                schematicName: 'ng-add',
                allowPrivate: true,
                dryRun: false,
                force: false,
            };
            try {
                return yield this.runSchematic(runOptions);
            }
            catch (e) {
                if (e instanceof tools_1.NodePackageDoesNotSupportSchematics) {
                    this.logger.error(core_1.tags.oneLine `
          The package that you are trying to add does not support schematics. You can try using
          a different version of the package or contact the package author to add ng-add support.
        `);
                    return 1;
                }
                throw e;
            }
        });
    }
    findProjectVersion(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let installedPackage;
            try {
                installedPackage = node_1.resolve(name, { checkLocal: true, basedir: this.project.root, resolvePackageJson: true });
            }
            catch (_a) { }
            if (installedPackage) {
                try {
                    const installed = yield package_metadata_1.fetchPackageManifest(path_1.dirname(installedPackage), this.logger);
                    return installed.version;
                }
                catch (_b) { }
            }
            let projectManifest;
            try {
                projectManifest = yield package_metadata_1.fetchPackageManifest(this.project.root, this.logger);
            }
            catch (_c) { }
            if (projectManifest) {
                let version = projectManifest.dependencies[name];
                if (version) {
                    return version;
                }
                version = projectManifest.devDependencies[name];
                if (version) {
                    return version;
                }
            }
            return null;
        });
    }
    hasMismatchedPeer(manifest) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const peer in manifest.peerDependencies) {
                let peerIdentifier;
                try {
                    peerIdentifier = npa.resolve(peer, manifest.peerDependencies[peer]);
                }
                catch (_a) {
                    this.logger.warn(`Invalid peer dependency ${peer} found in package.`);
                    continue;
                }
                if (peerIdentifier.type === 'version' || peerIdentifier.type === 'range') {
                    try {
                        const version = yield this.findProjectVersion(peer);
                        if (!version) {
                            continue;
                        }
                        // tslint:disable-next-line:no-any
                        const options = { includePrerelease: true };
                        if (!semver_1.intersects(version, peerIdentifier.rawSpec, options)
                            && !semver_1.satisfies(version, peerIdentifier.rawSpec, options)) {
                            return true;
                        }
                    }
                    catch (_b) {
                        // Not found or invalid so ignore
                        continue;
                    }
                }
                else {
                    // type === 'tag' | 'file' | 'directory' | 'remote' | 'git'
                    // Cannot accurately compare these as the tag/location may have changed since install
                }
            }
            return false;
        });
    }
}
exports.AddCommand = AddCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkLWltcGwuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvY2xpL2NvbW1hbmRzL2FkZC1pbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQTs7Ozs7O0dBTUc7QUFDSCxpREFBaUQ7QUFDakQsK0NBQXNEO0FBQ3RELG9EQUE2RTtBQUM3RSw0REFBdUY7QUFDdkYsK0JBQStCO0FBQy9CLG1DQUF3RjtBQUN4Riw2REFBd0Q7QUFDeEQsbUVBQStEO0FBRS9ELGdEQUF3RDtBQUN4RCxvRUFJdUM7QUFFdkMsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFFdkMsZ0JBQXdCLFNBQVEsb0NBQWdCO0lBQWhEOztRQUNXLDJCQUFzQixHQUFHLElBQUksQ0FBQztRQUM5QixtQkFBYyxHQUFHLDBCQUFpQixFQUFFLENBQUM7SUE0UWhELENBQUM7SUExUWUsc0JBQXNCLENBQUMsY0FBc0I7O1lBQ3pELE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUM3QyxhQUFhLEVBQUUsUUFBUTtnQkFDdkIsY0FBYzthQUNmLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUVsQyxPQUFPLDZCQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkQsQ0FBQztLQUFBO0lBRUQsUUFBUSxDQUFDLE9BQVk7UUFDbkIsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVwQyxJQUFJLENBQUMsY0FBYyxFQUFFO1lBQ25CLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUNmLG9FQUFvRTtrQkFDbEUsR0FBRyxlQUFRLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLG9DQUFvQyxDQUMzRSxDQUFDO1lBRUYsT0FB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QUMsSUFBSSxDQUFDLENBQUM7d0JBQ3BELElBQUksQ0FBQyxPQUFPLEVBQUU7NEJBQ1osU0FBUzt5QkFDVjt3QkFFRCxrQ0FBa0M7d0JBQ2xDLE1BQU0sT0FBTyxHQUFHLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFTLENBQUM7d0JBRW5ELElBQUksQ0FBQyxtQkFBVSxDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQzsrQkFDbEQsQ0FBQyxrQkFBUyxDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUFFOzRCQUMzRCxPQUFPLElBQUksQ0FBQzt5QkFDYjtxQkFDRjtvQkFBQyxXQUFNO3dCQUNOLGlDQUFpQzt3QkFDakMsU0FBUztxQkFDVjtpQkFDRjtxQkFBTTtvQkFDTCwyREFBMkQ7b0JBQzNELHFGQUFxRjtpQkFDdEY7YUFFRjtZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQztLQUFBO0NBQ0Y7QUE5UUQsZ0NBOFFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuLy8gdHNsaW50OmRpc2FibGU6bm8tZ2xvYmFsLXRzbGludC1kaXNhYmxlIG5vLWFueVxuaW1wb3J0IHsgdGFncywgdGVybWluYWwgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBNb2R1bGVOb3RGb3VuZEV4Y2VwdGlvbiwgcmVzb2x2ZSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlL25vZGUnO1xuaW1wb3J0IHsgTm9kZVBhY2thZ2VEb2VzTm90U3VwcG9ydFNjaGVtYXRpY3MgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90b29scyc7XG5pbXBvcnQgeyBkaXJuYW1lIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBpbnRlcnNlY3RzLCBwcmVyZWxlYXNlLCByY29tcGFyZSwgc2F0aXNmaWVzLCB2YWxpZCwgdmFsaWRSYW5nZSB9IGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgeyBwYXJzZU9wdGlvbnMgfSBmcm9tICcuLi9tb2RlbHMvY29tbWFuZC1ydW5uZXInO1xuaW1wb3J0IHsgU2NoZW1hdGljQ29tbWFuZCB9IGZyb20gJy4uL21vZGVscy9zY2hlbWF0aWMtY29tbWFuZCc7XG5pbXBvcnQgeyBOcG1JbnN0YWxsIH0gZnJvbSAnLi4vdGFza3MvbnBtLWluc3RhbGwnO1xuaW1wb3J0IHsgZ2V0UGFja2FnZU1hbmFnZXIgfSBmcm9tICcuLi91dGlsaXRpZXMvY29uZmlnJztcbmltcG9ydCB7XG4gIFBhY2thZ2VNYW5pZmVzdCxcbiAgZmV0Y2hQYWNrYWdlTWFuaWZlc3QsXG4gIGZldGNoUGFja2FnZU1ldGFkYXRhLFxufSBmcm9tICcuLi91dGlsaXRpZXMvcGFja2FnZS1tZXRhZGF0YSc7XG5cbmNvbnN0IG5wYSA9IHJlcXVpcmUoJ25wbS1wYWNrYWdlLWFyZycpO1xuXG5leHBvcnQgY2xhc3MgQWRkQ29tbWFuZCBleHRlbmRzIFNjaGVtYXRpY0NvbW1hbmQge1xuICByZWFkb25seSBhbGxvd1ByaXZhdGVTY2hlbWF0aWNzID0gdHJ1ZTtcbiAgcmVhZG9ubHkgcGFja2FnZU1hbmFnZXIgPSBnZXRQYWNrYWdlTWFuYWdlcigpO1xuXG4gIHByaXZhdGUgYXN5bmMgX3BhcnNlU2NoZW1hdGljT3B0aW9ucyhjb2xsZWN0aW9uTmFtZTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCBzY2hlbWF0aWNPcHRpb25zID0gYXdhaXQgdGhpcy5nZXRPcHRpb25zKHtcbiAgICAgIHNjaGVtYXRpY05hbWU6ICduZy1hZGQnLFxuICAgICAgY29sbGVjdGlvbk5hbWUsXG4gICAgfSk7XG4gICAgdGhpcy5hZGRPcHRpb25zKHNjaGVtYXRpY09wdGlvbnMpO1xuXG4gICAgcmV0dXJuIHBhcnNlT3B0aW9ucyh0aGlzLl9yYXdBcmdzLCB0aGlzLm9wdGlvbnMpO1xuICB9XG5cbiAgdmFsaWRhdGUob3B0aW9uczogYW55KSB7XG4gICAgY29uc3QgY29sbGVjdGlvbk5hbWUgPSBvcHRpb25zLl9bMF07XG5cbiAgICBpZiAoIWNvbGxlY3Rpb25OYW1lKSB7XG4gICAgICB0aGlzLmxvZ2dlci5mYXRhbChcbiAgICAgICAgYFRoZSBcIm5nIGFkZFwiIGNvbW1hbmQgcmVxdWlyZXMgYSBuYW1lIGFyZ3VtZW50IHRvIGJlIHNwZWNpZmllZCBlZy4gYFxuICAgICAgICArIGAke3Rlcm1pbmFsLnllbGxvdygnbmcgYWRkIFtuYW1lXSAnKX0uIEZvciBtb3JlIGRldGFpbHMsIHVzZSBcIm5nIGhlbHBcIi5gLFxuICAgICAgKTtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXN5bmMgcnVuKG9wdGlvbnM6IGFueSkge1xuICAgIGNvbnN0IGZpcnN0QXJnID0gb3B0aW9ucy5fWzBdO1xuXG4gICAgaWYgKCFmaXJzdEFyZykge1xuICAgICAgdGhpcy5sb2dnZXIuZmF0YWwoXG4gICAgICAgIGBUaGUgXCJuZyBhZGRcIiBjb21tYW5kIHJlcXVpcmVzIGEgbmFtZSBhcmd1bWVudCB0byBiZSBzcGVjaWZpZWQgZWcuIGBcbiAgICAgICAgKyBgJHt0ZXJtaW5hbC55ZWxsb3coJ25nIGFkZCBbbmFtZV0gJyl9LiBGb3IgbW9yZSBkZXRhaWxzLCB1c2UgXCJuZyBoZWxwXCIuYCxcbiAgICAgICk7XG5cbiAgICAgIHJldHVybiAxO1xuICAgIH1cblxuICAgIGxldCBwYWNrYWdlSWRlbnRpZmllcjtcbiAgICB0cnkge1xuICAgICAgcGFja2FnZUlkZW50aWZpZXIgPSBucGEob3B0aW9ucy5jb2xsZWN0aW9uKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcihlLm1lc3NhZ2UpO1xuXG4gICAgICByZXR1cm4gMTtcbiAgICB9XG5cbiAgICBpZiAocGFja2FnZUlkZW50aWZpZXIucmVnaXN0cnkgJiYgdGhpcy5pc1BhY2thZ2VJbnN0YWxsZWQocGFja2FnZUlkZW50aWZpZXIubmFtZSkpIHtcbiAgICAgIC8vIEFscmVhZHkgaW5zdGFsbGVkIHNvIGp1c3QgcnVuIHNjaGVtYXRpY1xuICAgICAgdGhpcy5sb2dnZXIuaW5mbygnU2tpcHBpbmcgaW5zdGFsbGF0aW9uOiBQYWNrYWdlIGFscmVhZHkgaW5zdGFsbGVkJyk7XG5cbiAgICAgIC8vIFJlcGFyc2UgdGhlIG9wdGlvbnMgd2l0aCB0aGUgbmV3IHNjaGVtYXRpYyBhY2Nlc3NpYmxlLlxuICAgICAgb3B0aW9ucyA9IGF3YWl0IHRoaXMuX3BhcnNlU2NoZW1hdGljT3B0aW9ucyhwYWNrYWdlSWRlbnRpZmllci5uYW1lKTtcblxuICAgICAgcmV0dXJuIHRoaXMuZXhlY3V0ZVNjaGVtYXRpYyhwYWNrYWdlSWRlbnRpZmllci5uYW1lLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBjb25zdCB1c2luZ1lhcm4gPSB0aGlzLnBhY2thZ2VNYW5hZ2VyID09PSAneWFybic7XG5cbiAgICBpZiAocGFja2FnZUlkZW50aWZpZXIudHlwZSA9PT0gJ3RhZycgJiYgIXBhY2thZ2VJZGVudGlmaWVyLnJhd1NwZWMpIHtcbiAgICAgIC8vIG9ubHkgcGFja2FnZSBuYW1lIHByb3ZpZGVkOyBzZWFyY2ggZm9yIHZpYWJsZSB2ZXJzaW9uXG4gICAgICAvLyBwbHVzIHNwZWNpYWwgY2FzZXMgZm9yIHBhY2thZ2VzIHRoYXQgZGlkIG5vdCBoYXZlIHBlZXIgZGVwcyBzZXR1cFxuICAgICAgbGV0IHBhY2thZ2VNZXRhZGF0YTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHBhY2thZ2VNZXRhZGF0YSA9IGF3YWl0IGZldGNoUGFja2FnZU1ldGFkYXRhKFxuICAgICAgICAgIHBhY2thZ2VJZGVudGlmaWVyLm5hbWUsXG4gICAgICAgICAgdGhpcy5sb2dnZXIsXG4gICAgICAgICAgeyB1c2luZ1lhcm4gfSxcbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ1VuYWJsZSB0byBmZXRjaCBwYWNrYWdlIG1ldGFkYXRhOiAnICsgZS5tZXNzYWdlKTtcblxuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGF0ZXN0TWFuaWZlc3QgPSBwYWNrYWdlTWV0YWRhdGEudGFnc1snbGF0ZXN0J107XG4gICAgICBpZiAobGF0ZXN0TWFuaWZlc3QgJiYgT2JqZWN0LmtleXMobGF0ZXN0TWFuaWZlc3QucGVlckRlcGVuZGVuY2llcykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGlmIChsYXRlc3RNYW5pZmVzdC5uYW1lID09PSAnQGFuZ3VsYXIvcHdhJykge1xuICAgICAgICAgIGNvbnN0IHZlcnNpb24gPSBhd2FpdCB0aGlzLmZpbmRQcm9qZWN0VmVyc2lvbignQGFuZ3VsYXIvY2xpJyk7XG4gICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgICAgICAgIGNvbnN0IHNlbXZlck9wdGlvbnMgPSB7IGluY2x1ZGVQcmVyZWxlYXNlOiB0cnVlIH0gYXMgYW55O1xuXG4gICAgICAgICAgaWYgKHZlcnNpb25cbiAgICAgICAgICAgICAgJiYgKCh2YWxpZFJhbmdlKHZlcnNpb24pICYmIGludGVyc2VjdHModmVyc2lvbiwgJzYnLCBzZW12ZXJPcHRpb25zKSlcbiAgICAgICAgICAgICAgICAgIHx8ICh2YWxpZCh2ZXJzaW9uKSAmJiBzYXRpc2ZpZXModmVyc2lvbiwgJzYnLCBzZW12ZXJPcHRpb25zKSkpKSB7XG4gICAgICAgICAgICBwYWNrYWdlSWRlbnRpZmllciA9IG5wYS5yZXNvbHZlKCdAYW5ndWxhci9wd2EnLCAndjYtbHRzJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFsYXRlc3RNYW5pZmVzdCB8fCAoYXdhaXQgdGhpcy5oYXNNaXNtYXRjaGVkUGVlcihsYXRlc3RNYW5pZmVzdCkpKSB7XG4gICAgICAgIC8vICdsYXRlc3QnIGlzIGludmFsaWQgc28gc2VhcmNoIGZvciBtb3N0IHJlY2VudCBtYXRjaGluZyBwYWNrYWdlXG4gICAgICAgIGNvbnN0IHZlcnNpb25NYW5pZmVzdHMgPSBBcnJheS5mcm9tKHBhY2thZ2VNZXRhZGF0YS52ZXJzaW9ucy52YWx1ZXMoKSlcbiAgICAgICAgICAuZmlsdGVyKHZhbHVlID0+ICFwcmVyZWxlYXNlKHZhbHVlLnZlcnNpb24pKTtcblxuICAgICAgICB2ZXJzaW9uTWFuaWZlc3RzLnNvcnQoKGEsIGIpID0+IHJjb21wYXJlKGEudmVyc2lvbiwgYi52ZXJzaW9uLCB0cnVlKSk7XG5cbiAgICAgICAgbGV0IG5ld0lkZW50aWZpZXI7XG4gICAgICAgIGZvciAoY29uc3QgdmVyc2lvbk1hbmlmZXN0IG9mIHZlcnNpb25NYW5pZmVzdHMpIHtcbiAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmhhc01pc21hdGNoZWRQZWVyKHZlcnNpb25NYW5pZmVzdCkpKSB7XG4gICAgICAgICAgICBuZXdJZGVudGlmaWVyID0gbnBhLnJlc29sdmUocGFja2FnZUlkZW50aWZpZXIubmFtZSwgdmVyc2lvbk1hbmlmZXN0LnZlcnNpb24pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFuZXdJZGVudGlmaWVyKSB7XG4gICAgICAgICAgdGhpcy5sb2dnZXIud2FybignVW5hYmxlIHRvIGZpbmQgY29tcGF0aWJsZSBwYWNrYWdlLiAgVXNpbmcgXFwnbGF0ZXN0XFwnLicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBhY2thZ2VJZGVudGlmaWVyID0gbmV3SWRlbnRpZmllcjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBjb2xsZWN0aW9uTmFtZSA9IHBhY2thZ2VJZGVudGlmaWVyLm5hbWU7XG4gICAgaWYgKCFwYWNrYWdlSWRlbnRpZmllci5yZWdpc3RyeSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgbWFuaWZlc3QgPSBhd2FpdCBmZXRjaFBhY2thZ2VNYW5pZmVzdChcbiAgICAgICAgICBwYWNrYWdlSWRlbnRpZmllcixcbiAgICAgICAgICB0aGlzLmxvZ2dlcixcbiAgICAgICAgICB7IHVzaW5nWWFybiB9LFxuICAgICAgICApO1xuXG4gICAgICAgIGNvbGxlY3Rpb25OYW1lID0gbWFuaWZlc3QubmFtZTtcblxuICAgICAgICBpZiAoYXdhaXQgdGhpcy5oYXNNaXNtYXRjaGVkUGVlcihtYW5pZmVzdCkpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ1BhY2thZ2UgaGFzIHVubWV0IHBlZXIgZGVwZW5kZW5jaWVzLiBBZGRpbmcgdGhlIHBhY2thZ2UgbWF5IG5vdCBzdWNjZWVkLicpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdVbmFibGUgdG8gZmV0Y2ggcGFja2FnZSBtYW5pZmVzdDogJyArIGUubWVzc2FnZSk7XG5cbiAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbnBtSW5zdGFsbDogTnBtSW5zdGFsbCA9IHJlcXVpcmUoJy4uL3Rhc2tzL25wbS1pbnN0YWxsJykuZGVmYXVsdDtcblxuICAgIC8vIFdlIGRvbid0IGFjdHVhbGx5IGFkZCB0aGUgcGFja2FnZSB0byBwYWNrYWdlLmpzb24sIHRoYXQgd291bGQgYmUgdGhlIHdvcmsgb2YgdGhlIHBhY2thZ2VcbiAgICAvLyBpdHNlbGYuXG4gICAgYXdhaXQgbnBtSW5zdGFsbChcbiAgICAgIHBhY2thZ2VJZGVudGlmaWVyLnJhdyxcbiAgICAgIHRoaXMubG9nZ2VyLFxuICAgICAgdGhpcy5wYWNrYWdlTWFuYWdlcixcbiAgICAgIHRoaXMucHJvamVjdC5yb290LFxuICAgICk7XG5cbiAgICAvLyBSZXBhcnNlIHRoZSBvcHRpb25zIHdpdGggdGhlIG5ldyBzY2hlbWF0aWMgYWNjZXNzaWJsZS5cbiAgICBvcHRpb25zID0gYXdhaXQgdGhpcy5fcGFyc2VTY2hlbWF0aWNPcHRpb25zKGNvbGxlY3Rpb25OYW1lKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWN1dGVTY2hlbWF0aWMoY29sbGVjdGlvbk5hbWUsIG9wdGlvbnMpO1xuICB9XG5cbiAgcHJpdmF0ZSBpc1BhY2thZ2VJbnN0YWxsZWQobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgdHJ5IHtcbiAgICAgIHJlc29sdmUobmFtZSwgeyBjaGVja0xvY2FsOiB0cnVlLCBiYXNlZGlyOiB0aGlzLnByb2plY3Qucm9vdCB9KTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIE1vZHVsZU5vdEZvdW5kRXhjZXB0aW9uKSkge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZVNjaGVtYXRpYyhcbiAgICBjb2xsZWN0aW9uTmFtZTogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiBzdHJpbmdbXSxcbiAgKTogUHJvbWlzZTxudW1iZXIgfCB2b2lkPiB7XG4gICAgY29uc3QgcnVuT3B0aW9ucyA9IHtcbiAgICAgIHNjaGVtYXRpY09wdGlvbnM6IG9wdGlvbnMgfHwgW10sXG4gICAgICB3b3JraW5nRGlyOiB0aGlzLnByb2plY3Qucm9vdCxcbiAgICAgIGNvbGxlY3Rpb25OYW1lLFxuICAgICAgc2NoZW1hdGljTmFtZTogJ25nLWFkZCcsXG4gICAgICBhbGxvd1ByaXZhdGU6IHRydWUsXG4gICAgICBkcnlSdW46IGZhbHNlLFxuICAgICAgZm9yY2U6IGZhbHNlLFxuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucnVuU2NoZW1hdGljKHJ1bk9wdGlvbnMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTm9kZVBhY2thZ2VEb2VzTm90U3VwcG9ydFNjaGVtYXRpY3MpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IodGFncy5vbmVMaW5lYFxuICAgICAgICAgIFRoZSBwYWNrYWdlIHRoYXQgeW91IGFyZSB0cnlpbmcgdG8gYWRkIGRvZXMgbm90IHN1cHBvcnQgc2NoZW1hdGljcy4gWW91IGNhbiB0cnkgdXNpbmdcbiAgICAgICAgICBhIGRpZmZlcmVudCB2ZXJzaW9uIG9mIHRoZSBwYWNrYWdlIG9yIGNvbnRhY3QgdGhlIHBhY2thZ2UgYXV0aG9yIHRvIGFkZCBuZy1hZGQgc3VwcG9ydC5cbiAgICAgICAgYCk7XG5cbiAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG5cbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBmaW5kUHJvamVjdFZlcnNpb24obmFtZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gICAgbGV0IGluc3RhbGxlZFBhY2thZ2U7XG4gICAgdHJ5IHtcbiAgICAgIGluc3RhbGxlZFBhY2thZ2UgPSByZXNvbHZlKFxuICAgICAgICBuYW1lLFxuICAgICAgICB7IGNoZWNrTG9jYWw6IHRydWUsIGJhc2VkaXI6IHRoaXMucHJvamVjdC5yb290LCByZXNvbHZlUGFja2FnZUpzb246IHRydWUgfSxcbiAgICAgICk7XG4gICAgfSBjYXRjaCB7IH1cblxuICAgIGlmIChpbnN0YWxsZWRQYWNrYWdlKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBpbnN0YWxsZWQgPSBhd2FpdCBmZXRjaFBhY2thZ2VNYW5pZmVzdChkaXJuYW1lKGluc3RhbGxlZFBhY2thZ2UpLCB0aGlzLmxvZ2dlcik7XG5cbiAgICAgICAgcmV0dXJuIGluc3RhbGxlZC52ZXJzaW9uO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH1cblxuICAgIGxldCBwcm9qZWN0TWFuaWZlc3Q7XG4gICAgdHJ5IHtcbiAgICAgIHByb2plY3RNYW5pZmVzdCA9IGF3YWl0IGZldGNoUGFja2FnZU1hbmlmZXN0KHRoaXMucHJvamVjdC5yb290LCB0aGlzLmxvZ2dlcik7XG4gICAgfSBjYXRjaCB7fVxuXG4gICAgaWYgKHByb2plY3RNYW5pZmVzdCkge1xuICAgICAgbGV0IHZlcnNpb24gPSBwcm9qZWN0TWFuaWZlc3QuZGVwZW5kZW5jaWVzW25hbWVdO1xuICAgICAgaWYgKHZlcnNpb24pIHtcbiAgICAgICAgcmV0dXJuIHZlcnNpb247XG4gICAgICB9XG5cbiAgICAgIHZlcnNpb24gPSBwcm9qZWN0TWFuaWZlc3QuZGV2RGVwZW5kZW5jaWVzW25hbWVdO1xuICAgICAgaWYgKHZlcnNpb24pIHtcbiAgICAgICAgcmV0dXJuIHZlcnNpb247XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGhhc01pc21hdGNoZWRQZWVyKG1hbmlmZXN0OiBQYWNrYWdlTWFuaWZlc3QpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBmb3IgKGNvbnN0IHBlZXIgaW4gbWFuaWZlc3QucGVlckRlcGVuZGVuY2llcykge1xuICAgICAgbGV0IHBlZXJJZGVudGlmaWVyO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcGVlcklkZW50aWZpZXIgPSBucGEucmVzb2x2ZShwZWVyLCBtYW5pZmVzdC5wZWVyRGVwZW5kZW5jaWVzW3BlZXJdKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBJbnZhbGlkIHBlZXIgZGVwZW5kZW5jeSAke3BlZXJ9IGZvdW5kIGluIHBhY2thZ2UuYCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAocGVlcklkZW50aWZpZXIudHlwZSA9PT0gJ3ZlcnNpb24nIHx8IHBlZXJJZGVudGlmaWVyLnR5cGUgPT09ICdyYW5nZScpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB2ZXJzaW9uID0gYXdhaXQgdGhpcy5maW5kUHJvamVjdFZlcnNpb24ocGVlcik7XG4gICAgICAgICAgaWYgKCF2ZXJzaW9uKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHsgaW5jbHVkZVByZXJlbGVhc2U6IHRydWUgfSBhcyBhbnk7XG5cbiAgICAgICAgICBpZiAoIWludGVyc2VjdHModmVyc2lvbiwgcGVlcklkZW50aWZpZXIucmF3U3BlYywgb3B0aW9ucylcbiAgICAgICAgICAgICAgJiYgIXNhdGlzZmllcyh2ZXJzaW9uLCBwZWVySWRlbnRpZmllci5yYXdTcGVjLCBvcHRpb25zKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAvLyBOb3QgZm91bmQgb3IgaW52YWxpZCBzbyBpZ25vcmVcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdHlwZSA9PT0gJ3RhZycgfCAnZmlsZScgfCAnZGlyZWN0b3J5JyB8ICdyZW1vdGUnIHwgJ2dpdCdcbiAgICAgICAgLy8gQ2Fubm90IGFjY3VyYXRlbHkgY29tcGFyZSB0aGVzZSBhcyB0aGUgdGFnL2xvY2F0aW9uIG1heSBoYXZlIGNoYW5nZWQgc2luY2UgaW5zdGFsbFxuICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG4iXX0=