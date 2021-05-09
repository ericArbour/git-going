import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';
import chokidar from 'chokidar';

import {
  getRepository,
  getBranch,
  getLocalBranches,
  getBranchCommits,
} from './git-utils';

async function main() {
  const app = express();
  const repo = await getRepository();

  const viewInstance = exphbs.create({
    extname: 'hbs',
    partialsDir: path.join(__dirname, 'views/partials'),
  });

  app.engine('hbs', viewInstance.engine);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  app.use(express.static(path.resolve(__dirname, '../public')));

  app.get('/', function (req, res) {
    res.render('index');
  });

  app.get('/branches', async function (req, res) {
    const branches = await getLocalBranches(repo);
    const branchNames = branches.map((branch) =>
      branch.name().replace('refs/heads/', ''),
    );

    res.render('branches', { branches: branchNames });
  });

  app.get('/branches/sse', async function (req, res) {
    res.set({
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
    });
    res.flushHeaders();

    // Tell the client to retry every 10 seconds if connectivity is lost
    res.write('retry: 10000\n\n');

    chokidar
      .watch(process.cwd() + '/.git/refs/heads', { ignoreInitial: true })
      .on('all', async () => {
        try {
          const branches = await getLocalBranches(repo);
          const branchNames = branches.map((branch) =>
            branch.name().replace('refs/heads/', ''),
          );
          const template = await viewInstance.render(
            __dirname + '/views/branches-sse.hbs',
            { branches: branchNames },
          );
          const line = template.replaceAll('\n', '');

          res.write(`data: ${line}\n\n`);
        } catch (e) {
          console.error(e.message);
        }
      });
  });

  app.get('/branch/:name', async function (req, res) {
    const name = req.params.name;
    const branch = await getBranch(repo, name);
    const commits = await getBranchCommits(repo, branch);
    const commitMessages = commits.map((commit) => commit.message());

    res.render('branch', { commits: commitMessages, branchName: name });
  });

  app.get('/branch/sse/:name', async function (req, res) {
    const name = req.params.name;

    res.set({
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
    });
    res.flushHeaders();

    // Tell the client to retry every 10 seconds if connectivity is lost
    res.write('retry: 10000\n\n');

    chokidar
      .watch(process.cwd() + '/.git/objects', { ignoreInitial: true })
      .on('all', async () => {
        console.log('hit');
        try {
          const branch = await getBranch(repo, name);
          const commits = await getBranchCommits(repo, branch);
          const commitMessages = commits.map((commit) => commit.message());
          const template = await viewInstance.render(
            __dirname + '/views/branch-sse.hbs',
            { commits: commitMessages, branchName: name },
          );
          const line = template.replaceAll('\n', '');

          res.write(`data: ${line}\n\n`);
        } catch (e) {
          console.error(e.message);
        }
      });
  });

  const PORT = 8080;

  app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
}

main();
