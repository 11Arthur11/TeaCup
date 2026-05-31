import type { TicketMessageResponse } from '../api/generated-models.js';
import { escapeHtml, icon } from '../core/dom.js';
import { faDate, faNumber, translateEnum } from '../core/format.js';

export type TicketMessagePerspective = 'customer' | 'staff';

const staffRoles = new Set(['ROLE_ADMIN', 'ROLE_SUPPORT']);

export const isStaffRole = (role?: string | null): boolean =>
  staffRoles.has(role?.trim().toUpperCase() ?? '');

const staffRoleBadge = (role?: string | null): string => {
  if (!isStaffRole(role)) return '';
  const normalized = role?.trim().toUpperCase() ?? '';
  const tone = normalized === 'ROLE_ADMIN' ? 'admin' : 'support';
  return `<span class="message-role-badge message-role-badge--${tone}">${escapeHtml(translateEnum(normalized))}</span>`;
};

export const renderTicketMessage = (
  message: TicketMessageResponse,
  perspective: TicketMessagePerspective,
): string => {
  const staff = isStaffRole(message.senderRole);
  const own = perspective === 'staff' ? staff : !staff;
  const attachments = message.attachments?.length
    ? `<div class="attachments">${message.attachments.map((attachment) => `
        <button type="button" data-attachment="${escapeHtml(attachment.identifier)}" data-filename="${escapeHtml(attachment.attachmentName)}">
          ${icon('attach_file')}
          <span><b>${escapeHtml(attachment.attachmentName)}</b>${attachment.size !== undefined ? `<small>${faNumber(Math.ceil(Number(attachment.size) / 1024))} کیلوبایت</small>` : ''}</span>
          ${icon('download')}
        </button>`).join('')}</div>`
    : '';

  return `<article class="message ${own ? 'message--own' : 'message--other'} ${staff ? 'message--staff' : 'message--customer'}">
    <div class="message__avatar">${icon(staff ? 'support_agent' : 'person')}</div>
    <div class="message__bubble">
      <header>
        <div class="message__sender"><b>${escapeHtml(message.senderFullName)}</b>${staffRoleBadge(message.senderRole)}</div>
        <span>${faDate(message.sentAt)}</span>
      </header>
      <p>${escapeHtml(message.message).replaceAll('\n', '<br/>')}</p>
      ${attachments}
    </div>
  </article>`;
};
