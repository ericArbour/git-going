import path from 'path';
import { Router } from 'express';
import chokidar from 'chokidar';

import { branchToBranchSummary, getLocalBranches } from '../git-utils';

const branchesRouter = Router();

branchesRouter.get('/branches', async (req, res) => {
  const repo = req.app.get('repo');
  const branches = await getLocalBranches(repo);
  const branchSummaries = branches.map(branchToBranchSummary);

  res.render('branches', { branches: branchSummaries });
});

branchesRouter.get('/branches/sse', async (req, res) => {
  const repo = req.app.get('repo');
  const directory = req.app.get('directory');
  const viewInstance = req.app.get('view-instance');
  const branchesPath = `${directory}/.git/refs/heads`;
  const headPath = `${directory}/.git/HEAD`;

  console.log('connected to /branches/see');

  res.set({
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  // Tell the client to retry every 10 seconds if connectivity is lost
  res.write('retry: 10000\n\n');

  const watcher = chokidar.watch([branchesPath, headPath], {
    ignoreInitial: true,
  });

  watcher.on('all', async () => {
    console.log(`${branchesPath} change detected`);
    try {
      const branches = await getLocalBranches(repo);
      const branchSummaries = branches.map(branchToBranchSummary);
      const template = await viewInstance.render(
        path.join(__dirname, '../views/branches-sse.hbs'),
        { branches: branchSummaries },
      );
      const line = template.replace(/\n/g, '');

      res.write(`data: ${line}\n\n`);
    } catch (e) {
      console.error(e.message);
    }
  });
  console.log(`watching for changes in ${branchesPath}`);

  res.on('close', () => {
    console.log('disconnected from /branches/see');
    watcher.close().then(() => {
      console.log(`${branchesPath} watcher closed`);
    });
  });
});

export { branchesRouter };
