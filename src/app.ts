#!/usr/bin/env node

import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';
import chokidar from 'chokidar';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import {
  getRepository,
  getBranch,
  getBranchCommits,
  commitToViewCommit,
} from './git-utils';
import { branchesHandler, branchesSseHandler } from './routes/branches';

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .scriptName('git-vis')
    .usage('Usage: $0 [args]')
    .example(
      '$0 -d ./my-project -p 3000',
      'runs git-vis on a specific directory and port',
    )
    .option('d', {
      alias: 'directory',
      type: 'string',
      describe:
        'a directory that contains a .git subdirectory - defaults to process.cwd()',
      nargs: 1,
      default: process.cwd(),
    })
    .option('p', {
      alias: 'port',
      type: 'number',
      describe: 'the port to run the web server',
      nargs: 1,
      default: 8080,
    })
    .help('h')
    .alias('h', 'help').argv;

  const app = express();
  const repo = await getRepository(argv.d);

  const viewInstance = exphbs.create({
    extname: 'hbs',
    partialsDir: path.join(__dirname, 'views/partials'),
  });
  app.engine('hbs', viewInstance.engine);

  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  app.set('view-instance', viewInstance);
  app.set('repo', repo);

  app.use(express.static(path.resolve(__dirname, '../public')));

  app.get('/', function (req, res) {
    res.render('index');
  });

  app.get('/branches', branchesHandler);
  app.get('/branches/sse', branchesSseHandler);

  app.get('/branch/:name', async function (req, res) {
    const branchName = req.params.name;
    const branch = await getBranch(repo, branchName);
    const commits = await getBranchCommits(repo, branch);
    const viewCommits = commits.map(commitToViewCommit);

    res.render('branch', {
      commits: viewCommits,
      branchName,
    });
  });

  app.get('/branch/sse/:name', async function (req, res) {
    const branchName = req.params.name;
    console.log(`connected to /branches/see/${branchName}`);

    const path = `/.git/refs/heads/${branchName}`;

    res.set({
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
    });
    res.flushHeaders();

    // Tell the client to retry every 10 seconds if connectivity is lost
    res.write('retry: 10000\n\n');

    const watcher = chokidar.watch(process.cwd() + path, {
      ignoreInitial: true,
    });

    watcher.on('all', async (event) => {
      console.log(`${path} change detected of type ${event}`);

      if (event === 'unlink') {
        const template = await viewInstance.render(
          __dirname + '/views/branch-reset-sse.hbs',
          {},
        );
        const line = template.replaceAll('\n', '');

        res.write(`data: ${line}\n\n`);
      } else {
        try {
          const branch = await getBranch(repo, branchName);
          const commits = await getBranchCommits(repo, branch);
          const viewCommits = commits.map(commitToViewCommit);
          const template = await viewInstance.render(
            __dirname + '/views/branch-sse.hbs',
            { commits: viewCommits, branchName },
          );
          const line = template.replaceAll('\n', '');

          res.write(`data: ${line}\n\n`);
        } catch (e) {
          console.error(e.message);
        }
      }
    });
    console.log(`watching for changes in ${path}`);

    res.on('close', () => {
      console.log(`disconnected from /branches/see/${branchName}`);
      watcher.close().then(() => console.log(`${path} watcher closed`));
    });
  });

  app.listen(argv.p, () => console.log(`Listening on port ${argv.p}...`));
}

main();
