/* eslint-disable */
/** Generated from openapi/teacloud.openapi.json. Do not edit manually. */

/** SimpleResponse, the type of responses with no data */
export interface SimpleResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  /** Message of response, always translated to farsi */
  message?: string;
}

export interface TicketEditAdminRequest {
  subject?: string;
  status?: "PENDING" | "CLOSED" | "RESPONDED" | "WAITING";
  department?: "TECHNICAL" | "SALES";
}

export interface BalanceChargeRequest {
  amount?: number;
}

/** DetailedDataResponse, the type of responses with data and message */
export interface DetailedDataResponseMapStringString {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: {
  [key: string]: string;
};
  message?: string;
}

export interface TicketMessageRequest {
  content?: string;
}

export interface TicketSubmitRequestDoc {
  /** Ticket payload */
  ticket?: TicketUserRequest;
  files?: Array<File>;
}

/** Ticket payload */
export interface TicketUserRequest {
  subject: string;
  department?: "TECHNICAL" | "SALES";
  relatedResourceId?: number;
  message?: TicketMessageRequest;
}

export interface BillableResourceEditRequest {
  label?: string;
  autoProlong?: boolean;
}

export interface AbstractNewResourceRequest {
  type?: "TEASPEAK" | "AUDIO_BOT";
  productId: number;
  label?: string;
}

export interface BasePaginationRequest {
  page?: number;
  size?: number;
}

export interface ABPlayListDetailResponse {
  playlistFilename?: string;
  title?: string;
  songCount?: number;
  displayOffset?: number;
  playListItems?: Array<ABPlayListItemResponse>;
}

export interface ABPlayListItemResponse {
  index?: number;
  link?: string;
  title?: string;
  audioType?: string;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseABPlayListDetailResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: ABPlayListDetailResponse;
}

export interface AudioBotResourceEditRequest {
  botNickname?: string;
  serverAddress?: string;
  serverPassword?: string;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseRedirectResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: RedirectResponse;
}

export interface RedirectResponse {
  redirectUrl?: string;
}

export interface AssignSubdomainRequest {
  zoneId?: number;
  subdomain?: string;
  teaSpeakResourceId?: number;
}

