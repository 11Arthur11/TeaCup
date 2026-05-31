import { escapeHtml, icon } from '../core/dom.js';
import { faNumber } from '../core/format.js';

export interface FileSelectionController {
  files: () => File[];
  clear: () => void;
}

const fileKey = (file: File): string => `${file.name}:${file.size}:${file.lastModified}`;

export function bindFileSelection(
  input: HTMLInputElement,
  list: HTMLElement,
): FileSelectionController {
  let selected: File[] = [];

  const render = (): void => {
    const hasFiles = selected.length > 0;
    list.hidden = !hasFiles;
    list.dataset.hasFiles = String(hasFiles);
    list.innerHTML = selected.map((file, index) => `
      <span class="ticket-selected-file">
        ${icon('description')}
        <span><b>${escapeHtml(file.name)}</b><small>${faNumber(Math.max(1, Math.ceil(file.size / 1024)))} کیلوبایت</small></span>
        <button type="button" class="ticket-selected-file__remove" data-remove-file="${index}" aria-label="حذف ${escapeHtml(file.name)}">${icon('close')}</button>
      </span>`).join('');
  };

  const acceptSelection = (): void => {
    const incoming = Array.from(input.files ?? []);
    if (!incoming.length) return;
    const existing = new Set(selected.map(fileKey));
    for (const file of incoming) {
      const key = fileKey(file);
      if (!existing.has(key)) {
        selected.push(file);
        existing.add(key);
      }
    }
    // The controller state is the upload source. Clearing the native input lets
    // the same file be selected again after it is removed without losing the UI list.
    input.value = '';
    render();
  };

  input.addEventListener('change', acceptSelection);

  list.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-remove-file]');
    if (!button) return;
    event.preventDefault();
    const index = Number(button.dataset.removeFile);
    if (!Number.isInteger(index) || index < 0 || index >= selected.length) return;
    selected.splice(index, 1);
    render();
  });

  render();
  return {
    files: () => [...selected],
    clear: () => {
      selected = [];
      input.value = '';
      render();
    },
  };
}
