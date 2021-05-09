import { Controller } from 'https://cdn.skypack.dev/stimulus';
import {
  connectStreamSource,
  disconnectStreamSource,
} from 'https://cdn.skypack.dev/@hotwired/turbo';

export class BranchesController extends Controller {
  eventSource?: EventSource;

  connect() {
    this.eventSource = new EventSource('/branches/sse');
    connectStreamSource(this.eventSource);
  }

  disconnect() {
    if (this.eventSource) {
      disconnectStreamSource(this.eventSource);
      this.eventSource.close();
    }
  }
}
