import express from 'express';
import path from 'path';

const app = express();

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/messages', async function (req, res) {
  console.log('Got /messages');
  res.set({
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  // Tell the client to retry every 10 seconds if connectivity is lost
  res.write('retry: 10000\n\n');
  let count = 0;

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('Emit', ++count);
    // Emit an SSE that contains the current 'count' as a string
    res.write(
      `data: <turbo-stream action="append" target="messages"><template><div id="message_${count}">div #${count}.</div></template></turbo-stream>\n\n`,
    );
  }
});

app.listen(8080, () => console.log('listening...'));
