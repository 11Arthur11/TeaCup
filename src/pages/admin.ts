import { api, ApiError } from '../api/client.js';
import { getMockLiveServiceStatus } from '../api/live-status.js';
import { contentOf, dataOf, pageOf } from '../api/data.js';
import type * as Models from '../api/generated-models.js';
import { runAction } from '../core/action.js';
import { canAccessAdminArea } from '../core/authorization.js';
import { confirmDialog, openDialog } from '../core/dialog.js';
import { escapeHtml, icon, qs, qsa, requiredNumber } from '../core/dom.js';
import { faDate, faDateShort, faNumber, money, remainingTime, runtimeStatusHint, translateEnum } from '../core/format.js';
import { router } from '../core/router.js';
import { store } from '../core/store.js';
import { notify } from '../core/toast.js';
import { badge, card, dataTable, emptyState, field, loadingPage, pageHeader, pagination, selectField, statCard, textarea, toggleField } from '../ui/components.js';
import { renderAppShell } from '../ui/layout.js';
import { openUserPicker } from '../ui/user-picker.js';
import { bindFileSelection } from '../ui/file-selection.js';
import { renderTicketMessage } from '../ui/ticket-message.js';

interface AdminProductDto { id?: number; categoryName?: string; categorySlug?: string; productName?: string; enabled?: boolean; price?: Models.Money; period?: string; productType?: string; maxClients?: number; providerNodeId?: number | null; expiration?: string; orderedResources?: number; }
const objectOf = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};
const arrayOf = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];
const adminError = (error: unknown): string => `<div class="notice notice--warning">${icon('warning')}<span>${escapeHtml(error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'دریافت اطلاعات با خطا مواجه شد.')}</span><button onclick="location.reload()">تلاش دوباره</button></div>`;
const canManageUsers = (): boolean => canAccessAdminArea(store.get().identity.role, 'users');
const adminUserReference = (userId: number | undefined, label?: string): string => {
  const safeId = Number(userId ?? 0);
  const text = escapeHtml(label || `#${faNumber(safeId)}`);
  return canManageUsers() ? `<a data-link class="text-link" href="/admin/users/${safeId}">${text}</a>` : `<span>${text}</span>`;
};
const runtimeStatus = (value: string | undefined, active: boolean): string => {
  const normalized = value?.trim().toUpperCase() || (active ? 'DISPATCHED' : 'DISABLED');
  return `<span class="runtime-status-badge" title="${escapeHtml(runtimeStatusHint(normalized))}">${badge(normalized)}</span>`;
};

const capacityCell = (used: number, max: number, unit: string): string => {
  const safeMax = Math.max(0, max);
  const safeUsed = Math.max(0, used);
  const percent = safeMax > 0 ? Math.min(100, Math.round((safeUsed / safeMax) * 100)) : 0;
  return `<div class="table-capacity"><span><b>${faNumber(safeUsed)}</b> از ${faNumber(safeMax)} ${escapeHtml(unit)}</span><div><i style="width:${percent}%"></i></div></div>`;
};


function roleOptionLabel(role: Models.RoleListResponse): string {
  return translateEnum(role.name) || role.name || `نقش #${role.id}`;
}

export async function renderAdminDashboard(): Promise<void> {
  const isSupport = store.get().identity.role === 'ROLE_SUPPORT';
  const title = isSupport ? 'نمای کلی پشتیبانی' : 'نمای کلی مدیریت';
  const description = isSupport
    ? 'دسترسی سریع به عملیات تیکت و فاکتور؛ بدون دریافت متریک‌های داشبورد از backend.'
    : 'مرکز دسترسی به مدیریت TeaCloud؛ متریک‌های اصلی تا اضافه‌شدن endpoint اختصاصی از backend دریافت نمی‌شوند.';
  const shortcuts = isSupport
    ? `<a data-link href="/admin/tickets">${icon('forum')}<span><b>مدیریت تیکت‌ها</b><small>مشاهده و پاسخ به درخواست کاربران</small></span>${icon('chevron_left')}</a><a data-link href="/admin/invoices">${icon('request_quote')}<span><b>مدیریت فاکتورها</b><small>پیگیری صورت‌حساب‌ها و پرداخت‌ها</small></span>${icon('chevron_left')}</a>`
    : `<a data-link href="/admin/users">${icon('group')}<span><b>کاربران</b><small>حساب‌ها، نقش‌ها و وضعیت دسترسی</small></span>${icon('chevron_left')}</a><a data-link href="/admin/categories">${icon('category')}<span><b>دسته‌بندی‌ها</b><small>ساختار فروشگاه و گروه‌بندی محصولات</small></span>${icon('chevron_left')}</a><a data-link href="/admin/products">${icon('inventory_2')}<span><b>محصولات</b><small>تعرفه‌ها و سرویس‌های قابل سفارش</small></span>${icon('chevron_left')}</a><a data-link href="/admin/resources">${icon('cloud_queue')}<span><b>سرویس‌های کاربران</b><small>فیلتر و مدیریت منابع کاربران</small></span>${icon('chevron_left')}</a><a data-link href="/admin/tickets">${icon('forum')}<span><b>تیکت‌ها</b><small>مدیریت درخواست‌های کاربران</small></span>${icon('chevron_left')}</a><a data-link href="/admin/invoices">${icon('request_quote')}<span><b>فاکتورها</b><small>صورتحساب‌ها و تراکنش‌های پرداخت</small></span>${icon('chevron_left')}</a><a data-link href="/admin/query-instances">${icon('lan')}<span><b>نودهای Query</b><small>زیرساخت ارائه TeaSpeak</small></span>${icon('chevron_left')}</a><a data-link href="/admin/audio-nodes">${icon('headphones')}<span><b>نودهای ربات موزیک</b><small>زیرساخت AudioBot</small></span>${icon('chevron_left')}</a><a data-link href="/admin/dns">${icon('language')}<span><b>مدیریت DNS</b><small>Providerهای DNS و تنظیمات آن‌ها</small></span>${icon('chevron_left')}</a>`;

  renderAppShell(`${pageHeader(title, description)}
    <div class="dashboard-endpoint-note dashboard-endpoint-note--admin">${icon('monitoring')}<div><b>متریک‌های داشبورد غیرفعال هستند</b><small>این صفحه عمداً برای آمار کلی هیچ API مدیریتی را فراخوانی نمی‌کند. بعداً می‌توان یک endpoint تجمیعی و سبک برای آن تعریف کرد.</small></div></div>
    <div class="stats-grid">
      ${statCard('کاربران', '—', 'group', 'نیازمند endpoint متریک', 'blue')}
      ${statCard('سرویس‌ها', '—', 'teacloud', 'نیازمند endpoint متریک', 'cyan')}
      ${statCard('تیکت‌های باز', '—', 'support_agent', 'نیازمند endpoint متریک', 'orange')}
      ${statCard('فاکتورهای در انتظار', '—', 'receipt_long', 'نیازمند endpoint متریک', 'purple')}
    </div>
    ${card('دسترسی سریع', `<div class="admin-shortcuts">${shortcuts}</div>`, { icon: 'apps' })}
  `, title);
}


export async function renderAdminUsers(page = 0): Promise<void> {
  renderAppShell(loadingPage(), 'کاربران');
  try {
    const params = new URLSearchParams(location.search);
    const search = params.get('search')?.trim() || '';
    const roleId = Number(params.get('role') ?? 0);
    const state = params.get('state') || 'all';
    const filter: Models.UsersFilterRequest = {
      page,
      size: 20,
      search: search || undefined,
      byRoleId: Number.isSafeInteger(roleId) && roleId > 0 ? roleId : undefined,
      byEnabled: state === 'enabled' ? true : undefined,
      byLocked: state === 'locked' ? true : undefined,
    };
    const [response, rolesResponse] = await Promise.all([
      api.call('getAllUsers', { query: { filter } }),
      api.call('getRoles', {}),
    ]);
    const users = contentOf(response);
    const meta = pageOf(response);
    const roles = dataOf(rolesResponse) ?? [];

    renderAppShell(`${pageHeader('مدیریت کاربران', 'جست‌وجوی backend، فیلتر نقش و مدیریت وضعیت حساب کاربران.')}
      <form id="admin-user-filter" class="admin-user-filter">
        <label class="field"><span>جست‌وجو</span><input name="search" type="search" value="${escapeHtml(search)}" placeholder="نام، موبایل یا ایمیل" /></label>
        <label class="field"><span>نقش</span><select name="role"><option value="">همه نقش‌ها</option>${roles.map((item) => `<option value="${Number(item.id)}" ${Number(item.id) === roleId ? 'selected' : ''}>${escapeHtml(roleOptionLabel(item))}</option>`).join('')}</select></label>
        <label class="field"><span>وضعیت حساب</span><select name="state"><option value="all" ${state === 'all' ? 'selected' : ''}>همه کاربران</option><option value="enabled" ${state === 'enabled' ? 'selected' : ''}>کاربران فعال</option><option value="locked" ${state === 'locked' ? 'selected' : ''}>کاربران قفل‌شده</option></select></label>
        <button type="submit" class="button button--primary">${icon('search')} اعمال فیلتر</button>
        <a data-link href="/admin/users" class="button button--ghost">پاک‌کردن</a>
      </form>
      ${card('فهرست کاربران', dataTable<Models.UserListResponse>([
        { label: 'کاربر', render: (row) => `<a data-link class="table-primary" href="/admin/users/${row.id}">${icon('person')}<span><b>${escapeHtml(row.fullName || 'بدون نام')}</b><small dir="ltr">${escapeHtml(row.phone)}</small></span></a>` },
        { label: 'ایمیل', render: (row) => `<span class="ltr">${escapeHtml(row.email || '—')}</span>` },
        { label: 'نقش', render: (row) => badge(row.role) },
        { label: 'آخرین ورود', render: (row) => faDate(row.lastLogin) },
        { label: '', render: (row) => `<a data-link class="button button--ghost button--small" href="/admin/users/${row.id}">مدیریت</a>` },
      ], users, { emptyTitle: 'کاربری پیدا نشد', emptyText: 'جست‌وجو یا فیلترهای انتخابی نتیجه‌ای نداشت.' }) + pagination(meta.number, meta.totalPages), { icon: 'group' })}`,'کاربران');

    document.querySelector<HTMLFormElement>('#admin-user-filter')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = new FormData(event.currentTarget as HTMLFormElement);
      const query = new URLSearchParams();
      const searchValue = String(values.get('search') ?? '').trim();
      const roleValue = String(values.get('role') ?? '');
      const stateValue = String(values.get('state') ?? 'all');
      if (searchValue) query.set('search', searchValue);
      if (roleValue) query.set('role', roleValue);
      if (stateValue !== 'all') query.set('state', stateValue);
      router.navigate(`/admin/users${query.size ? `?${query.toString()}` : ''}`);
    });
    qsa<HTMLButtonElement>('[data-page]').forEach((button) => button.addEventListener('click', () => {
      const query = new URLSearchParams(location.search);
      query.set('page', String(Number(button.dataset.page)));
      router.navigate(`/admin/users?${query.toString()}`);
    }));
  } catch (error) {
    renderAppShell(`${pageHeader('مدیریت کاربران', 'فهرست کاربران')}${adminError(error)}`, 'کاربران');
  }
}

