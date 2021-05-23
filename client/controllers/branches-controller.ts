import { Controller } from 'https://cdn.skypack.dev/stimulus';
import {
  connectStreamSource,
  disconnectStreamSource,
} from 'https://cdn.skypack.dev/@hotwired/turbo';

export class BranchesController extends Controller {
  eventSource?: EventSource;
  path = '/branches/sse' as const;

  connect() {
    console.log(`connecting to stream source ${this.path}`);
    this.eventSource = new EventSource(this.path);
    connectStreamSource(this.eventSource);
  }

  disconnect() {
    if (this.eventSource) {
      console.log(`disconnecting from stream source ${this.path}`);
      disconnectStreamSource(this.eventSource);
      this.eventSource.close();
    }
  }
}
