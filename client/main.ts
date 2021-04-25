import * as Turbo from 'https://cdn.skypack.dev/@hotwired/turbo';

Turbo.connectStreamSource(new EventSource('/branches/sse'));
Turbo.connectStreamSource(new EventSource('/branch/sse/main'));
