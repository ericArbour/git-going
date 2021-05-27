import { Application } from 'https://cdn.skypack.dev/stimulus';

// Even though this is a TypeScript project, imports need to include the .js
// extension or else they won't be retrievable from the server on browser
// request: https://github.com/microsoft/TypeScript/issues/16577.
import { BranchesController } from './controllers/branches-controller.js';
import { BranchController } from './controllers/branch-controller.js';

const application = Application.start();

application.register('branches', BranchesController);
application.register('branch', BranchController);
