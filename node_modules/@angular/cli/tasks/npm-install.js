"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const child_process_1 = require("child_process");
function default_1(packageName, logger, packageManager, projectRoot, save = true) {
    return __awaiter(this, void 0, void 0, function* () {
        const installArgs = [];
        switch (packageManager) {
            case 'cnpm':
            case 'npm':
                installArgs.push('install', '--quiet');
                break;
            case 'yarn':
                installArgs.push('add');
                break;
            default:
                packageManager = 'npm';
                installArgs.push('install', '--quiet');
                break;
        }
        logger.info(core_1.terminal.green(`Installing packages for tooling via ${packageManager}.`));
        if (packageName) {
            installArgs.push(packageName);
        }
        if (!save) {
            installArgs.push('--no-save');
        }
        const installOptions = {
            stdio: 'inherit',
            shell: true,
        };
        yield new Promise((resolve, reject) => {
            child_process_1.spawn(packageManager, installArgs, installOptions)
                .on('close', (code) => {
                if (code === 0) {
                    logger.info(core_1.terminal.green(`Installed packages for tooling via ${packageManager}.`));
                    resolve();
                }
                else {
                    const message = 'Package install failed, see above.';
                    logger.info(core_1.terminal.red(message));
                    reject(message);
                }
            });
        });
    });
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnBtLWluc3RhbGwuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvY2xpL3Rhc2tzL25wbS1pbnN0YWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7QUFFSCwrQ0FBeUQ7QUFDekQsaURBQXNDO0FBU3RDLG1CQUErQixXQUFtQixFQUNuQixNQUFzQixFQUN0QixjQUFzQixFQUN0QixXQUFtQixFQUNuQixJQUFJLEdBQUcsSUFBSTs7UUFDeEMsTUFBTSxXQUFXLEdBQWEsRUFBRSxDQUFDO1FBQ2pDLFFBQVEsY0FBYyxFQUFFO1lBQ3RCLEtBQUssTUFBTSxDQUFDO1lBQ1osS0FBSyxLQUFLO2dCQUNSLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN2QyxNQUFNO1lBRVIsS0FBSyxNQUFNO2dCQUNULFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3hCLE1BQU07WUFFUjtnQkFDRSxjQUFjLEdBQUcsS0FBSyxDQUFDO2dCQUN2QixXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDdkMsTUFBTTtTQUNUO1FBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFRLENBQUMsS0FBSyxDQUFDLHVDQUF1QyxjQUFjLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFFdEYsSUFBSSxXQUFXLEVBQUU7WUFDZixXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQy9CO1FBRUQsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNULFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDL0I7UUFDRCxNQUFNLGNBQWMsR0FBRztZQUNyQixLQUFLLEVBQUUsU0FBUztZQUNoQixLQUFLLEVBQUUsSUFBSTtTQUNaLENBQUM7UUFFRixNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3BDLHFCQUFLLENBQUMsY0FBYyxFQUFFLFdBQVcsRUFBRSxjQUFjLENBQUM7aUJBQy9DLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFZLEVBQUUsRUFBRTtnQkFDNUIsSUFBSSxJQUFJLEtBQUssQ0FBQyxFQUFFO29CQUNkLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBUSxDQUFDLEtBQUssQ0FBQyxzQ0FBc0MsY0FBYyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNyRixPQUFPLEVBQUUsQ0FBQztpQkFDWDtxQkFBTTtvQkFDTCxNQUFNLE9BQU8sR0FBRyxvQ0FBb0MsQ0FBQztvQkFDckQsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7b0JBQ25DLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDakI7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUFBO0FBakRELDRCQWlEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgbG9nZ2luZywgdGVybWluYWwgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuXG5cbmV4cG9ydCB0eXBlIE5wbUluc3RhbGwgPSAocGFja2FnZU5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGFja2FnZU1hbmFnZXI6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvamVjdFJvb3Q6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZT86IGJvb2xlYW4pID0+IFByb21pc2U8dm9pZD47XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIChwYWNrYWdlTmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFja2FnZU1hbmFnZXI6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0Um9vdDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhdmUgPSB0cnVlKSB7XG4gIGNvbnN0IGluc3RhbGxBcmdzOiBzdHJpbmdbXSA9IFtdO1xuICBzd2l0Y2ggKHBhY2thZ2VNYW5hZ2VyKSB7XG4gICAgY2FzZSAnY25wbSc6XG4gICAgY2FzZSAnbnBtJzpcbiAgICAgIGluc3RhbGxBcmdzLnB1c2goJ2luc3RhbGwnLCAnLS1xdWlldCcpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICd5YXJuJzpcbiAgICAgIGluc3RhbGxBcmdzLnB1c2goJ2FkZCcpO1xuICAgICAgYnJlYWs7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgcGFja2FnZU1hbmFnZXIgPSAnbnBtJztcbiAgICAgIGluc3RhbGxBcmdzLnB1c2goJ2luc3RhbGwnLCAnLS1xdWlldCcpO1xuICAgICAgYnJlYWs7XG4gIH1cblxuICBsb2dnZXIuaW5mbyh0ZXJtaW5hbC5ncmVlbihgSW5zdGFsbGluZyBwYWNrYWdlcyBmb3IgdG9vbGluZyB2aWEgJHtwYWNrYWdlTWFuYWdlcn0uYCkpO1xuXG4gIGlmIChwYWNrYWdlTmFtZSkge1xuICAgIGluc3RhbGxBcmdzLnB1c2gocGFja2FnZU5hbWUpO1xuICB9XG5cbiAgaWYgKCFzYXZlKSB7XG4gICAgaW5zdGFsbEFyZ3MucHVzaCgnLS1uby1zYXZlJyk7XG4gIH1cbiAgY29uc3QgaW5zdGFsbE9wdGlvbnMgPSB7XG4gICAgc3RkaW86ICdpbmhlcml0JyxcbiAgICBzaGVsbDogdHJ1ZSxcbiAgfTtcblxuICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgc3Bhd24ocGFja2FnZU1hbmFnZXIsIGluc3RhbGxBcmdzLCBpbnN0YWxsT3B0aW9ucylcbiAgICAgIC5vbignY2xvc2UnLCAoY29kZTogbnVtYmVyKSA9PiB7XG4gICAgICAgIGlmIChjb2RlID09PSAwKSB7XG4gICAgICAgICAgbG9nZ2VyLmluZm8odGVybWluYWwuZ3JlZW4oYEluc3RhbGxlZCBwYWNrYWdlcyBmb3IgdG9vbGluZyB2aWEgJHtwYWNrYWdlTWFuYWdlcn0uYCkpO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBtZXNzYWdlID0gJ1BhY2thZ2UgaW5zdGFsbCBmYWlsZWQsIHNlZSBhYm92ZS4nO1xuICAgICAgICAgIGxvZ2dlci5pbmZvKHRlcm1pbmFsLnJlZChtZXNzYWdlKSk7XG4gICAgICAgICAgcmVqZWN0KG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfSk7XG59XG4iXX0=