export async function renderAdminUserDetail(userId:number): Promise<void> {
  renderAppShell(loadingPage(),'جزئیات کاربر');
  try {
    const [detailResponse,rolesResponse,ticketsResponse]=await Promise.all([api.call('getUserById',{path:{userId}}),api.call('getRoles',{}),api.call('getAllUserTickets',{path:{userId},query:{filterRequest:{page:0,size:5}}})]);
    const user=dataOf(detailResponse); const roles=dataOf(rolesResponse)??[]; const tickets=contentOf(ticketsResponse); if(!user)throw new Error('اطلاعات کاربر دریافت نشد.');
    renderAppShell(`${pageHeader(`${user.firstName??''} ${user.lastName??''}`.trim()||`کاربر #${userId}`, `شناسه ${faNumber(user.id)} — ${escapeHtml(user.phone)}`, [{label:'بازگشت',icon:'arrow_forward',href:'/admin/users',variant:'ghost'}])}
      <div class="detail-grid"><div class="detail-main">${card('اطلاعات حساب',`<dl class="description-list description-list--grid"><div><dt>شماره موبایل</dt><dd dir="ltr">${escapeHtml(user.phone)}</dd></div><div><dt>ایمیل</dt><dd class="ltr">${escapeHtml(user.email||'—')}</dd></div><div><dt>نقش فعلی</dt><dd>${badge(user.role)}</dd></div><div><dt>تاریخ عضویت</dt><dd>${faDate(user.createdAt)}</dd></div><div><dt>آخرین ورود</dt><dd>${faDate(user.lastLogin)}</dd></div><div><dt>آخرین ویرایش</dt><dd>${faDate(user.updatedAt)}</dd></div></dl><div class="quick-actions"><button class="quick-action" id="edit-user">${icon('edit')}<span><b>ویرایش</b><small>نام و ایمیل</small></span></button><button class="quick-action" id="role-user">${icon('admin_panel_settings')}<span><b>تغییر نقش</b><small>سطح دسترسی</small></span></button><button class="quick-action" id="${user.locked?'unlock-user':'lock-user'}">${icon(user.locked?'lock_open':'lock')}<span><b>${user.locked?'بازکردن قفل':'قفل حساب'}</b><small>کنترل ورود</small></span></button></div>`,{icon:'manage_accounts'})}
      ${card('تیکت‌های اخیر کاربر',dataTable<Models.TicketListAdminResponse>([{label:'موضوع',render:r=>`<a data-link class="text-link strong" href="/admin/tickets/${r.id}">${escapeHtml(r.subject)}</a>`},{label:'وضعیت',render:r=>badge(r.status)},{label:'تاریخ',render:r=>faDateShort(r.lastModified)}],tickets),{icon:'forum',actions:`<a data-link class="text-link" href="/admin/tickets?user=${userId}">همه تیکت‌ها</a>`})}</div>
      <aside>${card('وضعیت امنیتی',`<div class="security-status"><div>${icon(user.enabled?'check_circle':'block')}<span><b>حساب کاربری</b><small>${user.enabled?'فعال':'غیرفعال'}</small></span>${badge(user.enabled?'ACTIVE':'DISABLED')}</div><div>${icon(user.locked?'lock':'lock_open')}<span><b>وضعیت قفل</b><small>${user.locked?'ورود مسدود است':'ورود مجاز است'}</small></span>${badge(user.locked?'CLOSED':'ACTIVE')}</div><div>${icon(user.emailVerified?'verified':'mark_email_unread')}<span><b>تأیید ایمیل</b><small>${user.emailVerified?'تأیید شده':'تأیید نشده'}</small></span>${badge(user.emailVerified?'ACTIVE':'PENDING')}</div></div>`,{icon:'security'})}</aside></div>`, 'جزئیات کاربر');
    bindAdminUserActions(user,roles);
  } catch(error){renderAppShell(`${pageHeader('جزئیات کاربر','مدیریت حساب')}${adminError(error)}`,'جزئیات کاربر');}
}

function bindAdminUserActions(user:Models.UserDetailAdminResponse,roles:Models.RoleListResponse[]):void{
  document.querySelector('#edit-user')?.addEventListener('click',()=>{const form=document.createElement('form');form.className='form-grid';form.innerHTML=`${field('firstName','نام',{value:user.firstName})}${field('lastName','نام خانوادگی',{value:user.lastName})}${field('email','ایمیل',{value:user.email,type:'email',dir:'ltr'})}`;openDialog({title:'ویرایش کاربر',content:form,confirmLabel:'ذخیره',onConfirm:async()=>{const data=new FormData(form);const ok=await runAction(()=>api.call('editUser',{path:{userId:Number(user.id)},body:{firstName:String(data.get('firstName')??''),lastName:String(data.get('lastName')??''),email:String(data.get('email')??'')}}));if(ok)await renderAdminUserDetail(Number(user.id));return Boolean(ok);}});});
  document.querySelector('#role-user')?.addEventListener('click',()=>{const form=document.createElement('form');form.innerHTML=selectField('roleId','نقش',roles.map(role=>({value:role.id??'',label:`${role.name} — سطح ${role.hierarchy}`})),undefined,true);openDialog({title:'تغییر نقش کاربر',description:'این تغییر بلافاصله بر دسترسی‌های کاربر اثر می‌گذارد.',content:form,confirmLabel:'اعمال نقش',onConfirm:async()=>{if(!form.reportValidity())return false;const data=new FormData(form);const ok=await runAction(()=>api.call('setUserRole',{path:{userId:Number(user.id),roleId:requiredNumber(data.get('roleId'))}}));if(ok)await renderAdminUserDetail(Number(user.id));return Boolean(ok);}});});
  const lockAction=user.locked?'unlockUser':'lockUser';document.querySelector(user.locked?'#unlock-user':'#lock-user')?.addEventListener('click',()=>confirmDialog(user.locked?'بازکردن قفل حساب':'قفل‌کردن حساب',user.locked?'کاربر دوباره امکان ورود خواهد داشت.':'کاربر تا زمان بازشدن قفل امکان ورود ندارد.',user.locked?'بازکردن قفل':'قفل حساب',async()=>{if(await runAction(()=>api.call(lockAction,{path:{userId:Number(user.id)}})))await renderAdminUserDetail(Number(user.id));},!user.locked));
}

type AdminResourceType = NonNullable<Models.ResourceFilterRequest['byType']>;

function adminResourceTabHref(type: AdminResourceType, status: Models.ResourceFilterRequest['byResourceStatus'] | null, ownerId: number, ownerLabel: string): string {
  const query = new URLSearchParams({ type });
  if (status) query.set('status', status);
  if (ownerId > 0) {
    query.set('owner', String(ownerId));
    if (ownerLabel) query.set('ownerLabel', ownerLabel);
  }
  return `/admin/resources?${query.toString()}`;
}

function resourceExpirationCell(expiration?: string): string {
  return `<span class="expiration-cell"><b>${faDate(expiration)}</b><small>${escapeHtml(remainingTime(expiration))}</small></span>`;
}

function resourceNodeLink(resource: Models.ResourceListAdminResponse): string {
  const nodeId = Number(resource.nodeId ?? 0);
  if (!Number.isSafeInteger(nodeId) || nodeId < 1) return '<span class="muted">تخصیص نیافته</span>';
  const href = resource.resourceType === 'AUDIO_BOT'
    ? `/admin/audio-nodes/${nodeId}`
    : `/admin/query-instances/${nodeId}`;
  const label = resource.resourceType === 'AUDIO_BOT' ? 'نود AudioBot' : 'نود Query';
  return `<a data-link class="node-reference-button" href="${href}" title="مشاهده جزئیات ${label}">${icon(resource.resourceType === 'AUDIO_BOT' ? 'headphones' : 'lan')}<span>${label}</span><b>#${faNumber(nodeId)}</b>${icon('chevron_left')}</a>`;
}

export async function renderAdminResources(page = 0): Promise<void> {
  renderAppShell(loadingPage(), 'سرویس‌های کاربران');
  try {
    const params = new URLSearchParams(location.search);
    const type: AdminResourceType = params.get('type') === 'AUDIO_BOT' ? 'AUDIO_BOT' : 'TEASPEAK';
    const status = params.get('status') as Models.ResourceFilterRequest['byResourceStatus'] | null;
    const ownerId = Number(params.get('owner') ?? 0);
    const ownerLabel = params.get('ownerLabel') || (ownerId > 0 ? `کاربر #${faNumber(ownerId)}` : 'همه کاربران');
    const response = await api.call('getAllResources', {
      query: { filter: {
        page,
        size: 20,
        byType: type,
        byResourceStatus: status ?? undefined,
        byOwnerId: Number.isSafeInteger(ownerId) && ownerId > 0 ? ownerId : undefined,
      } },
    });
    const resources = contentOf(response);
    const meta = pageOf(response);
    const tabs = `<nav class="segmented resource-type-tabs" aria-label="نوع سرویس">
      <a data-link class="${type === 'TEASPEAK' ? 'active' : ''}" href="${adminResourceTabHref('TEASPEAK', status, ownerId, ownerLabel)}">${icon('dns')} TeaSpeak</a>
      <a data-link class="${type === 'AUDIO_BOT' ? 'active' : ''}" href="${adminResourceTabHref('AUDIO_BOT', status, ownerId, ownerLabel)}">${icon('headphones')} AudioBot</a>
    </nav>`;
    const table = dataTable<Models.ResourceListAdminResponse>([
      { label: 'سرویس', render: (resource) => `<a data-link class="table-primary" href="/admin/resources/${resource.id}">${icon(resource.resourceType === 'AUDIO_BOT' ? 'headphones' : 'dns')}<span><b>#${faNumber(resource.id)}</b><small>${escapeHtml(resource.productName || translateEnum(resource.resourceType))}</small></span></a>` },
      { label: 'مالک', render: (resource) => adminUserReference(resource.ownerId, `کاربر #${faNumber(resource.ownerId)}`) },
      { label: 'نود ارائه‌دهنده', render: resourceNodeLink },
      { label: 'وضعیت', render: (resource) => badge(resource.resourceStatus) },
      { label: 'دوره', render: (resource) => badge(resource.period) },
      { label: 'انقضا', render: (resource) => resourceExpirationCell(resource.expiration) },
      { label: '', className: 'table-actions-cell', render: (resource) => `<a data-link class="button button--ghost button--small" href="/admin/resources/${resource.id}">جزئیات</a>` },
    ], resources, {
      emptyTitle: type === 'TEASPEAK' ? 'سرویس TeaSpeak پیدا نشد' : 'سرویس AudioBot پیدا نشد',
      emptyText: 'فیلترها را تغییر دهید یا پس از ایجاد سرویس جدید دوباره بررسی کنید.',
    });

    const filterBody = `<form id="admin-resource-filter" class="admin-resource-filter admin-resource-filter--inside-card">
      ${selectField('status', 'وضعیت سرویس', [
        { value: '', label: 'همه وضعیت‌ها' },
        { value: 'DEPLOYING', label: 'در حال راه‌اندازی' },
        { value: 'ACTIVE', label: 'فعال' },
        { value: 'PENDING_PROLONG', label: 'در انتظار تمدید' },
      ], status ?? '')}
      <label class="field admin-resource-owner-field"><span>مالک سرویس</span>
        <input type="hidden" name="owner" value="${ownerId > 0 ? ownerId : ''}" />
        <input type="hidden" name="ownerLabel" value="${escapeHtml(ownerId > 0 ? ownerLabel : '')}" />
        <button type="button" class="owner-select-button" id="select-resource-owner">${icon('person_search')}<span><small>کاربر انتخاب‌شده</small><b data-resource-owner-label>${escapeHtml(ownerLabel)}</b></span>${icon('expand_more')}</button>
      </label>
      <div class="admin-resource-filter__actions"><button type="submit" class="button button--primary">${icon('filter_alt')} اعمال فیلتر</button><button type="button" class="button button--ghost" id="clear-resource-owner" ${ownerId > 0 ? '' : 'disabled'}>${icon('person_remove')} حذف مالک</button><a data-link class="button button--ghost" href="/admin/resources?type=${type}">پاک‌کردن فیلتر</a></div>
    </form>`;

    renderAppShell(`${pageHeader('سرویس‌های کاربران', 'سرویس‌ها بر اساس نوع زیرساخت در دو تب مستقل نمایش داده می‌شوند.')}
      ${card(type === 'TEASPEAK' ? 'سرویس‌های TeaSpeak' : 'سرویس‌های AudioBot', `${filterBody}<div class="admin-resource-table">${table}</div>${pagination(meta.number, meta.totalPages)}`, { icon: type === 'TEASPEAK' ? 'dns' : 'headphones', actions: tabs, className: 'admin-resource-card' })}
    `, 'سرویس‌های کاربران');

    const filterForm = qs<HTMLFormElement>('#admin-resource-filter');
    const ownerInput = qs<HTMLInputElement>('input[name="owner"]', filterForm);
    const ownerLabelInput = qs<HTMLInputElement>('input[name="ownerLabel"]', filterForm);
    const ownerLabelNode = qs<HTMLElement>('[data-resource-owner-label]', filterForm);
    const clearOwnerButton = qs<HTMLButtonElement>('#clear-resource-owner', filterForm);

    document.querySelector('#select-resource-owner')?.addEventListener('click', () => openUserPicker({ title: 'انتخاب مالک سرویس', description: 'کاربری را که مالک سرویس است انتخاب کنید.', onSelect: (selection) => {
      ownerInput.value = String(selection.id);
      ownerLabelInput.value = selection.label;
      ownerLabelNode.textContent = selection.label;
      clearOwnerButton.disabled = false;
    } }));
    clearOwnerButton.addEventListener('click', () => {
      ownerInput.value = '';
      ownerLabelInput.value = '';
      ownerLabelNode.textContent = 'همه کاربران';
      clearOwnerButton.disabled = true;
    });
    filterForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = new FormData(filterForm);
      const query = new URLSearchParams({ type });
      const selectedStatus = String(values.get('status') ?? '');
      const selectedOwner = String(values.get('owner') ?? '');
      const selectedOwnerLabel = String(values.get('ownerLabel') ?? '');
      if (selectedStatus) query.set('status', selectedStatus);
      if (selectedOwner) {
        query.set('owner', selectedOwner);
        if (selectedOwnerLabel) query.set('ownerLabel', selectedOwnerLabel);
      }
      router.navigate(`/admin/resources?${query.toString()}`);
    });
    qsa<HTMLButtonElement>('[data-page]').forEach((button) => button.addEventListener('click', () => {
      const query = new URLSearchParams(location.search);
      query.set('type', type);
      query.set('page', String(Number(button.dataset.page)));
      router.navigate(`/admin/resources?${query.toString()}`);
    }));
  } catch (error) {
    renderAppShell(`${pageHeader('سرویس‌های کاربران', 'فهرست منابع')}${adminError(error)}`, 'سرویس‌های کاربران');
  }
}

