import { treaty } from '@elysiajs/eden';
import type { App } from '~/treaty';

export const api = treaty<App>(window.location.origin, {
  parseDate: false,
}).api.plateform;
