import { ApiError, backendMessage } from '../api/client.js';
import { notify } from './toast.js';
import { closeSubmittingDialogOnError } from './dialog.js';

export async function runAction<T>(task: () => Promise<T>, options: { fallbackSuccess?: string; silentSuccess?: boolean } = {}): Promise<T | undefined> {
  try {
    const result = await task();
    if (!options.silentSuccess) notify(backendMessage(result) ?? options.fallbackSuccess ?? 'عملیات با موفقیت انجام شد.', 'success');
    return result;
  } catch (error) {
    closeSubmittingDialogOnError();
    notify(error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'خطای پیش‌بینی‌نشده رخ داد.', 'error', 6200);
    return undefined;
  }
}