function adminTeaSpeakConnection(resource: Models.AbstractResourceDetailResponse): string {
  const address = resource.address?.trim();
  const port = resource.port == null ? '' : String(resource.port);
  if (!address && !port) return '';
  const endpoint = [address, port].filter(Boolean).join(':');
  return card('اتصال TeaSpeak', `<div class="teaspeak-connection teaspeak-connection--admin">
    <div class="teaspeak-connection__endpoint"><span>${icon('lan')}<small>آدرس و پورت</small></span><code dir="ltr">${escapeHtml(endpoint)}</code><button type="button" class="icon-button" data-admin-copy-connection="${escapeHtml(endpoint)}" aria-label="کپی اطلاعات اتصال">${icon('content_copy')}</button></div>
  </div>`, { icon: 'link', className: 'teaspeak-connection-card' });
}

function bindAdminConnectionCopy(): void {
  qsa<HTMLButtonElement>('[data-admin-copy-connection]').forEach((button) => button.addEventListener('click', async () => {
    const value = button.dataset.adminCopyConnection?.trim();
    if (!value) return;
    try { await navigator.clipboard.writeText(value); notify('اطلاعات اتصال کپی شد.', 'success'); }
    catch { notify('کپی خودکار انجام نشد.', 'warning'); }
  }));
}

