import { Controller } from 'https://cdn.skypack.dev/stimulus';
import {
  connectStreamSource,
  disconnectStreamSource,
} from 'https://cdn.skypack.dev/@hotwired/turbo';

export class BranchController extends Controller {
  static values = { name: String };

  readonly nameValue?: string;
  eventSource?: EventSource;
  basePath = '/branch/sse/' as const;
  path?: string;

  connect() {
    if (typeof this.nameValue === 'string') {
      this.path = `${this.basePath}${this.nameValue}`;
      console.log(`connecting to stream source ${this.path}`);
      this.eventSource = new EventSource(this.path);
      connectStreamSource(this.eventSource);
    } else {
      console.error(
        'Cannot connect to stream source - invalid branch name:',
        this.nameValue,
      );
    }
  }

  disconnect() {
    if (this.eventSource) {
      console.log(`disconnecting from stream source ${this.path}`);
      disconnectStreamSource(this.eventSource);
      this.eventSource.close();
    }
  }
}