export interface RegisterRequest {
  twoFactorCode?: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface LoginRequest {
  twoFactorCode?: string;
  rememberMe?: boolean;
}

export interface AuthEntryRequest {
  phoneNumber?: string;
}

export interface WalletTransactionAdminRequest {
  transactionType?: "CREDIT" | "DEBIT";
  transactionReason?: "PROLONG" | "PURCHASE" | "REFUND" | "WALLET_CHARGE";
  amount?: number;
  persist?: boolean;
}

export interface UserEditAdminRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface QueryInstanceInitRequest {
  name: string;
  queryIpAddress?: string;
  queryPort?: number;
  queryUsername: string;
  queryPassword: string;
  defaultQueryServerGroupId: number;
  maxTeaSpeakInstance: number;
  startPort?: number;
  stopPort?: number;
  enabled: boolean;
}

export interface AbstractProductEditRequest {
  type?: "TEASPEAK" | "AUDIO_BOT";
  productName?: string;
  categoryId?: number;
  price?: Money;
  presentation?: ProductPresentation;
}

export type AudioBotProductEditRequest = (AbstractProductEditRequest) & ({
  providerNodeId?: number;
});

export interface Money {
  amount?: number;
  currency?: "IRT";
}

export interface ProductPresentation {
  description?: string;
  features?: string;
  badges?: string;
}

export type TeaSpeakProductEditRequest = (AbstractProductEditRequest) & ({
  maxClients?: number;
});

export type AqayePardakhtPersistRequest = (GatewayPersistRequest) & ({
  merchantId?: string;
});

export interface GatewayPersistRequest {
  name?: string;
  active?: boolean;
  type?: "AQAYE_PARDAKHT";
}

export interface SystemNotificationRequest {
  title: string;
  text: string;
  expiresAt?: string;
}

export interface AdminDebtInvoiceRequest {
  targetUserId?: number;
  amount?: Money;
  description?: string;
}

/** DetailedDataResponse, the type of responses with data and message */
export interface DetailedDataResponseString {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: string;
  message?: string;
}

export interface LiaraDnsProviderPersistRequest {
  baseUrl: string;
  apiKey: string;
  active?: boolean;
}

export interface CategoryAdminRequest {
  name?: string;
  active?: boolean;
  description?: string;
  slug?: string;
}

export interface AudioBotNodeEditRequest {
  name?: string;
  username?: string;
  password?: string;
  maxBotInstance?: number;
  enabled?: boolean;
}

export interface AudioBotNodeInitRequest {
  name: string;
  /** The web address should not end with / */
  webAddress: string;
  username: string;
  password: string;
  maxBotInstance?: number;
  enabled?: boolean;
}

export interface ApplicationSettingDto {
  invoiceProperties?: InvoiceProperties;
  productPeriodSettings?: ProductPeriodSettings;
}

export interface InvoiceProperties {
  minimumWalletChargeAmountIrt?: number;
  taxPercentage?: number;
}

export interface PeriodDeleteSetting {
  suspendDeleteAfterSeconds?: number;
}

export interface ProductPeriodSettings {
  hourly?: PeriodDeleteSetting;
  daily?: PeriodDeleteSetting;
  monthly?: PeriodDeleteSetting;
}

/** DetailedDataResponse, the type of responses with data and message */
export interface DetailedDataResponseApplicationSettingDto {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: ApplicationSettingDto;
  message?: string;
}

export interface QueryInstanceEditRequest {
  name?: string;
  queryIpAddress?: string;
  queryPort?: number;
  queryUsername?: string;
  queryPassword?: string;
  defaultQueryServerGroupId?: number;
  maxTeaSpeakInstance?: number;
  startPort?: number;
  stopPort?: number;
  enabled?: boolean;
}

export interface ChangeProvisioningStrategyRequest {
  provisionStrategy?: "BALANCED" | "BIN_PACKING" | "RANDOMIZED" | "ROUND_ROBIN";
}

export interface WalletTransactionFilterRequest {
  page?: number;
  size?: number;
  relatedResourceId?: number;
  transactionType?: "CREDIT" | "DEBIT";
  transactionReason?: "PROLONG" | "PURCHASE" | "REFUND" | "WALLET_CHARGE";
  fromCreatedAt?: string;
  toCreatedAt?: string;
}

/** DataResponse, the type of responses with data only */
export interface DataResponsePagedModelWalletTransactionResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: PagedModelWalletTransactionResponse;
}

export interface PageMetadata {
  size?: number;
  number?: number;
  totalElements?: number;
  totalPages?: number;
}

export interface PagedModelWalletTransactionResponse {
  content?: Array<WalletTransactionResponse>;
  page?: PageMetadata;
}

export interface WalletTransactionResponse {
  relatedResourceId?: number;
  reason?: "PROLONG" | "PURCHASE" | "REFUND" | "WALLET_CHARGE";
  type?: "CREDIT" | "DEBIT";
  createdAt?: string;
  amount?: Money;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseWalletOverviewResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: WalletOverviewResponse;
}

export interface WalletOverviewResponse {
  balance?: Money;
  spentLast30days?: Money;
  spentLast7days?: Money;
  spentLastDay?: Money;
  autoRenewalCoverageUntil?: string;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseUserDetailResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: UserDetailResponse;
}

export interface UserDetailResponse {
  phone?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: "ROLE_USER" | "ROLE_SUPPORT" | "ROLE_ADMIN";
  lastLogin?: string;
  createdAt?: string;
  emailVerified?: boolean;
  online?: boolean;
}

export interface TicketFilterRequest {
  page?: number;
  size?: number;
  status?: "PENDING" | "CLOSED" | "RESPONDED" | "WAITING";
  department?: "TECHNICAL" | "SALES";
  sortedBy?: string;
}

/** DataResponse, the type of responses with data only */
export interface DataResponsePagedModelTicketListUserResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: PagedModelTicketListUserResponse;
}

export interface PagedModelTicketListUserResponse {
  content?: Array<TicketListUserResponse>;
  page?: PageMetadata;
}