export async function renderAdminResourceDetail(resourceId:number):Promise<void>{
  renderAppShell(loadingPage(),'جزئیات منبع');
  try{
    const response=await api.call('getResource',{path:{resourceId}});
    const resource=dataOf(response);
    if(!resource)throw new Error('منبع دریافت نشد.');
    const isAudio=resource.resourceType==='AUDIO_BOT';
    const isTeaSpeak=resource.resourceType==='TEASPEAK';
    renderAppShell(`${pageHeader(resource.label||resource.productName||`منبع #${resourceId}`,`${translateEnum(resource.resourceType)} — ${badge(resource.resourceStatus)}`,[{label:'بازگشت',icon:'arrow_forward',href:'/admin/resources',variant:'ghost'}])}
      <div class="detail-grid"><div class="detail-main">
        ${card('مشخصات منبع',`<dl class="description-list description-list--grid"><div><dt>شناسه</dt><dd>${faNumber(resource.id)}</dd></div><div><dt>محصول</dt><dd>${escapeHtml(resource.productName)}</dd></div><div><dt>نوع</dt><dd>${translateEnum(resource.resourceType)}</dd></div><div><dt>وضعیت</dt><dd>${badge(resource.resourceStatus)}</dd></div><div><dt>دوره</dt><dd>${badge(resource.period)}</dd></div><div><dt>تاریخ سفارش</dt><dd>${faDate(resource.orderDate)}</dd></div><div><dt>انقضا</dt><dd>${resourceExpirationCell(resource.expiration)}</dd></div>${isTeaSpeak?`<div><dt>ظرفیت کاربران</dt><dd>${resource.maxClients==null?'—':faNumber(resource.maxClients)}</dd></div><div><dt>آدرس</dt><dd class="ltr">${escapeHtml(resource.address||'—')}</dd></div><div><dt>پورت</dt><dd class="ltr">${resource.port==null?'—':faNumber(resource.port)}</dd></div>`:''}</dl>`,{icon:'info'})}
        ${isTeaSpeak?adminTeaSpeakConnection(resource):''}
      </div>
      <aside>${card('عملیات مدیریتی',`<div class="admin-resource-actions"><button id="admin-start" class="button button--secondary button--block">${icon('play_arrow')} شروع سرویس</button><button id="admin-stop" class="button button--ghost button--block">${icon('stop')} توقف سرویس</button><button id="admin-prolong" class="button button--primary button--block">${icon('event_repeat')} تمدید منبع</button>${!isAudio?`<button id="admin-privilege" class="button button--ghost button--block">${icon('key')} ساخت Privilege</button>`:''}</div><p class="muted">نتیجه هر عملیات مستقیماً از پیام backend نمایش داده می‌شود.</p>`,{icon:'settings'})}</aside></div>`,'جزئیات منبع');
    bindAdminConnectionCopy();
    const runServiceAction=async(start:boolean)=>{
      const operation=isAudio?(start?'startAudioBot':'stopAudioBot'):(start?'startTeaSpeak':'stopTeaSpeak');
      const ok=await runAction(()=>api.call(operation,{path:{resourceId}} as never));
      if(ok)await renderAdminResourceDetail(resourceId);
    };
    document.querySelector('#admin-start')?.addEventListener('click',()=>confirmDialog('شروع سرویس','سرویس راه‌اندازی شود؟','شروع',()=>runServiceAction(true)));
    document.querySelector('#admin-stop')?.addEventListener('click',()=>confirmDialog('توقف سرویس','این عملیات ممکن است ارتباط کاربران را قطع کند.','توقف',()=>runServiceAction(false),true));
    document.querySelector('#admin-prolong')?.addEventListener('click',()=>confirmDialog('تمدید منبع','هزینه و نتیجه عملیات بر اساس backend محاسبه می‌شود.','تمدید',async()=>{if(await runAction(()=>api.call('prolongResource',{path:{resourceId}})))await renderAdminResourceDetail(resourceId);}));
    document.querySelector('#admin-privilege')?.addEventListener('click',()=>confirmDialog('ساخت Privilege','یک کلید دسترسی جدید برای TeaSpeak ساخته شود؟','ساخت کلید',async()=>{await runAction(()=>api.call('newPrivilege',{path:{resourceId}}));}));
  }catch(error){renderAppShell(`${pageHeader('جزئیات منبع','مدیریت سرویس')}${adminError(error)}`,'جزئیات منبع');}
}

export async function renderAdminProducts():Promise<void>{
  renderAppShell(loadingPage(),'محصولات');
  try{const [productsResponse,categoriesResponse,nodesResponse]=await Promise.all([api.call('getAllProducts',{}),api.call('getAllCategories',{}),api.call('getAllAudioBotNodes',{})]);const products=arrayOf<AdminProductDto>(objectOf(productsResponse).data);const categories=dataOf(categoriesResponse)??[];const nodes=dataOf(nodesResponse)??[];renderAppShell(`${pageHeader('مدیریت محصولات','تعریف پلن‌ها، قیمت‌گذاری و کنترل انتشار محصولات.',[{label:'محصول جدید',icon:'add',id:'add-product'}])}
    ${card('محصولات',dataTable<AdminProductDto>([{label:'محصول',render:r=>`<span class="table-primary">${icon(r.productType?.includes('AUDIO')?'headphones':'dns')}<span><b>${escapeHtml(r.productName)}</b><small>${escapeHtml(r.categoryName||r.categorySlug)}</small></span></span>`},{label:'نوع',render:r=>translateEnum(r.productType?.replace('_PRODUCT',''))},{label:'قیمت',render:r=>money(r.price)},{label:'دوره',render:r=>translateEnum(r.period)},{label:'سفارش‌ها',render:r=>faNumber(r.orderedResources)},{label:'وضعیت',render:r=>badge(r.enabled?'ACTIVE':'DISABLED')},{label:'عملیات',render:r=>`<div class="table-actions"><button class="icon-button" data-edit-product="${r.id}" title="ویرایش">${icon('edit')}</button><button class="icon-button" data-toggle-product="${r.id}" data-enabled="${r.enabled}" title="تغییر وضعیت">${icon(r.enabled?'toggle_on':'toggle_off')}</button><button class="icon-button icon-button--danger" data-delete-product="${r.id}" title="حذف">${icon('delete')}</button></div>`}],products),{icon:'inventory_2'})}`,'محصولات');
    document.querySelector('#add-product')?.addEventListener('click',()=>openProductForm(undefined,categories,nodes));qsa<HTMLButtonElement>('[data-edit-product]').forEach(button=>button.addEventListener('click',async()=>{const id=Number(button.dataset.editProduct);try{const response=await api.call('getProduct',{path:{productId:id}});openProductForm(objectOf(response).data as AdminProductDto,categories,nodes);}catch(error){notify(error instanceof ApiError?error.message:'جزئیات محصول دریافت نشد.','error');}}));
    qsa<HTMLButtonElement>('[data-toggle-product]').forEach(button=>button.addEventListener('click',()=>{const id=Number(button.dataset.toggleProduct);const enabled=button.dataset.enabled!=='true';confirmDialog('تغییر وضعیت محصول',`محصول ${enabled?'فعال':'غیرفعال'} شود؟`,'اعمال',async()=>{if(await runAction(()=>api.call('changeEnabled',{path:{productId:id,enabled}})))await renderAdminProducts();});}));
    qsa<HTMLButtonElement>('[data-delete-product]').forEach(button=>button.addEventListener('click',()=>{const id=Number(button.dataset.deleteProduct);confirmDialog('حذف محصول','محصول به‌صورت دائمی حذف می‌شود.','حذف',async()=>{if(await runAction(()=>api.call('deleteProduct',{path:{productId:id}})))await renderAdminProducts();},true);}));
  }catch(error){renderAppShell(`${pageHeader('مدیریت محصولات','تعریف محصولات')}${adminError(error)}`,'محصولات');}
}

function openProductForm(product:AdminProductDto|undefined,categories:Models.CategoryListAdminResponse[],nodes:Models.AudioBotNodeListResponse[]):void{
  const editing=Boolean(product?.id);const rawType=(product?.productType??'TEASPEAK').replace('_PRODUCT','');const form=document.createElement('form');form.className='form-grid';form.innerHTML=`${selectField('type','نوع محصول',[{value:'TEASPEAK',label:'TeaSpeak'},{value:'AUDIO_BOT',label:'AudioBot'}],rawType,true)}${field('productName','نام محصول',{value:product?.productName,required:true})}${selectField('categoryId','دسته‌بندی',categories.map(c=>({value:c.id??'',label:c.name??''})),categories.find(c=>c.slug===product?.categorySlug)?.id,true)}${field('price','قیمت (تومان)',{type:'number',value:product?.price?.amount,required:true,min:0})}<div id="teaspeak-fields" class="field--full">${field('maxClients','حداکثر کاربر',{type:'number',value:product?.maxClients??32,min:1})}</div><div id="audio-fields" class="field--full" hidden>${selectField('providerNodeId','نود ارائه‌دهنده',[{value:'',label:'انتخاب خودکار'},...nodes.map(n=>({value:n.id??'',label:n.name??''}))],product?.providerNodeId??'')}</div>${!editing?selectField('productPeriod','دوره محصول',[{value:'HOURLY',label:'ساعتی'},{value:'DAILY',label:'روزانه'},{value:'MONTHLY',label:'ماهانه'},{value:'BIMONTHLY',label:'دوماهه'},{value:'QUARTERLY',label:'سه‌ماهه'},{value:'SEMIANNUAL',label:'شش‌ماهه'},{value:'ANNUAL',label:'سالانه'}],'MONTHLY',true):''}${!editing?toggleField('enabled','محصول از ابتدا فعال باشد',true):''}`;
  const sync=()=>{const type=qs<HTMLSelectElement>('select[name="type"]',form).value;qs<HTMLElement>('#teaspeak-fields',form).hidden=type!=='TEASPEAK';qs<HTMLElement>('#audio-fields',form).hidden=type!=='AUDIO_BOT';};qs<HTMLSelectElement>('select[name="type"]',form).addEventListener('change',sync);sync();
  openDialog({title:editing?'ویرایش محصول':'افزودن محصول',description:!editing?'فیلدهای درخواست مطابق مثال‌های OpenAPI ساخته می‌شوند؛ schema بدنه addProduct در فایل به اشتباه AbstractNewResourceRequest است.':undefined,content:form,confirmLabel:editing?'ذخیره':'ایجاد محصول',wide:true,onConfirm:async()=>{if(!form.reportValidity())return false;const data=new FormData(form);const type=String(data.get('type'));const price={amount:requiredNumber(data.get('price')),currency:'IRT' as const};let ok:unknown;
    if(editing){const body:Record<string,unknown>={type,productName:String(data.get('productName')??''),categoryId:requiredNumber(data.get('categoryId')),price};if(type==='TEASPEAK')body.maxClients=requiredNumber(data.get('maxClients'));ok=await runAction(()=>api.call('editProduct',{path:{productId:Number(product?.id)},body:body as Models.AbstractProductEditRequest}));}
    else{const body:Record<string,unknown>={type,productName:String(data.get('productName')??''),categoryId:requiredNumber(data.get('categoryId')),price:Number(data.get('price')),enabled:data.get('enabled')==='on',productPeriod:String(data.get('productPeriod')??'MONTHLY')};if(type==='TEASPEAK')body.maxClients=requiredNumber(data.get('maxClients'));else if(data.get('providerNodeId'))body.providerNodeId=requiredNumber(data.get('providerNodeId'));ok=await runAction(()=>api.call('addProduct',{body:body as unknown as Models.AbstractNewResourceRequest}));}
    if(ok)await renderAdminProducts();return Boolean(ok);}});
}

export async function renderAdminCategories():Promise<void>{
  renderAppShell(loadingPage(),'دسته‌بندی‌ها');try{const response=await api.call('getAllCategories',{});const categories=dataOf(response)??[];renderAppShell(`${pageHeader('دسته‌بندی‌ها','ساختار نمایش محصولات در فروشگاه مشتری.',[{label:'دسته جدید',icon:'add',id:'add-category'}])}${card('فهرست دسته‌بندی‌ها',dataTable<Models.CategoryListAdminResponse>([{label:'دسته',render:r=>`<span class="table-primary">${icon(r.productType==='AUDIO_BOT'?'headphones':'category')}<span><b>${escapeHtml(r.name)}</b><small>/${escapeHtml(r.slug)}</small></span></span>`},{label:'نوع',render:r=>translateEnum(r.productType)},{label:'توضیحات',render:r=>escapeHtml(r.description)},{label:'وضعیت',render:r=>badge(r.active?'ACTIVE':'DISABLED')},{label:'عملیات',render:r=>`<div class="table-actions"><button class="icon-button" data-edit-category="${r.id}">${icon('edit')}</button><button class="icon-button icon-button--danger" data-delete-category="${r.id}">${icon('delete')}</button></div>`}],categories),{icon:'category'})}`,'دسته‌بندی‌ها');document.querySelector('#add-category')?.addEventListener('click',()=>openCategoryForm());qsa<HTMLButtonElement>('[data-edit-category]').forEach(button=>button.addEventListener('click',()=>openCategoryForm(categories.find(c=>c.id===Number(button.dataset.editCategory)))));qsa<HTMLButtonElement>('[data-delete-category]').forEach(button=>button.addEventListener('click',()=>confirmDialog('حذف دسته‌بندی','این عملیات دائمی است و ممکن است روی محصولات مرتبط اثر بگذارد.','حذف',async()=>{if(await runAction(()=>api.call('deleteCategory',{path:{categoryId:Number(button.dataset.deleteCategory)}})))await renderAdminCategories();},true)));}catch(error){renderAppShell(`${pageHeader('دسته‌بندی‌ها','مدیریت دسته‌ها')}${adminError(error)}`,'دسته‌بندی‌ها');}
}
function openCategoryForm(category?:Models.CategoryListAdminResponse):void{const form=document.createElement('form');form.className='form-grid';form.innerHTML=`${field('name','نام دسته',{value:category?.name,required:true})}${field('slug','Slug',{value:category?.slug,required:true,dir:'ltr'})}${textarea('description','توضیحات',category?.description??'')}${toggleField('active','دسته فعال باشد',category?.active??true)}`;openDialog({title:category?'ویرایش دسته':'دسته جدید',content:form,confirmLabel:'ذخیره',onConfirm:async()=>{if(!form.reportValidity())return false;const data=new FormData(form);const body={name:String(data.get('name')??''),slug:String(data.get('slug')??''),description:String(data.get('description')??''),active:data.get('active')==='on'};const ok=category?await runAction(()=>api.call('editCategory',{path:{categoryId:Number(category.id)},body})):await runAction(()=>api.call('addCategory',{body}));if(ok)await renderAdminCategories();return Boolean(ok);}});}

function adminTicketStatusHref(status: Models.TicketFilterRequest['status'] | undefined, userId: number, userLabel: string): string {
  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (userId > 0) {
    query.set('user', String(userId));
    if (userLabel) query.set('userLabel', userLabel);
  }
  return `/admin/tickets${query.size ? `?${query.toString()}` : ''}`;
}

export async function renderAdminTickets(page = 0): Promise<void> {
  renderAppShell(loadingPage(), 'تیکت‌ها');
  try {
    const params = new URLSearchParams(location.search);
    const status = params.get('status') as Models.TicketFilterRequest['status'] | null;
    const userId = Number(params.get('user') ?? 0);
    const userLabel = params.get('userLabel') || (userId > 0 ? `کاربر #${faNumber(userId)}` : 'همه کاربران');
    const request = { filterRequest: { page, size: 20, status: status ?? undefined } };
    const response = userId > 0
      ? await api.call('getAllUserTickets', { path: { userId }, query: request })
      : await api.call('getAllTickets', { query: request });
    const tickets = contentOf(response);
    const meta = pageOf(response);

    renderAppShell(`${pageHeader('مدیریت تیکت‌ها', 'بررسی، پاسخ‌گویی و ثبت درخواست برای کاربران.', [{ label: 'تیکت جدید', icon: 'add_comment', id: 'admin-new-ticket' }])}
      <div class="filter-bar filter-bar--with-user">
        <div class="segmented">
          <a data-link class="${!status ? 'active' : ''}" href="${adminTicketStatusHref(undefined, userId, userLabel)}">همه</a>
          <a data-link class="${status === 'PENDING' ? 'active' : ''}" href="${adminTicketStatusHref('PENDING', userId, userLabel)}">در انتظار</a>
          <a data-link class="${status === 'WAITING' ? 'active' : ''}" href="${adminTicketStatusHref('WAITING', userId, userLabel)}">منتظر پاسخ</a>
          <a data-link class="${status === 'CLOSED' ? 'active' : ''}" href="${adminTicketStatusHref('CLOSED', userId, userLabel)}">بسته</a>
        </div>
        <div class="filter-user-control">
          <button type="button" class="owner-select-button owner-select-button--compact" id="select-ticket-user">${icon('person_search')}<span><small>فیلتر کاربر</small><b>${escapeHtml(userLabel)}</b></span>${icon('expand_more')}</button>
          <button type="button" class="icon-button" id="clear-ticket-user" title="حذف فیلتر کاربر" ${userId > 0 ? '' : 'disabled'}>${icon('person_remove')}</button>
        </div>
      </div>
      ${card('فهرست تیکت‌ها', dataTable<Models.TicketListAdminResponse>([
        { label: 'موضوع', render: (row) => `<a data-link class="table-primary" href="/admin/tickets/${row.id}">${icon('chat')}<span><b>${escapeHtml(row.subject)}</b><small>#${faNumber(row.id)}</small></span></a>` },
        { label: 'کاربر', render: (row) => adminUserReference(row.ownerId, row.ownerFullName || `#${row.ownerId}`) },
        { label: 'دپارتمان', render: (row) => translateEnum(row.department) },
        { label: 'وضعیت', render: (row) => badge(row.status) },
        { label: 'آخرین تغییر', render: (row) => faDate(row.lastModified) },
        { label: '', render: (row) => `<a data-link class="icon-button" href="/admin/tickets/${row.id}">${icon('chevron_left')}</a>` },
      ], tickets) + pagination(meta.number, meta.totalPages), { icon: 'forum' })}
    `, 'تیکت‌ها');

    document.querySelector('#admin-new-ticket')?.addEventListener('click', openAdminTicket);
    document.querySelector('#select-ticket-user')?.addEventListener('click', () => openUserPicker({
      title: 'فیلتر تیکت‌ها بر اساس کاربر',
      onSelect: (selection) => {
        const query = new URLSearchParams(location.search);
        query.set('user', String(selection.id));
        query.set('userLabel', selection.label);
        query.delete('page');
        router.navigate(`/admin/tickets?${query.toString()}`);
      },
    }));
    document.querySelector('#clear-ticket-user')?.addEventListener('click', () => {
      const query = new URLSearchParams(location.search);
      query.delete('user');
      query.delete('userLabel');
      query.delete('page');
      router.navigate(`/admin/tickets${query.size ? `?${query.toString()}` : ''}`);
    });
    qsa<HTMLButtonElement>('[data-page]').forEach((button) => button.addEventListener('click', () => {
      const query = new URLSearchParams(location.search);
      query.set('page', String(Number(button.dataset.page)));
      router.navigate(`/admin/tickets?${query.toString()}`);
    }));
  } catch (error) {
    renderAppShell(`${pageHeader('مدیریت تیکت‌ها', 'فهرست تیکت‌ها')}${adminError(error)}`, 'تیکت‌ها');
  }
}

function openAdminTicket(): void {
  const form = document.createElement('form');
  form.className = 'form-grid';
  form.innerHTML = `
    <label class="field field--full"><span>کاربر مقصد<b>*</b></span>
      <input type="hidden" name="targetUserId" />
      <button type="button" class="owner-select-button" id="select-ticket-target">${icon('person_search')}<span><small>کاربر انتخاب‌شده</small><b data-ticket-target-label>انتخاب کاربر</b></span>${icon('expand_more')}</button>
    </label>
    ${field('subject', 'موضوع', { required: true })}
    ${selectField('department', 'دپارتمان', [{ value: 'TECHNICAL', label: 'فنی' }, { value: 'SALES', label: 'فروش' }], 'TECHNICAL', true)}
    ${field('relatedResourceId', 'شناسه سرویس مرتبط', { type: 'number', min: 1 })}
    ${textarea('message', 'پیام', '', true)}
    <label class="field field--full"><span>پیوست</span><input type="file" name="files" multiple /><small>فایل‌های انتخاب‌شده را قبل از ارسال می‌توانید حذف کنید.</small></label><div class="ticket-selected-files ticket-selected-files--form field--full" data-file-list hidden></div>`;

  const ticketFiles = bindFileSelection(qs<HTMLInputElement>('input[type="file"]', form), qs<HTMLElement>('[data-file-list]', form));

  const dialog = openDialog({
    title: 'ثبت تیکت توسط مدیر',
    description: 'تیکت برای کاربر انتخاب‌شده ثبت می‌شود و targetUserId به‌صورت query parameter ارسال خواهد شد.',
    content: form,
    confirmLabel: 'ارسال',
    wide: true,
    onConfirm: async () => {
      if (!form.reportValidity()) return false;
      const data = new FormData(form);
      const targetUserId = Number(data.get('targetUserId'));
      if (!Number.isSafeInteger(targetUserId) || targetUserId < 1) {
        notify('ابتدا کاربر مقصد را انتخاب کنید.', 'warning');
        return false;
      }
      const ticket = {
        subject: String(data.get('subject') ?? ''),
        department: String(data.get('department') ?? ''),
        relatedResourceId: data.get('relatedResourceId') ? Number(data.get('relatedResourceId')) : undefined,
        message: { content: String(data.get('message') ?? '') },
      };
      const body = new FormData();
      body.append('ticket', new Blob([JSON.stringify(ticket)], { type: 'application/json' }));
      ticketFiles.files().forEach((file) => body.append('files', file));
      const ok = await runAction(() => api.call('submitTicket_1', { query: { targetUserId }, body }));
      if (ok) await renderAdminTickets();
      return Boolean(ok);
    },
  });

  qs<HTMLButtonElement>('#select-ticket-target', dialog).addEventListener('click', () => openUserPicker({
    title: 'انتخاب کاربر مقصد تیکت',
    description: 'تیکت جدید از طرف مدیریت برای این کاربر ثبت می‌شود.',
    onSelect: (selection) => {
      qs<HTMLInputElement>('input[name="targetUserId"]', form).value = String(selection.id);
      qs<HTMLElement>('[data-ticket-target-label]', form).textContent = selection.label;
    },
  }));
}

export async function renderAdminTicketDetail(ticketId: number): Promise<void> {
  renderAppShell(loadingPage(), 'جزئیات تیکت');
  try {
    const response = await api.call('getTicketDetails_1', { path: { ticketId } });
    const ticket = dataOf(response);
    if (!ticket) throw new Error('جزئیات تیکت دریافت نشد.');

    const messages = (ticket.messages ?? []).map((message) => renderTicketMessage(message, 'staff')).join('');
    renderAppShell(`${pageHeader(
      ticket.subject || `تیکت #${ticketId}`,
      `${escapeHtml(ticket.ownerFullName)} — ${translateEnum(ticket.department)}`,
      [
        { label: 'بازگشت', icon: 'arrow_forward', href: '/admin/tickets', variant: 'ghost' },
        { label: 'ویرایش تیکت', icon: 'edit', id: 'edit-ticket', variant: 'secondary' },
      ],
    )}
      <div class="ticket-layout">
        <section class="ticket-thread">
          <header><div>${adminUserReference(ticket.ownerId, `کاربر #${faNumber(ticket.ownerId)}`)}${badge(ticket.status)}</div><small>${faDate(ticket.createdAt)}</small></header>
          <div class="messages">${messages}</div>
          ${ticket.status !== 'CLOSED' ? `<form id="admin-ticket-reply" class="reply-box">
            <textarea name="content" placeholder="پاسخ پشتیبانی…" required></textarea>
            <div class="ticket-selected-files" data-file-list hidden></div>
            <div class="reply-box__actions"><label class="icon-button file-button" title="افزودن پیوست">${icon('attach_file')}<input type="file" name="files" multiple hidden/></label><button class="button button--primary">ارسال پاسخ ${icon('send')}</button></div>
          </form>` : `<div class="notice notice--neutral">${icon('lock')} این تیکت بسته شده و امکان ارسال پیام جدید وجود ندارد.</div>`}
        </section>
        <aside>${card('اطلاعات تیکت', `<dl class="description-list"><div><dt>وضعیت</dt><dd>${badge(ticket.status)}</dd></div><div><dt>دپارتمان</dt><dd>${translateEnum(ticket.department)}</dd></div><div><dt>سرویس</dt><dd>${escapeHtml(ticket.serviceName || '—')}</dd></div><div><dt>آخرین تغییر</dt><dd>${faDate(ticket.lastModified)}</dd></div></dl>`, { icon: 'info' })}</aside>
      </div>`, 'جزئیات تیکت');

    document.querySelector('#edit-ticket')?.addEventListener('click', () => {
      const form = document.createElement('form');
      form.className = 'form-grid';
      form.innerHTML = `${field('subject', 'موضوع', { value: ticket.subject })}${selectField('status', 'وضعیت', [{ value: 'PENDING', label: 'در انتظار' }, { value: 'WAITING', label: 'منتظر پاسخ' }, { value: 'RESPONDED', label: 'پاسخ داده‌شده' }, { value: 'CLOSED', label: 'بسته' }], ticket.status, true)}${selectField('department', 'دپارتمان', [{ value: 'TECHNICAL', label: 'فنی' }, { value: 'SALES', label: 'فروش' }], ticket.department, true)}`;
      openDialog({
        title: 'ویرایش تیکت',
        content: form,
        confirmLabel: 'ذخیره',
        onConfirm: async () => {
          const data = new FormData(form);
          const ok = await runAction(() => api.call('editTicket', {
            path: { ticketId },
            body: {
              subject: String(data.get('subject') ?? ''),
              status: String(data.get('status')) as Models.TicketEditAdminRequest['status'],
              department: String(data.get('department')) as Models.TicketEditAdminRequest['department'],
            },
          }));
          if (ok) await renderAdminTicketDetail(ticketId);
          return Boolean(ok);
        },
      });
    });

    const replyForm = document.querySelector<HTMLFormElement>('#admin-ticket-reply');
    if (replyForm) {
      const fileSelection = bindFileSelection(
        qs<HTMLInputElement>('input[type="file"]', replyForm),
        qs<HTMLElement>('[data-file-list]', replyForm),
      );
      replyForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!replyForm.reportValidity()) return;
        const data = new FormData(replyForm);
        const body = new FormData();
        body.append('content', String(data.get('content') ?? ''));
        fileSelection.files().forEach((file) => body.append('files', file));
        if (await runAction(() => api.call('addTicketMessage', { path: { ticketId }, body }))) {
          await renderAdminTicketDetail(ticketId);
        }
      });
    }

    qsa<HTMLButtonElement>('[data-attachment]').forEach((button) => button.addEventListener('click', async () => {
      try {
        const blob = await api.call('getAttachment', { path: { identifier: button.dataset.attachment ?? '' } });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = button.dataset.filename || 'attachment';
        anchor.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        notify(error instanceof ApiError ? error.message : 'دانلود انجام نشد.', 'error');
      }
    }));
  } catch (error) {
    renderAppShell(`${pageHeader('جزئیات تیکت', 'گفت‌وگو')}${adminError(error)}`, 'جزئیات تیکت');
  }
}

function adminInvoiceStatusHref(status: Models.InvoiceAdminFilterRequest['status'] | undefined, userId: number, userLabel: string): string {
  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (userId > 0) {
    query.set('user', String(userId));
    if (userLabel) query.set('userLabel', userLabel);
  }
  return `/admin/invoices${query.size ? `?${query.toString()}` : ''}`;
}

export async function renderAdminInvoices(page = 0): Promise<void> {
  renderAppShell(loadingPage(), 'فاکتورها');
  try {
    const params = new URLSearchParams(location.search);
    const status = params.get('status') as Models.InvoiceAdminFilterRequest['status'] | null;
    const userId = Number(params.get('user') ?? 0);
    const userLabel = params.get('userLabel') || (userId > 0 ? `کاربر #${faNumber(userId)}` : 'همه کاربران');
    const response = await api.call('getAllInvoices', { query: { filterRequest: { page, size: 20, status: status ?? undefined, byUserId: userId > 0 ? userId : undefined } } });
    const invoices = contentOf(response);
    const meta = pageOf(response);

    renderAppShell(`${pageHeader('مدیریت فاکتورها', 'پیگیری پرداخت‌ها و صدور فاکتور بدهی برای کاربران.', [{ label: 'صدور فاکتور بدهی', icon: 'post_add', id: 'debt-invoice' }])}
      <div class="filter-bar filter-bar--with-user">
        <div class="segmented">
          <a data-link class="${!status ? 'active' : ''}" href="${adminInvoiceStatusHref(undefined, userId, userLabel)}">همه</a>
          <a data-link class="${status === 'PENDING' ? 'active' : ''}" href="${adminInvoiceStatusHref('PENDING', userId, userLabel)}">در انتظار</a>
          <a data-link class="${status === 'PAID' ? 'active' : ''}" href="${adminInvoiceStatusHref('PAID', userId, userLabel)}">پرداخت‌شده</a>
          <a data-link class="${status === 'CANCELLED' ? 'active' : ''}" href="${adminInvoiceStatusHref('CANCELLED', userId, userLabel)}">لغوشده</a>
        </div>
        <div class="filter-user-control">
          <button type="button" class="owner-select-button owner-select-button--compact" id="select-invoice-user">${icon('person_search')}<span><small>فیلتر کاربر</small><b>${escapeHtml(userLabel)}</b></span>${icon('expand_more')}</button>
          <button type="button" class="icon-button" id="clear-invoice-user" title="حذف فیلتر کاربر" ${userId > 0 ? '' : 'disabled'}>${icon('person_remove')}</button>
        </div>
      </div>
      ${card('فاکتورها', dataTable<Models.InvoiceAdminResponse>([
        { label: 'توکن', render: (row) => `<span class="ltr strong">${escapeHtml(row.invoiceToken?.slice(0, 12))}…</span>` },
        { label: 'کاربر', render: (row) => adminUserReference(row.ownerId) },
        { label: 'مبلغ', render: (row) => money(row.money) },
        { label: 'وضعیت', render: (row) => badge(row.status) },
        { label: 'ایجاد', render: (row) => faDate(row.createdAt) },
        { label: 'تراکنش', render: (row) => row.paymentTransaction ? `<span><b>${escapeHtml(row.paymentTransaction.gatewayName)}</b><small class="block ltr">${escapeHtml(row.paymentTransaction.trackingId)}</small></span>` : '—' },
      ], invoices) + pagination(meta.number, meta.totalPages), { icon: 'request_quote' })}
    `, 'فاکتورها');

    document.querySelector('#debt-invoice')?.addEventListener('click', openDebtInvoice);
    document.querySelector('#select-invoice-user')?.addEventListener('click', () => openUserPicker({
      title: 'فیلتر فاکتورها بر اساس کاربر',
      onSelect: (selection) => {
        const query = new URLSearchParams(location.search);
        query.set('user', String(selection.id));
        query.set('userLabel', selection.label);
        query.delete('page');
        router.navigate(`/admin/invoices?${query.toString()}`);
      },
    }));
    document.querySelector('#clear-invoice-user')?.addEventListener('click', () => {
      const query = new URLSearchParams(location.search);
      query.delete('user');
      query.delete('userLabel');
      query.delete('page');
      router.navigate(`/admin/invoices${query.size ? `?${query.toString()}` : ''}`);
    });
    qsa<HTMLButtonElement>('[data-page]').forEach((button) => button.addEventListener('click', () => {
      const query = new URLSearchParams(location.search);
      query.set('page', String(Number(button.dataset.page)));
      router.navigate(`/admin/invoices?${query.toString()}`);
    }));
  } catch (error) {
    renderAppShell(`${pageHeader('مدیریت فاکتورها', 'فاکتورها')}${adminError(error)}`, 'فاکتورها');
  }
}

