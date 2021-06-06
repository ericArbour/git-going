import path from 'path';
import { Router } from 'express';
import chokidar from 'chokidar';
import { commitToViewCommit, getBranch, getBranchCommits } from '../git-utils';

const branchRouter = Router();

branchRouter.get('/branch/:name', async (req, res) => {
  try {
    const branchName = req.params.name;
    const repo = req.app.get('repo');
    const branch = await getBranch(repo, branchName);
    const commits = await getBranchCommits(repo, branch);
    const viewCommits = commits.map(commitToViewCommit);

    res.render('branch', {
      commits: viewCommits,
      branchName,
    });
  } catch (e) {
    res.status(404).send(e.message);
  }
});

branchRouter.get('/branch/sse/:name', async (req, res) => {
  const branchName = req.params.name;
  const repo = req.app.get('repo');
  const viewInstance = req.app.get('view-instance');
  const branchPath = `/.git/refs/heads/${branchName}`;

  console.log(`connected to /branches/see/${branchName}`);

  res.set({
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  // Tell the client to retry every 10 seconds if connectivity is lost
  res.write('retry: 10000\n\n');

  const watcher = chokidar.watch(process.cwd() + branchPath, {
    ignoreInitial: true,
  });

  watcher.on('all', async (event) => {
    console.log(`${branchPath} change detected of type ${event}`);

    if (event === 'unlink') {
      const template = await viewInstance.render(
        path.join(__dirname, '../views/branch-reset-sse.hbs'),
        {},
      );
      const line = template.replace(/\n/g, '');

      res.write(`data: ${line}\n\n`);
    } else {
      try {
        const branch = await getBranch(repo, branchName);
        const commits = await getBranchCommits(repo, branch);
        const viewCommits = commits.map(commitToViewCommit);
        const template = await viewInstance.render(
          path.join(__dirname, '../views/branch-sse.hbs'),
          { commits: viewCommits, branchName },
        );
        const line = template.replace(/\n/g, '');

        res.write(`data: ${line}\n\n`);
      } catch (e) {
        console.error(e.message);
      }
    }
  });
  console.log(`watching for changes in ${branchPath}`);

  res.on('close', () => {
    console.log(`disconnected from /branches/see/${branchName}`);
    watcher.close().then(() => console.log(`${branchPath} watcher closed`));
  });
});

export { branchRouter };