export interface TicketListUserResponse {
  id?: number;
  status?: "PENDING" | "CLOSED" | "RESPONDED" | "WAITING";
  department?: "TECHNICAL" | "SALES";
  subject?: string;
  createdAt?: string;
  lastModified?: string;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseTicketDetailBaseResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: TicketDetailBaseResponse;
}

export interface TicketAttachmentResponse {
  attachmentName?: string;
  identifier?: string;
  size?: number;
}

export interface TicketDetailBaseResponse {
  id?: number;
  status?: "PENDING" | "CLOSED" | "RESPONDED" | "WAITING";
  department?: "TECHNICAL" | "SALES";
  subject?: string;
  serviceName?: string;
  createdAt?: string;
  lastModified?: string;
  messages?: Array<TicketMessageResponse>;
}

export interface TicketMessageResponse {
  senderFullName?: string;
  sentAt?: string;
  message?: string;
  senderRole?: "ROLE_USER" | "ROLE_SUPPORT" | "ROLE_ADMIN";
  attachments?: Array<TicketAttachmentResponse>;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseListResourceListResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: Array<ResourceListResponse>;
}

export interface ResourceListResponse {
  id?: number;
  label?: string;
  productName?: string;
  resourceStatus?: "DEPLOYING" | "ACTIVE" | "PENDING_PROLONG" | "LOCKED";
  resourceType?: "TEASPEAK" | "AUDIO_BOT";
  expiration?: string;
  period?: "HOURLY" | "DAILY" | "MONTHLY" | "BIMONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";
}

export interface AbstractResourceDetailResponse {
  id?: number;
  label?: string;
  productName?: string;
  resourceType?: "TEASPEAK" | "AUDIO_BOT";
  resourceStatus?: "DEPLOYING" | "ACTIVE" | "PENDING_PROLONG" | "LOCKED";
  period?: "HOURLY" | "DAILY" | "MONTHLY" | "BIMONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";
  orderDate?: string;
  expiration?: string;
  autoProlong?: boolean;
  maxClients?: number;
  address?: string;
  port?: number;
  teaSpeakStatus?: "ONLINE" | "OFFLINE";
  privilegeToken?: {
  token?: string;
};
  botNickname?: string;
  serverAddress?: string;
  serverPassword?: string;
  /** AudioBot runtime status returned by resource detail. */
  botStatus?: "OFFLINE" | "CONNECTING" | "CONNECTED";
}

/** DataResponse, the type of responses with data only */
export interface DataResponseAbstractResourceDetailResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: AbstractResourceDetailResponse;
}

export interface ABApiTokenResponse {
  credentials?: string;
  validUntil?: string;
}

export interface AudioBotScopedPanelAccessResponse {
  panelAddress?: string;
  token?: ABApiTokenResponse;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseAudioBotScopedPanelAccessResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: AudioBotScopedPanelAccessResponse;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseListGatewayListUserResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: Array<GatewayListUserResponse>;
}

export interface GatewayListUserResponse {
  id?: number;
  name?: string;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseListSystemNotificationUserResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: Array<SystemNotificationUserResponse>;
}

export interface SystemNotificationUserResponse {
  id?: number;
  title?: string;
  text?: string;
  createdAt?: string;
}

export interface InvoiceFilterRequest {
  page?: number;
  size?: number;
  status?: "PAID" | "CANCELLED" | "PENDING";
  fromCreatedAt?: string;
  toCreatedAt?: string;
}

/** DataResponse, the type of responses with data only */
export interface DataResponsePagedModelInvoiceUserResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: PagedModelInvoiceUserResponse;
}

export interface InvoiceUserResponse {
  invoiceToken?: string;
  money?: Money;
  createdAt?: string;
  paidAt?: string;
  status?: "PAID" | "CANCELLED" | "PENDING";
  taxPercentage?: number;
}

export interface PagedModelInvoiceUserResponse {
  content?: Array<InvoiceUserResponse>;
  page?: PageMetadata;
}

export interface CategoryListResponse {
  name?: string;
  description?: string;
  slug?: string;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseListCategoryListResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: Array<CategoryListResponse>;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseListZoneUserResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: Array<ZoneUserResponse>;
}