function openDebtInvoice(): void {
  const form = document.createElement('form');
  form.className = 'form-grid';
  form.innerHTML = `
    <label class="field field--full"><span>کاربر بدهکار<b>*</b></span>
      <input type="hidden" name="targetUserId" />
      <button type="button" class="owner-select-button" id="select-debt-user">${icon('person_search')}<span><small>کاربر انتخاب‌شده</small><b data-debt-user-label>انتخاب کاربر</b></span>${icon('expand_more')}</button>
    </label>
    ${field('amount', 'مبلغ (تومان)', { type: 'number', required: true, min: 1 })}
    ${textarea('description', 'شرح فاکتور', '', true)}`;

  const dialog = openDialog({
    title: 'صدور فاکتور بدهی',
    description: 'فاکتور برای کاربر انتخاب‌شده صادر می‌شود و توکن آن در پاسخ backend بازمی‌گردد.',
    content: form,
    confirmLabel: 'صدور فاکتور',
    onConfirm: async () => {
      if (!form.reportValidity()) return false;
      const data = new FormData(form);
      const targetUserId = Number(data.get('targetUserId'));
      if (!Number.isSafeInteger(targetUserId) || targetUserId < 1) {
        notify('ابتدا کاربر بدهکار را انتخاب کنید.', 'warning');
        return false;
      }
      const ok = await runAction(() => api.call('sendDebtInvoice', { body: {
        targetUserId,
        amount: { amount: requiredNumber(data.get('amount')), currency: 'IRT' },
        description: String(data.get('description') ?? ''),
      } }));
      if (ok) await renderAdminInvoices();
      return Boolean(ok);
    },
  });

  qs<HTMLButtonElement>('#select-debt-user', dialog).addEventListener('click', () => openUserPicker({
    title: 'انتخاب کاربر بدهکار',
    onSelect: (selection) => {
      qs<HTMLInputElement>('input[name="targetUserId"]', form).value = String(selection.id);
      qs<HTMLElement>('[data-debt-user-label]', form).textContent = selection.label;
    },
  }));
}

