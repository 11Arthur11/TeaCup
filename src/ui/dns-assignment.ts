import { assignSubdomain, checkSubdomainAvailability, getAvailableDnsZones } from '../api/dns.js';
import type * as Models from '../api/generated-models.js';
import { runAction } from '../core/action.js';
import { openDialog } from '../core/dialog.js';
import { escapeHtml, icon, qs } from '../core/dom.js';
import { openTeaSpeakResourcePicker, type TeaSpeakResourceSelection } from './resource-picker.js';

export interface DnsAssignmentDialogOptions {
  resource?: TeaSpeakResourceSelection;
  onAssigned?: () => Promise<void> | void;
}

type AvailabilityUiState = 'idle' | 'waiting' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

const SUBDOMAIN_PATTERN = /^(?=.{1,63}$)(?!-)[a-z0-9]+(?:-[a-z0-9]+)*(?<!-)$/;
const AVAILABILITY_DEBOUNCE_MS = 700;

function normalizedSubdomain(value: string): string {
  return value.trim();
}

function availabilityMarkup(state: AvailabilityUiState, zoneName = ''): string {
  switch (state) {
    case 'waiting': return `${icon('schedule')}<span>پس از توقف تایپ، آزادبودن نام بررسی می‌شود.</span>`;
    case 'checking': return '<span class="spinner spinner--small"></span><span>در حال بررسی آزادبودن ساب‌دامین...</span>';
    case 'available': return `${icon('check_circle')}<span>این ساب‌دامین آزاد است و می‌توانید آن را ثبت کنید.${zoneName ? ` <b dir="ltr">.${escapeHtml(zoneName)}</b>` : ''}</span>`;
    case 'taken': return `${icon('cancel')}<span>این نام قبلاً ثبت شده است؛ نام دیگری انتخاب کنید.</span>`;
    case 'invalid': return `${icon('info')}<span>فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است؛ خط تیره نباید ابتدا، انتها یا پشت‌سرهم باشد.</span>`;
    case 'error': return `${icon('warning')}<span>بررسی نام انجام نشد. دوباره تایپ کنید یا چند لحظه بعد تلاش کنید.</span>`;
    default: return `${icon('travel_explore')}<span>یک Zone، سرویس TeaSpeak و نام ساب‌دامین انتخاب کنید.</span>`;
  }
}