export interface ZoneUserResponse {
  id?: number;
  name?: string;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseListDnsRecordUserResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: Array<DnsRecordUserResponse>;
}

export interface DnsRecordUserResponse {
  id?: number;
  assignedToResourceId?: number;
  value?: string;
  zone?: ZoneUserResponse;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseDnsRecordUserResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: DnsRecordUserResponse;
}

export interface DashboardOverviewResponse {
  resourceMetric?: ResourceOverviewResponse;
  openTickets?: number;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseDashboardOverviewResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: DashboardOverviewResponse;
}

export interface ResourceOverviewResponse {
  total?: number;
  active?: number;
  suspended?: number;
}

export interface UsersFilterRequest {
  page?: number;
  size?: number;
  search?: string;
  byRoleId?: number;
  byEnabled?: boolean;
  byLocked?: boolean;
}

/** DataResponse, the type of responses with data only */
export interface DataResponsePagedModelUserListResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: PagedModelUserListResponse;
}

export interface PagedModelUserListResponse {
  content?: Array<UserListResponse>;
  page?: PageMetadata;
}

export interface UserListResponse {
  id?: number;
  phone?: string;
  fullName?: string;
  email?: string;
  role?: "ROLE_USER" | "ROLE_SUPPORT" | "ROLE_ADMIN";
  lastLogin?: string;
  online?: boolean;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseUserDetailAdminResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: UserDetailAdminResponse;
}

export interface UserDetailAdminResponse {
  phone?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: "ROLE_USER" | "ROLE_SUPPORT" | "ROLE_ADMIN";
  lastLogin?: string;
  createdAt?: string;
  emailVerified?: boolean;
  online?: boolean;
  id?: number;
  updatedAt?: string;
  enabled?: boolean;
  expired?: boolean;
  locked?: boolean;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseListRoleListResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: Array<RoleListResponse>;
}

export interface RoleListResponse {
  id?: number;
  name?: string;
  hierarchy?: number;
}

/** DataResponse, the type of responses with data only */
export interface DataResponsePagedModelTicketListAdminResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: PagedModelTicketListAdminResponse;
}

export interface PagedModelTicketListAdminResponse {
  content?: Array<TicketListAdminResponse>;
  page?: PageMetadata;
}

/** 'ownerId' field requires UserDetail Page redirect */
export interface TicketListAdminResponse {
  id?: number;
  status?: "PENDING" | "CLOSED" | "RESPONDED" | "WAITING";
  department?: "TECHNICAL" | "SALES";
  ownerId?: number;
  ownerFullName?: string;
  subject?: string;
  createdAt?: string;
  lastModified?: string;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseTicketDetailAdminResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: TicketDetailAdminResponse;
}

/** 'ownerId' field requires UserDetail Page redirect */
export interface TicketDetailAdminResponse {
  id?: number;
  status?: "PENDING" | "CLOSED" | "RESPONDED" | "WAITING";
  department?: "TECHNICAL" | "SALES";
  subject?: string;
  serviceName?: string;
  createdAt?: string;
  lastModified?: string;
  messages?: Array<TicketMessageResponse>;
  ownerId?: number;
  ownerFullName?: string;
}

export interface ResourceFilterRequest {
  page?: number;
  size?: number;
  byResourceStatus?: "DEPLOYING" | "ACTIVE" | "PENDING_PROLONG" | "LOCKED";
  byType?: "TEASPEAK" | "AUDIO_BOT";
  byOwnerId?: number;
}

/** DataResponse, the type of responses with data only */
export interface DataResponsePagedModelResourceListAdminResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: PagedModelResourceListAdminResponse;
}

export interface PagedModelResourceListAdminResponse {
  content?: Array<ResourceListAdminResponse>;
  page?: PageMetadata;
}

/** 'ownerId' field requires UserDetail Page redirect */
export interface ResourceListAdminResponse {
  id?: number;
  label?: string;
  productName?: string;
  resourceStatus?: "DEPLOYING" | "ACTIVE" | "PENDING_PROLONG" | "LOCKED";
  resourceType?: "TEASPEAK" | "AUDIO_BOT";
  expiration?: string;
  period?: "HOURLY" | "DAILY" | "MONTHLY" | "BIMONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";
  ownerId?: number;
  nodeId?: number;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseListQueryInstanceListResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: Array<QueryInstanceListResponse>;
}