export async function renderAdminGateways():Promise<void>{
  renderAppShell(loadingPage(),'درگاه‌های پرداخت');try{const [gatewaysResponse,modulesResponse]=await Promise.all([api.call('getGateways',{}),api.call('getModules',{})]);const gateways=dataOf(gatewaysResponse)??[];const modules=dataOf(modulesResponse)??[];renderAppShell(`${pageHeader('درگاه‌های پرداخت','پیکربندی ماژول‌های پرداخت پشتیبانی‌شده.',[{label:'افزودن درگاه',icon:'add_card',id:'add-gateway'}])}<div class="module-strip"><span>ماژول‌های قابل استفاده:</span>${modules.map(module=>`<b>${escapeHtml(translateEnum(module))}</b>`).join('')||'<em>موردی اعلام نشده است</em>'}</div><div class="gateway-admin-grid">${gateways.map(g=>`<article class="gateway-admin-card"><header><span>${icon('account_balance')}</span>${badge(g.active?'ACTIVE':'DISABLED')}</header><h3>${escapeHtml(g.name)}</h3><p>${escapeHtml(translateEnum(g.type))}</p><footer><button class="button button--secondary button--block" data-gateway="${g.id}">${icon('settings')} مشاهده و ویرایش</button></footer></article>`).join('')||emptyState('درگاهی تعریف نشده','یک پیکربندی Aqaye Pardakht اضافه کنید.')}</div>`,'درگاه‌های پرداخت');document.querySelector('#add-gateway')?.addEventListener('click',()=>openGatewayForm());qsa<HTMLButtonElement>('[data-gateway]').forEach(button=>button.addEventListener('click',async()=>{try{const response=await api.call('getGatewayDetails',{path:{gatewayId:Number(button.dataset.gateway)}});openGatewayForm(dataOf(response));}catch(error){notify(error instanceof ApiError?error.message:'جزئیات درگاه دریافت نشد.','error');}}));}catch(error){renderAppShell(`${pageHeader('درگاه‌های پرداخت','پیکربندی پرداخت')}${adminError(error)}`,'درگاه‌های پرداخت');}
}
function openGatewayForm(gateway?:Models.Gateway):void{const form=document.createElement('form');form.className='form-grid';form.innerHTML=`${field('name','نام نمایشی',{value:gateway?.name,required:true})}${selectField('type','ماژول',[{value:'AQAYE_PARDAKHT',label:'آقای پرداخت'}],gateway?.type??'AQAYE_PARDAKHT',true)}${field('merchantId','Merchant ID',{required:true,dir:'ltr'})}${toggleField('active','درگاه فعال باشد',gateway?.active??true)}`;openDialog({title:gateway?'ویرایش پیکربندی درگاه':'افزودن درگاه',content:form,confirmLabel:'ذخیره',onConfirm:async()=>{if(!form.reportValidity())return false;const data=new FormData(form);const ok=await runAction(()=>api.call('addGatewayConfig',{body:{name:String(data.get('name')??''),type:'AQAYE_PARDAKHT',merchantId:String(data.get('merchantId')??''),active:data.get('active')==='on'}}));if(ok)await renderAdminGateways();return Boolean(ok);}});}