export function openDnsAssignmentDialog(options: DnsAssignmentDialogOptions = {}): HTMLDialogElement {
  let selectedResource = options.resource;
  let zones: Models.ZoneUserResponse[] = [];
  let availability: AvailabilityUiState = 'idle';
  let timer = 0;
  let generation = 0;

  const dialog = openDialog({
    title: 'افزودن DNS جدید',
    description: 'یک ساب‌دامین را به یکی از سرویس‌های TeaSpeak خود متصل کنید.',
    content: `<form class="dns-assignment-form" data-dns-assignment-form>
      <label class="field"><span>Zone فعال<b>*</b></span><select name="zoneId" data-dns-zone required disabled><option value="">در حال دریافت Zoneها...</option></select></label>
      <div class="field dns-resource-field"><span>سرویس TeaSpeak<b>*</b></span>
        <button type="button" class="resource-select-button" data-dns-resource-select>
          <span class="resource-select-button__icon">${icon('dns')}</span>
          <span data-dns-resource-copy><small>سرویس مقصد</small><b>${escapeHtml(selectedResource?.label ?? 'انتخاب سرویس TeaSpeak')}</b></span>
          ${icon('unfold_more')}
        </button>
        <input type="hidden" name="teaSpeakResourceId" data-dns-resource-id value="${selectedResource?.id ?? ''}" required />
      </div>
      <label class="field field--full"><span>نام ساب‌دامین<b>*</b></span>
        <div class="dns-subdomain-input"><input name="subdomain" data-dns-subdomain type="text" dir="ltr" inputmode="url" autocomplete="off" minlength="1" maxlength="63" pattern="(?=.{1,63}$)(?!-)[a-z0-9]+(?:-[a-z0-9]+)*(?&lt;!-)" placeholder="voice" required /><span data-dns-zone-suffix>.example.com</span></div>
        <span class="dns-field-hints"><small>مثال معتبر: <b dir="ltr">voice</b>، <b dir="ltr">team-1</b> یا <b dir="ltr">server2026</b></small><small>بررسی آزادبودن حدود ۷۰۰ میلی‌ثانیه بعد از توقف تایپ انجام می‌شود.</small></span>
      </label>
      <div class="dns-availability dns-availability--idle field--full" data-dns-availability>${availabilityMarkup('idle')}</div>
    </form>`,
    confirmLabel: 'ثبت و اتصال DNS',
    wide: true,
    onConfirm: async () => {
      const form = qs<HTMLFormElement>('[data-dns-assignment-form]', dialog);
      if (!form.reportValidity() || availability !== 'available' || !selectedResource) return false;
      const data = new FormData(form);
      const response = await runAction(() => assignSubdomain({
        zoneId: Number(data.get('zoneId')),
        subdomain: normalizedSubdomain(String(data.get('subdomain') ?? '')),
        teaSpeakResourceId: selectedResource!.id,
      }));
      if (!response) return false;
      await options.onAssigned?.();
      return true;
    },
  });

  const zoneSelect = qs<HTMLSelectElement>('[data-dns-zone]', dialog);
  const subdomainInput = qs<HTMLInputElement>('[data-dns-subdomain]', dialog);
  const resourceInput = qs<HTMLInputElement>('[data-dns-resource-id]', dialog);
  const resourceCopy = qs<HTMLElement>('[data-dns-resource-copy]', dialog);
  const suffix = qs<HTMLElement>('[data-dns-zone-suffix]', dialog);
  const status = qs<HTMLElement>('[data-dns-availability]', dialog);
  const confirm = qs<HTMLButtonElement>('[data-confirm]', dialog);
  confirm.disabled = true;

  const selectedZone = (): Models.ZoneUserResponse | undefined => zones.find((zone) => Number(zone.id) === Number(zoneSelect.value));

  const updateStatus = (state: AvailabilityUiState): void => {
    availability = state;
    status.className = `dns-availability dns-availability--${state} field--full`;
    status.innerHTML = availabilityMarkup(state, selectedZone()?.name ?? '');
    confirm.disabled = state !== 'available' || !selectedResource;
  };

  const syncZoneSuffix = (): void => {
    const zoneName = selectedZone()?.name?.trim();
    suffix.textContent = zoneName ? `.${zoneName}` : '.example.com';
  };

  const check = async (): Promise<void> => {
    const requestGeneration = ++generation;
    const zoneId = Number(zoneSelect.value);
    const subdomain = normalizedSubdomain(subdomainInput.value);
    if (!zoneId || !subdomain) { updateStatus('idle'); return; }
    if (!SUBDOMAIN_PATTERN.test(subdomain)) { subdomainInput.setCustomValidity('نام ساب‌دامین با الگوی مجاز مطابقت ندارد.'); updateStatus('invalid'); return; }
    subdomainInput.setCustomValidity('');
    updateStatus('checking');
    const result = await checkSubdomainAvailability(zoneId, subdomain);
    if (requestGeneration !== generation || !dialog.open) return;
    updateStatus(result === 'available' ? 'available' : result === 'taken' ? 'taken' : 'error');
  };

  const scheduleCheck = (): void => {
    window.clearTimeout(timer);
    generation += 1;
    const value = normalizedSubdomain(subdomainInput.value);
    if (!value) { subdomainInput.setCustomValidity(''); updateStatus('idle'); return; }
    if (!SUBDOMAIN_PATTERN.test(value)) {
      subdomainInput.setCustomValidity('فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است؛ خط تیره نباید ابتدا، انتها یا پشت‌سرهم باشد.');
      updateStatus('invalid');
      return;
    }
    subdomainInput.setCustomValidity('');
    updateStatus('waiting');
    timer = window.setTimeout(() => void check(), AVAILABILITY_DEBOUNCE_MS);
  };

  qs<HTMLButtonElement>('[data-dns-resource-select]', dialog).addEventListener('click', () => {
    openTeaSpeakResourcePicker({
      selectedId: selectedResource?.id,
      onSelect: (resource) => {
        selectedResource = resource;
        resourceInput.value = String(resource.id);
        resourceCopy.innerHTML = `<small>سرویس مقصد</small><b>${escapeHtml(resource.label)}</b>`;
        scheduleCheck();
      },
    });
  });
  subdomainInput.addEventListener('input', scheduleCheck);
  zoneSelect.addEventListener('change', () => { syncZoneSuffix(); scheduleCheck(); });
  dialog.addEventListener('close', () => { window.clearTimeout(timer); generation += 1; }, { once: true });

  void (async () => {
    try {
      zones = await getAvailableDnsZones();
      zoneSelect.disabled = false;
      zoneSelect.innerHTML = zones.length
        ? `<option value="">انتخاب Zone</option>${zones.map((zone) => `<option value="${Number(zone.id)}">${escapeHtml(zone.name)}</option>`).join('')}`
        : '<option value="">Zone فعالی برای ساخت DNS وجود ندارد</option>';
      if (zones.length === 1) zoneSelect.value = String(zones[0]?.id ?? '');
      syncZoneSuffix();
      scheduleCheck();
    } catch {
      zoneSelect.innerHTML = '<option value="">دریافت Zoneها ناموفق بود</option>';
      updateStatus('error');
    }
  })();

  return dialog;
}
