import { Controller } from 'https://cdn.skypack.dev/stimulus';
import {
  connectStreamSource,
  disconnectStreamSource,
} from 'https://cdn.skypack.dev/@hotwired/turbo';

export class BranchController extends Controller {
  static values = { name: String };

  readonly nameValue?: string;

  eventSource?: EventSource;

  connect() {
    if (typeof this.nameValue === 'string') {
      const path = `/branch/sse/${this.nameValue}`;
      console.log(`connecting to stream source ${path}`);
      this.eventSource = new EventSource(path);
      connectStreamSource(this.eventSource);
    } else {
      console.error('Cannot connect to stream source: invalid branch name');
    }
  }

  disconnect() {
    if (this.eventSource) {
      disconnectStreamSource(this.eventSource);
      this.eventSource.close();
    }
  }
}
