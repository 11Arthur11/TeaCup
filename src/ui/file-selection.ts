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

  const syncInput = (): void => {
    try {
      const transfer = new DataTransfer();
      selected.forEach((file) => transfer.items.add(file));
      input.files = transfer.files;
    } catch {
      // Internal state remains the source of truth on older browsers.
    }
  };

  const render = (): void => {
    list.hidden = selected.length === 0;
    list.innerHTML = selected.map((file, index) => `
      <span class="ticket-selected-file">
        ${icon('description')}
        <span><b>${escapeHtml(file.name)}</b><small>${faNumber(Math.max(1, Math.ceil(file.size / 1024)))} کیلوبایت</small></span>
        <button type="button" class="ticket-selected-file__remove" data-remove-file="${index}" aria-label="حذف ${escapeHtml(file.name)}">${icon('close')}</button>
      </span>`).join('');
  };

  input.addEventListener('change', () => {
    const existing = new Set(selected.map(fileKey));
    for (const file of Array.from(input.files ?? [])) {
      if (!existing.has(fileKey(file))) selected.push(file);
    }
    syncInput();
    render();
  });

  list.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-remove-file]');
    if (!button) return;
    const index = Number(button.dataset.removeFile);
    if (!Number.isInteger(index) || index < 0 || index >= selected.length) return;
    selected.splice(index, 1);
    syncInput();
    render();
  });

  render();
  return {
    files: () => [...selected],
    clear: () => {
      selected = [];
      input.value = '';
      syncInput();
      render();
    },
  };
}
