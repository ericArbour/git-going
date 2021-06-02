#!/usr/bin/env node

import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { getRepository } from './git-utils';
import { branchesHandler, branchesSseHandler } from './routes/branches';
import { branchHandler, branchSsehandler } from './routes/branch';

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
  app.get('/branch/:name', branchHandler);
  app.get('/branch/sse/:name', branchSsehandler);

  app.listen(argv.p, () => console.log(`Listening on port ${argv.p}...`));
}

main();