export interface QueryInstanceListResponse {
  id?: number;
  name?: string;
  status?: "DISABLED" | "FULL" | "UNREACHABLE" | "RECONNECTING" | "LOGIN_FAILED" | "DISPATCHED" | "INITIATED";
  credentials?: ServerQueryCredentials;
  maxTeaSpeakInstance?: number;
  usedInstanceSlot?: number;
  startPort?: number;
  stopPort?: number;
  active?: boolean;
  defaultQueryServerGroupId?: number;
}

export interface ServerQueryCredentials {
  ip?: string;
  port?: number;
  username?: string;
  password?: string;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseProvisionStrategy {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: "BALANCED" | "BIN_PACKING" | "RANDOMIZED" | "ROUND_ROBIN";
}

/** Product detail response */
export type AbstractProductDetailResponse = (TeaSpeakProductDetailAdminResponse) | (AudioBotProductDetailAdminResponse);

export interface AudioBotProductDetailAdminResponse {
  id?: number;
  categoryName?: string;
  categorySlug?: string;
  productName?: string;
  period?: "HOURLY" | "DAILY" | "MONTHLY" | "BIMONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";
  productType?: "TEASPEAK" | "AUDIO_BOT";
  orderedResources?: number;
  price?: Money;
  enabled?: boolean;
  presentation?: ProductPresentation;
  providerNodeId?: number;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseAbstractProductDetailResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: AbstractProductDetailResponse;
}

export interface TeaSpeakProductDetailAdminResponse {
  id?: number;
  categoryName?: string;
  categorySlug?: string;
  productName?: string;
  period?: "HOURLY" | "DAILY" | "MONTHLY" | "BIMONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";
  productType?: "TEASPEAK" | "AUDIO_BOT";
  orderedResources?: number;
  price?: Money;
  enabled?: boolean;
  presentation?: ProductPresentation;
  maxClients?: number;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseListGateway {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: Array<Gateway>;
}

export interface Gateway {
  id?: number;
  name?: string;
  active?: boolean;
  type?: "AQAYE_PARDAKHT";
}

/** DataResponse, the type of responses with data only */
export interface DataResponseGateway {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: Gateway;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseListPaymentGatewayType {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: Array<"AQAYE_PARDAKHT">;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseListSystemNotificationAdminResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: Array<SystemNotificationAdminResponse>;
}

export interface SystemNotificationAdminResponse {
  id?: number;
  title?: string;
  text?: string;
  createdAt?: string;
  publisherId?: number;
  expiresAt?: string;
}

export interface InvoiceAdminFilterRequest {
  page?: number;
  size?: number;
  status?: "PAID" | "CANCELLED" | "PENDING";
  fromCreatedAt?: string;
  toCreatedAt?: string;
  byUserId?: number;
}

/** DataResponse, the type of responses with data only */
export interface DataResponsePagedModelInvoiceAdminResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: PagedModelInvoiceAdminResponse;
}

/** 'ownerId' field requires UserDetail Page redirect */
export interface InvoiceAdminResponse {
  invoiceToken?: string;
  money?: Money;
  taxPercentage?: number;
  createdAt?: string;
  paidAt?: string;
  status?: "PAID" | "CANCELLED" | "PENDING";
  paymentTransaction?: PaymentTransactionDetailResponse;
  ownerFullName?: string;
  ownerId?: number;
}

export interface PagedModelInvoiceAdminResponse {
  content?: Array<InvoiceAdminResponse>;
  page?: PageMetadata;
}

export interface PaymentTransactionDetailResponse {
  id?: number;
  transactionId?: string;
  trackingId?: string;
  amount?: Money;
  gatewayName?: string;
  transactionDate?: string;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseLiaraDnsProviderDetailResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: LiaraDnsProviderDetailResponse;
}

export interface DnsZoneListResponse {
  id?: number;
  name?: string;
  active?: boolean;
  status?: "CREATING" | "PENDING" | "ACTIVE" | "DELETING";
}

export interface LiaraDnsProviderDetailResponse {
  active?: boolean;
  status?: "CONNECTED" | "API_KEY_REJECTED" | "SERVER_ERROR" | "UNKNOWN";
  baseUrl?: string;
  dnsZones?: Array<DnsZoneListResponse>;
}

export interface AdminMetric {
  financeMetric?: FinanceMetric;
  userMetric?: UserMetric;
  ticketMetric?: TicketMetric;
  resourceMetric?: ResourceMetric;
  queryInstanceMetric?: NodeMetric;
  audioBotNodeMetric?: NodeMetric;
}

export interface CountSummary {
  total?: number;
  count?: number;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseAdminMetric {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: AdminMetric;
}

export interface FinanceFlowComparison {
  daily?: PeriodComparisonBigDecimal;
  weekly?: PeriodComparisonBigDecimal;
  monthly?: PeriodComparisonBigDecimal;
}

export interface FinanceMetric {
  totalBalance?: Money;
  income?: FinanceFlowComparison;
  spending?: FinanceFlowComparison;
}

export interface NodeMetric {
  nodeSummary?: CountSummary;
  nodeStrategy?: "BALANCED" | "BIN_PACKING" | "RANDOMIZED" | "ROUND_ROBIN";
}

export interface PeriodComparisonBigDecimal {
  current?: number;
  previous?: number;
}

export interface PeriodComparisonLong {
  current?: number;
  previous?: number;
}

export interface ResourceMetric {
  total?: number;
  active?: number;
  suspended?: number;
  deploying?: number;
}

export interface TicketMetric {
  pending?: number;
  waiting?: number;
  closed?: number;
  responded?: number;
}

export interface UserMetric {
  currentOnline?: number;
  dailyRegisters?: PeriodComparisonLong;
  weeklyRegisters?: PeriodComparisonLong;
  monthlyRegisters?: PeriodComparisonLong;
}

export interface CategoryListAdminResponse {
  id?: number;
  name?: string;
  active?: boolean;
  description?: string;
  slug?: string;
  productType?: "TEASPEAK" | "AUDIO_BOT";
}

/** DataResponse, the type of responses with data only */
export interface DataResponseListCategoryListAdminResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: Array<CategoryListAdminResponse>;
}

export interface AudioBotNodeListResponse {
  id?: number;
  name?: string;
  webAddress?: string;
  nodeStatus?: "DISABLED" | "FULL" | "UNREACHABLE" | "LOGIN_FAILED" | "DISPATCHED";
  maxBotInstance?: number;
  enabled?: boolean;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseListAudioBotNodeListResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: Array<AudioBotNodeListResponse>;
}

export interface AudioBotNodeDetailResponse {
  id?: number;
  name?: string;
  webAddress?: string;
  username?: string;
  password?: string;
  nodeStatus?: "DISABLED" | "FULL" | "UNREACHABLE" | "LOGIN_FAILED" | "DISPATCHED";
  initiatedAt?: string;
  lastUsed?: string;
  maxBotInstance?: number;
  onlineInstanceCount?: number;
  allInstanceCount?: number;
  enabled?: boolean;
  full?: boolean;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseAudioBotNodeDetailResponse {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: AudioBotNodeDetailResponse;
}

/** DataResponse, the type of responses with data only */
export interface DataResponseApplicationSettingDto {
  /** Operation success state, boolean */
  success?: boolean;
  /** Operation Type */
  type?: string;
  data?: ApplicationSettingDto;
}

/** Admin DNS record row. assigned=true means the record is managed by TeaCloud and linked to a TeaSpeak resource. */
export interface DnsRecordAdminResponse {
  id?: number;
  name?: string;
  type?: string;
  value?: string;
  ttl?: number;
  assigned?: boolean;
  ownerId?: number;
  targetResourceId?: number;
  zoneName?: string;
  status?: string;
}

export interface DataResponseListDnsRecordAdminResponse {
  success?: boolean;
  type?: string;
  data?: Array<DnsRecordAdminResponse>;
}