export async function renderQueryInstances(): Promise<void> {
  renderAppShell(loadingPage(), 'نودهای Query');
  try {
    const response = await api.call('getAllQueryInstance', {});
    const instances = dataOf(response) ?? [];
    const table = dataTable<Models.QueryInstanceListResponse>([
      {
        label: 'Query Instance',
        render: (instance) => `<span class="table-primary">${icon('lan')}<span><b>${escapeHtml(instance.name || 'بدون نام')}</b><small>شناسه ${faNumber(instance.id)}</small></span></span>`,
      },
      {
        label: 'وضعیت استقرار',
        render: (instance) => runtimeStatus(instance.status, Boolean(instance.active)),
      },
      {
        label: 'ظرفیت',
        render: (instance) => capacityCell(Number(instance.usedInstanceSlot ?? 0), Number(instance.maxTeaSpeakInstance ?? 0), 'سرویس'),
      },
      {
        label: 'محدوده پورت',
        render: (instance) => `<span class="ltr infrastructure-port">${faNumber(instance.startPort)} — ${faNumber(instance.stopPort)}</span>`,
      },
      {
        label: 'دسترسی',
        render: (instance) => badge(instance.active ? 'ACTIVE' : 'DISABLED'),
      },
      {
        label: '',
        className: 'table-actions-cell',
        render: (instance) => `<div class="table-actions">
          <a data-link class="button button--secondary button--small" href="/admin/query-instances/${instance.id}">${icon('visibility')} جزئیات</a>
          <button type="button" class="icon-button" data-edit-query="${instance.id}" aria-label="ویرایش Query Instance" title="ویرایش">${icon('edit')}</button>
          <button type="button" class="icon-button" data-toggle-query="${instance.id}" data-active="${instance.active}" aria-label="${instance.active ? 'غیرفعال‌سازی' : 'فعال‌سازی'}" title="${instance.active ? 'غیرفعال‌سازی' : 'فعال‌سازی'}">${icon(instance.active ? 'pause' : 'play_arrow')}</button>
          <button type="button" class="icon-button icon-button--danger" data-delete-query="${instance.id}" aria-label="حذف Query Instance" title="حذف">${icon('delete')}</button>
        </div>`,
      },
    ], instances, {
      emptyTitle: 'Query Instance وجود ندارد',
      emptyText: 'برای Provisioning سرورهای TeaSpeak یک instance تعریف کنید.',
    });

    renderAppShell(`${pageHeader('نودهای Query TeaSpeak', 'مدیریت اتصال Query، وضعیت استقرار، محدوده پورت و ظرفیت Provisioning.', [{ label: 'Instance جدید', icon: 'add', id: 'add-query' }])}${card('فهرست Query Instanceها', table, { icon: 'lan', className: 'infrastructure-table-card' })}`, 'نودهای Query');

    document.querySelector('#add-query')?.addEventListener('click', () => openQueryForm());
    qsa<HTMLButtonElement>('[data-edit-query]').forEach((button) => button.addEventListener('click', () => openQueryForm(instances.find((item) => item.id === Number(button.dataset.editQuery)))));
    qsa<HTMLButtonElement>('[data-toggle-query]').forEach((button) => button.addEventListener('click', () => {
      const id = Number(button.dataset.toggleQuery);
      const active = button.dataset.active === 'true';
      confirmDialog(
        active ? 'غیرفعال‌کردن Instance' : 'فعال‌کردن Instance',
        active ? 'Provisioning جدید روی این اتصال متوقف می‌شود.' : 'Instance مجدداً dispatch می‌شود.',
        active ? 'غیرفعال‌سازی' : 'فعال‌سازی',
        async () => {
          const ok = active
            ? await runAction(() => api.call('disableQueryInstance', { path: { id } }))
            : await runAction(() => api.call('enableQueryInstance', { path: { id } }));
          if (ok) await renderQueryInstances();
        },
        active,
      );
    }));
    qsa<HTMLButtonElement>('[data-delete-query]').forEach((button) => button.addEventListener('click', () => confirmDialog(
      'حذف Query Instance',
      'اتصال از lifecycle برنامه حذف می‌شود.',
      'حذف',
      async () => {
        if (await runAction(() => api.call('removeQueryInstance', { path: { id: Number(button.dataset.deleteQuery) } }))) await renderQueryInstances();
      },
      true,
    )));
  } catch (error) {
    renderAppShell(`${pageHeader('نودهای Query', 'زیرساخت TeaSpeak')}${adminError(error)}`, 'نودهای Query');
  }
}
export async function renderQueryInstanceDetail(instanceId: number): Promise<void> {
  renderAppShell(loadingPage(), 'جزئیات نود Query');
  try {
    const response = await api.call('getAllQueryInstance', {});
    const instances = dataOf(response) ?? [];
    const instance = instances.find((item) => Number(item.id) === instanceId);
    if (!instance) throw new Error('نود Query موردنظر پیدا نشد.');
    renderAppShell(`${pageHeader(instance.name || `نود Query #${instanceId}`, 'جزئیات runtime، ظرفیت و محدوده پورت نود TeaSpeak.', [{ label: 'بازگشت', icon: 'arrow_forward', href: '/admin/query-instances', variant: 'ghost' }])}
      <div class="detail-grid"><div class="detail-main">
        ${card('مشخصات نود Query', `<dl class="description-list description-list--grid"><div><dt>شناسه</dt><dd>#${faNumber(instance.id)}</dd></div><div><dt>نام</dt><dd>${escapeHtml(instance.name || '—')}</dd></div><div><dt>وضعیت runtime</dt><dd>${runtimeStatus(instance.status, Boolean(instance.active))}</dd></div><div><dt>دسترسی</dt><dd>${badge(instance.active ? 'ACTIVE' : 'DISABLED')}</dd></div><div><dt>شروع پورت</dt><dd class="ltr">${faNumber(instance.startPort)}</dd></div><div><dt>پایان پورت</dt><dd class="ltr">${faNumber(instance.stopPort)}</dd></div></dl>`, { icon: 'lan' })}
        ${card('ظرفیت Provisioning', `${capacityCell(Number(instance.usedInstanceSlot ?? 0), Number(instance.maxTeaSpeakInstance ?? 0), 'سرویس')}<p class="muted">ظرفیت مصرف‌شده بر اساس آخرین پاسخ backend نمایش داده می‌شود.</p>`, { icon: 'speed' })}
      </div><aside>${card('عملیات نود', `<div class="admin-resource-actions"><button type="button" class="button button--secondary button--block" id="detail-edit-query">${icon('edit')} ویرایش نود</button><button type="button" class="button button--ghost button--block" id="detail-toggle-query">${icon(instance.active ? 'pause' : 'play_arrow')} ${instance.active ? 'غیرفعال‌سازی' : 'فعال‌سازی'}</button></div>`, { icon: 'settings' })}</aside></div>
    `, 'جزئیات نود Query');
    document.querySelector('#detail-edit-query')?.addEventListener('click', () => openQueryForm(instance));
    document.querySelector('#detail-toggle-query')?.addEventListener('click', () => {
      const active = Boolean(instance.active);
      confirmDialog(active ? 'غیرفعال‌کردن Instance' : 'فعال‌کردن Instance', active ? 'Provisioning جدید روی این اتصال متوقف می‌شود.' : 'Instance مجدداً dispatch می‌شود.', active ? 'غیرفعال‌سازی' : 'فعال‌سازی', async () => {
        const ok = active
          ? await runAction(() => api.call('disableQueryInstance', { path: { id: instanceId } }))
          : await runAction(() => api.call('enableQueryInstance', { path: { id: instanceId } }));
        if (ok) await renderQueryInstanceDetail(instanceId);
      }, active);
    });
  } catch (error) {
    renderAppShell(`${pageHeader('جزئیات نود Query', 'زیرساخت TeaSpeak')}${adminError(error)}`, 'جزئیات نود Query');
  }
}

function openQueryForm(instance?:Models.QueryInstanceListResponse):void{const form=document.createElement('form');form.className='form-grid';form.innerHTML=`${field('name','نام',{value:instance?.name,required:true})}${field('queryIpAddress','آدرس IP',{required:true,dir:'ltr'})}${field('queryPort','پورت Query',{type:'number',value:10011,required:true,min:1})}${field('queryUsername','نام کاربری',{required:true,dir:'ltr'})}${field('queryPassword','رمز عبور',{type:'password',required:true,dir:'ltr'})}${field('defaultQueryServerGroupId','شناسه گروه پیش‌فرض',{type:'number',required:true,min:0})}${field('maxTeaSpeakInstance','حداکثر Instance',{type:'number',value:instance?.maxTeaSpeakInstance??10,required:true,min:1})}${field('startPort','شروع پورت',{type:'number',value:instance?.startPort??9987,min:1})}${field('stopPort','پایان پورت',{type:'number',value:instance?.stopPort??10000,min:1})}${toggleField('enabled','فعال باشد',instance?.active??true)}`;openDialog({title:instance?'ویرایش Query Instance':'Query Instance جدید',content:form,confirmLabel:'ذخیره',wide:true,onConfirm:async()=>{if(!form.reportValidity())return false;const data=new FormData(form);const body={name:String(data.get('name')??''),queryIpAddress:String(data.get('queryIpAddress')??''),queryPort:requiredNumber(data.get('queryPort')),queryUsername:String(data.get('queryUsername')??''),queryPassword:String(data.get('queryPassword')??''),defaultQueryServerGroupId:requiredNumber(data.get('defaultQueryServerGroupId')),maxTeaSpeakInstance:requiredNumber(data.get('maxTeaSpeakInstance')),startPort:requiredNumber(data.get('startPort')),stopPort:requiredNumber(data.get('stopPort')),enabled:data.get('enabled')==='on'};const ok=instance?await runAction(()=>api.call('editQueryInstance',{path:{id:Number(instance.id)},body})):await runAction(()=>api.call('initQueryInstance',{body}));if(ok)await renderQueryInstances();return Boolean(ok);}});}

export async function renderAudioNodes(): Promise<void> {
  renderAppShell(loadingPage(), 'نودهای ربات موزیک');
  try {
    const response = await api.call('getAllAudioBotNodes', {});
    const nodes = dataOf(response) ?? [];
    const table = dataTable<Models.AudioBotNodeListResponse>([
      {
        label: 'نود AudioBot',
        render: (node) => `<span class="table-primary">${icon('headphones')}<span><b>${escapeHtml(node.name || 'بدون نام')}</b><small class="ltr">${escapeHtml(node.webAddress || '—')}</small></span></span>`,
      },
      {
        label: 'وضعیت نود',
        render: (node) => runtimeStatus(node.nodeStatus, Boolean(node.enabled)),
      },
      {
        label: 'ظرفیت',
        render: (node) => `<span class="infrastructure-capacity"><b>${faNumber(node.maxBotInstance)}</b><small>حداکثر ربات</small></span>`,
      },
      {
        label: 'دسترسی',
        render: (node) => badge(node.enabled ? 'ACTIVE' : 'DISABLED'),
      },
      {
        label: '',
        className: 'table-actions-cell',
        render: (node) => `<div class="table-actions">
          <a data-link class="button button--secondary button--small" href="/admin/audio-nodes/${node.id}">${icon('visibility')} جزئیات</a>
          <button type="button" class="icon-button" data-edit-node="${node.id}" aria-label="ویرایش نود" title="ویرایش">${icon('edit')}</button>
          <button type="button" class="icon-button icon-button--danger" data-delete-node="${node.id}" aria-label="حذف نود" title="حذف">${icon('delete')}</button>
        </div>`,
      },
    ], nodes, {
      emptyTitle: 'نود AudioBot وجود ندارد',
      emptyText: 'برای ارائه سرویس ربات صوتی یک نود اضافه کنید.',
    });

    renderAppShell(`${pageHeader('نودهای ربات موزیک', 'مدیریت وضعیت، ظرفیت و اتصال providerهای AudioBot.', [{ label: 'نود جدید', icon: 'add', id: 'add-node' }])}${card('فهرست نودهای AudioBot', table, { icon: 'headphones', className: 'infrastructure-table-card' })}`, 'نودهای ربات موزیک');

    document.querySelector('#add-node')?.addEventListener('click', () => openNodeForm());
    qsa<HTMLButtonElement>('[data-edit-node]').forEach((button) => button.addEventListener('click', () => openNodeForm(nodes.find((node) => node.id === Number(button.dataset.editNode)))));
    qsa<HTMLButtonElement>('[data-delete-node]').forEach((button) => button.addEventListener('click', () => confirmDialog(
      'حذف نود AudioBot',
      'نود دارای resource فعال قابل حذف نیست.',
      'حذف',
      async () => {
        if (await runAction(() => api.call('deleteAudioBotNode', { path: { nodeId: Number(button.dataset.deleteNode) } }))) await renderAudioNodes();
      },
      true,
    )));
  } catch (error) {
    renderAppShell(`${pageHeader('نودهای ربات موزیک', 'زیرساخت AudioBot')}${adminError(error)}`, 'نودهای ربات موزیک');
  }
}
function openNodeForm(node?:Models.AudioBotNodeListResponse):void{const form=document.createElement('form');form.className='form-grid';form.innerHTML=`${field('name','نام نود',{value:node?.name,required:true})}${!node?field('webAddress','آدرس وب',{value:'',required:true,dir:'ltr',placeholder:'http://host:45855',hint:'آدرس نباید با / پایان یابد.'}):''}${field('username','نام کاربری',{required:true,dir:'ltr'})}${field('password','رمز عبور',{type:'password',required:true,dir:'ltr'})}${field('maxBotInstance','حداکثر Bot',{type:'number',value:node?.maxBotInstance??10,required:true,min:1})}${toggleField('enabled','نود فعال باشد',node?.enabled??true)}`;openDialog({title:node?'ویرایش نود':'نود AudioBot جدید',content:form,confirmLabel:'ذخیره',onConfirm:async()=>{if(!form.reportValidity())return false;const data=new FormData(form);const common={name:String(data.get('name')??''),username:String(data.get('username')??''),password:String(data.get('password')??''),maxBotInstance:requiredNumber(data.get('maxBotInstance')),enabled:data.get('enabled')==='on'};const ok=node?await runAction(()=>api.call('editAudioBotNode',{path:{nodeId:Number(node.id)},body:common})):await runAction(()=>api.call('initAudioBotNode',{body:{...common,webAddress:String(data.get('webAddress')??'')}}));if(ok)await renderAudioNodes();return Boolean(ok);}});}
export async function renderAudioNodeDetail(nodeId: number): Promise<void> {
  renderAppShell(loadingPage(), 'جزئیات نود AudioBot');
  try {
    const response = await api.call('getAudioBotNodeDetail', { path: { nodeId } });
    const node = dataOf(response);
    if (!node) throw new Error('جزئیات نود دریافت نشد.');
    renderAppShell(`${pageHeader(node.name || `نود AudioBot #${nodeId}`, 'جزئیات اتصال، وضعیت و ظرفیت نود ربات موسیقی.', [{ label: 'بازگشت', icon: 'arrow_forward', href: '/admin/audio-nodes', variant: 'ghost' }])}
      <div class="detail-grid"><div class="detail-main">
        ${card('مشخصات نود AudioBot', `<div class="node-detail__hero"><span>${icon('headphones')}</span><div><h3>${escapeHtml(node.name || 'بدون نام')}</h3><p class="ltr">${escapeHtml(node.webAddress || '—')}</p>${runtimeStatus(node.nodeStatus, Boolean(node.enabled))}</div></div><dl class="description-list description-list--grid"><div><dt>شناسه</dt><dd>#${faNumber(node.id)}</dd></div><div><dt>نام کاربری</dt><dd class="ltr">${escapeHtml(node.username || '—')}</dd></div><div><dt>راه‌اندازی</dt><dd>${faDate(node.initiatedAt)}</dd></div><div><dt>آخرین استفاده</dt><dd>${faDate(node.lastUsed)}</dd></div><div><dt>دسترسی</dt><dd>${badge(node.enabled ? 'ACTIVE' : 'DISABLED')}</dd></div><div><dt>ظرفیت تکمیل</dt><dd>${badge(node.full ? 'FULL' : 'ACTIVE')}</dd></div></dl>`, { icon: 'info' })}
        <div class="stats-grid stats-grid--three">${statCard('آنلاین', faNumber(node.onlineInstanceCount), 'sensors', 'Botهای آنلاین', 'cyan')}${statCard('کل Instance', faNumber(node.allInstanceCount), 'apps', 'مصرف ثبت‌شده', 'blue')}${statCard('ظرفیت', faNumber(node.maxBotInstance), 'speed', 'حداکثر Bot', 'purple')}</div>
      </div><aside>${card('عملیات نود', `<button type="button" class="button button--secondary button--block" id="detail-edit-audio-node">${icon('edit')} ویرایش نود</button>`, { icon: 'settings' })}</aside></div>
    `, 'جزئیات نود AudioBot');
    document.querySelector('#detail-edit-audio-node')?.addEventListener('click', () => openNodeForm(node));
  } catch (error) {
    renderAppShell(`${pageHeader('جزئیات نود AudioBot', 'زیرساخت AudioBot')}${adminError(error)}`, 'جزئیات نود AudioBot');
  }
}

export async function renderAdminNotifications():Promise<void>{
  renderAppShell(loadingPage(),'اعلان‌های عمومی');try{const response=await api.call('getAllGlobalNotifications',{});const notifications=dataOf(response)??[];renderAppShell(`${pageHeader('اعلان‌های عمومی','انتشار پیام‌های سیستمی برای تمام کاربران.',[{label:'اعلان جدید',icon:'campaign',id:'add-notification'}])}${card('اعلان‌ها',notifications.length?`<div class="admin-notification-list">${notifications.map(item=>`<article><span>${icon('campaign')}</span><div><header><h3>${escapeHtml(item.title)}</h3>${badge(item.expiresAt&&new Date(item.expiresAt)<new Date()?'CLOSED':'ACTIVE')}</header><p>${escapeHtml(item.text).replaceAll('\n','<br/>')}</p><small>انتشار: ${faDate(item.createdAt)} — انقضا: ${faDate(item.expiresAt)}</small></div><div class="table-actions"><button class="icon-button" data-edit-notification="${item.id}">${icon('edit')}</button><button class="icon-button icon-button--danger" data-delete-notification="${item.id}">${icon('delete')}</button></div></article>`).join('')}</div>`:emptyState('اعلانی وجود ندارد','اولین اعلان عمومی را منتشر کنید.'),{icon:'notifications'})}`,'اعلان‌های عمومی');document.querySelector('#add-notification')?.addEventListener('click',()=>openNotificationForm());qsa<HTMLButtonElement>('[data-edit-notification]').forEach(button=>button.addEventListener('click',()=>openNotificationForm(notifications.find(n=>n.id===Number(button.dataset.editNotification)))));qsa<HTMLButtonElement>('[data-delete-notification]').forEach(button=>button.addEventListener('click',()=>confirmDialog('حذف اعلان','اعلان برای تمام کاربران حذف می‌شود.','حذف',async()=>{if(await runAction(()=>api.call('deleteGlobalNotification',{path:{notificationId:Number(button.dataset.deleteNotification)}})))await renderAdminNotifications();},true)));}catch(error){renderAppShell(`${pageHeader('اعلان‌های عمومی','مدیریت پیام‌ها')}${adminError(error)}`,'اعلان‌های عمومی');}
}
function openNotificationForm(notification?:Models.SystemNotificationAdminResponse):void{const local=notification?.expiresAt?new Date(notification.expiresAt).toISOString().slice(0,16):'';const form=document.createElement('form');form.className='form-grid';form.innerHTML=`${field('title','عنوان',{value:notification?.title,required:true})}${field('expiresAt','زمان انقضا',{type:'datetime-local',value:local})}${textarea('text','متن اعلان',notification?.text??'',true)}`;openDialog({title:notification?'ویرایش اعلان':'اعلان عمومی جدید',content:form,confirmLabel:notification?'ذخیره':'انتشار',wide:true,onConfirm:async()=>{if(!form.reportValidity())return false;const data=new FormData(form);const expires=String(data.get('expiresAt')??'');const body={title:String(data.get('title')??''),text:String(data.get('text')??''),expiresAt:expires?new Date(expires).toISOString():undefined};const ok=notification?await runAction(()=>api.call('editGlobalNotification',{path:{notificationId:Number(notification.id)},body})):await runAction(()=>api.call('sendGlobalNotification',{body}));if(ok)await renderAdminNotifications();return Boolean(ok);}});}

export async function renderAdminDns(): Promise<void> {
  renderAppShell(`${pageHeader('مدیریت DNS', 'Providerهای DNS به‌صورت مستقل مدیریت می‌شوند و لیارا فقط یکی از providerهای قابل اتصال است.')}
    <div class="dns-provider-grid">
      <a data-link href="/admin/dns/liara" class="dns-provider-card"><header><span class="dns-provider-card__logo">${icon('cloud_queue')}</span>${badge('ACTIVE')}</header><h3>Liara DNS</h3><p>پیکربندی API، وضعیت اتصال و zoneهای DNS لیارا.</p><footer><span>مدیریت provider</span>${icon('arrow_back')}</footer></a>
      <article class="dns-provider-card dns-provider-card--disabled"><header><span class="dns-provider-card__logo">${icon('add_circle')}</span><span class="badge badge--neutral">آینده</span></header><h3>Provider جدید</h3><p>ساختار مدیریت DNS برای اضافه‌شدن providerهای دیگر آماده شده است.</p><footer><span>به‌زودی</span>${icon('lock')}</footer></article>
    </div>`, 'مدیریت DNS');
}

export async function renderAdminLiaraDns():Promise<void>{
  renderAppShell(loadingPage(),'DNS لیارا');try{const response=await api.call('getLiaraDnsProviders',{});const provider=dataOf(response);renderAppShell(`${pageHeader('Liara DNS','پیکربندی provider و مشاهده zoneهای DNS.')}<div class="detail-grid"><div class="detail-main">${card('DNS Zoneها',provider?.dnsZones?.length?dataTable<Models.DnsZoneListResponse>([{label:'دامنه',render:r=>`<b class="ltr">${escapeHtml(r.name)}</b>`},{label:'وضعیت',render:r=>badge(r.status)},{label:'فعال',render:r=>badge(r.active?'ACTIVE':'DISABLED')}],provider.dnsZones):emptyState('Zoneای دریافت نشد','پس از اتصال موفق provider، zoneها نمایش داده می‌شوند.'),{icon:'language'})}</div><aside>${card('پیکربندی Provider',`<form id="dns-form" class="form-grid">${field('baseUrl','Base URL',{value:provider?.baseUrl,required:true,dir:'ltr'})}${field('apiKey','API Key',{value:provider?.apiKey,type:'password',required:true,dir:'ltr'})}${toggleField('active','Provider فعال باشد',provider?.active??false)}<button class="button button--primary button--block">${icon('save')} ذخیره تنظیمات</button></form><div class="provider-state"><span>وضعیت اتصال</span>${badge(provider?.status)}</div>`,{icon:'dns'})}</aside></div>`,'DNS لیارا');qs<HTMLFormElement>('#dns-form').addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement;if(!form.reportValidity())return;const data=new FormData(form);if(await runAction(()=>api.call('saveLiaraDnsProvider',{body:{baseUrl:String(data.get('baseUrl')??''),apiKey:String(data.get('apiKey')??''),active:data.get('active')==='on'}})))await renderAdminLiaraDns();});}catch(error){renderAppShell(`${pageHeader('Liara DNS','پیکربندی provider لیارا')}${adminError(error)}`,'DNS لیارا');}
}

export async function renderAdminLiveStatus(): Promise<void> {
  const snapshot = getMockLiveServiceStatus();
  const logRows = snapshot.logs.map((entry) => `<div class="backend-log__line backend-log__line--${entry.level.toLowerCase()}">
    <time>${escapeHtml(entry.timestamp)}</time><span>${escapeHtml(entry.level)}</span><b>${escapeHtml(entry.source)}</b><code>${escapeHtml(entry.message)}</code>
  </div>`).join('');

  renderAppShell(`${pageHeader('مانیتورینگ', 'نمایش آزمایشی لاگ‌های مهم backend؛ داده‌های این صفحه فعلاً mock هستند.')}
    ${card('لاگ لحظه‌ای backend', `<div class="backend-log-toolbar"><div>${icon('sensors')}<span><b>جریان لاگ آزمایشی</b><small dir="ltr">${escapeHtml(snapshot.streamLabel)}</small></span></div><time>آخرین بروزرسانی: ${faDate(snapshot.generatedAt)}</time></div><div class="backend-log" role="log" aria-label="لاگ لحظه‌ای backend">${logRows}</div>`, { icon: 'terminal', className: 'monitoring-log-card' })}
  `, 'مانیتورینگ');
}
