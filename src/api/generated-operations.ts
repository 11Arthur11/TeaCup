/* eslint-disable */
/** Generated operation catalog from OpenAPI. */
import type * as Models from './generated-models.js';

export const operations = {
  "addTicketMessage": { method: "PUT", path: "/v1/tickets/detail/{ticketId}/message", bodyKind: "multipart", responseKind: "json" },
  "editTicket": { method: "PUT", path: "/v1/admin/tickets/edit/{ticketId}", bodyKind: "json", responseKind: "json" },
  "chargeWallet": { method: "POST", path: "/v1/wallet/charge", bodyKind: "json", responseKind: "json" },
  "submitTicket": { method: "POST", path: "/v1/tickets/submit", bodyKind: "multipart", responseKind: "json" },
  "prolongResource": { method: "POST", path: "/v1/services/{resourceId}/prolong", bodyKind: null, responseKind: "json" },
  "prolongResource_1": { method: "POST", path: "/v1/services/{resourceId}/edit", bodyKind: "json", responseKind: "json" },
  "stopTeaSpeak": { method: "POST", path: "/v1/services/teaspeak/{resourceId}/stop", bodyKind: null, responseKind: "json" },
  "startTeaSpeak": { method: "POST", path: "/v1/services/teaspeak/{resourceId}/start", bodyKind: null, responseKind: "json" },
  "newPrivilege": { method: "POST", path: "/v1/services/teaspeak/{resourceId}/new-privilege", bodyKind: null, responseKind: "json" },
  "newResource": { method: "POST", path: "/v1/services/new", bodyKind: "json", responseKind: "json" },
  "stopAudioBot": { method: "POST", path: "/v1/services/audio-bot/{resourceId}/stop", bodyKind: null, responseKind: "json" },
  "startAudioBot": { method: "POST", path: "/v1/services/audio-bot/{resourceId}/start", bodyKind: null, responseKind: "json" },
  "getAudioBotPlaylistDetail": { method: "POST", path: "/v1/services/audio-bot/{resourceId}/playlists/{playlistFilename}/details", bodyKind: "json", responseKind: "json" },
  "editAudioBot": { method: "POST", path: "/v1/services/audio-bot/{resourceId}/edit", bodyKind: "json", responseKind: "json" },
  "payInvoice": { method: "POST", path: "/v1/payments/pay", bodyKind: null, responseKind: "json" },
  "aqayePardakhtCallback": { method: "POST", path: "/v1/payments/gateway/callback/ap", bodyKind: "form", responseKind: "void" },
  "getAssignedRecords": { method: "GET", path: "/v1/dns/records", bodyKind: null, responseKind: "json" },
  "assignSubdomain": { method: "POST", path: "/v1/dns/records", bodyKind: "json", responseKind: "json" },
  "register": { method: "POST", path: "/v1/auth/register", bodyKind: "json", responseKind: "json" },
  "logout": { method: "POST", path: "/v1/auth/logout", bodyKind: null, responseKind: "json" },
  "login": { method: "POST", path: "/v1/auth/login", bodyKind: "json", responseKind: "json" },
  "authEntry": { method: "POST", path: "/v1/auth/initiate", bodyKind: "json", responseKind: "json" },
  "unlockUser": { method: "POST", path: "/v1/admin/users/{userId}/unlock", bodyKind: null, responseKind: "json" },
  "setUserRole": { method: "POST", path: "/v1/admin/users/{userId}/roles/{roleId}", bodyKind: null, responseKind: "json" },
  "lockUser": { method: "POST", path: "/v1/admin/users/{userId}/lock", bodyKind: null, responseKind: "json" },
  "editUser": { method: "POST", path: "/v1/admin/users/{userId}/edit", bodyKind: "json", responseKind: "json" },
  "submitTicket_1": { method: "POST", path: "/v1/admin/tickets/submit", bodyKind: "multipart", responseKind: "json" },
  "getAllQueryInstance": { method: "GET", path: "/v1/admin/query-instances", bodyKind: null, responseKind: "json" },
  "initQueryInstance": { method: "POST", path: "/v1/admin/query-instances", bodyKind: "json", responseKind: "json" },
  "editProduct": { method: "POST", path: "/v1/admin/products/{productId}/edit", bodyKind: "json", responseKind: "json" },
  "addProduct": { method: "POST", path: "/v1/admin/products/add", bodyKind: "json", responseKind: "json" },
  "getGateways": { method: "GET", path: "/v1/admin/payments/gateways", bodyKind: null, responseKind: "json" },
  "addGatewayConfig": { method: "POST", path: "/v1/admin/payments/gateways", bodyKind: "json", responseKind: "json" },
  "getAllGlobalNotifications": { method: "GET", path: "/v1/admin/notifications", bodyKind: null, responseKind: "json" },
  "sendGlobalNotification": { method: "POST", path: "/v1/admin/notifications", bodyKind: "json", responseKind: "json" },
  "editGlobalNotification": { method: "POST", path: "/v1/admin/notifications/{notificationId}", bodyKind: "json", responseKind: "json" },
  "deleteGlobalNotification": { method: "DELETE", path: "/v1/admin/notifications/{notificationId}", bodyKind: null, responseKind: "json" },
  "getAllInvoices": { method: "GET", path: "/v1/admin/invoices", bodyKind: null, responseKind: "json" },
  "sendDebtInvoice": { method: "POST", path: "/v1/admin/invoices", bodyKind: "json", responseKind: "json" },
  "getLiaraDnsProviders": { method: "GET", path: "/v1/admin/dns/liara", bodyKind: null, responseKind: "json" },
  "saveLiaraDnsProvider": { method: "POST", path: "/v1/admin/dns/liara", bodyKind: "json", responseKind: "json" },
  "getAllCategories": { method: "GET", path: "/v1/admin/categories", bodyKind: null, responseKind: "json" },
  "addCategory": { method: "POST", path: "/v1/admin/categories", bodyKind: "json", responseKind: "json" },
  "editCategory": { method: "POST", path: "/v1/admin/categories/edit/{categoryId}", bodyKind: "json", responseKind: "json" },
  "editAudioBotNode": { method: "POST", path: "/v1/admin/audio-bot-nodes/{nodeId}/edit", bodyKind: "json", responseKind: "json" },
  "initAudioBotNode": { method: "POST", path: "/v1/admin/audio-bot-nodes/initiate", bodyKind: "json", responseKind: "json" },
  "getSettings": { method: "GET", path: "/v1/admin/app-settings", bodyKind: null, responseKind: "json" },
  "setSettings": { method: "POST", path: "/v1/admin/app-settings", bodyKind: "json", responseKind: "json" },
  "forceProlongResource": { method: "PATCH", path: "/v1/admin/resources/{resourceId}/force-prolong", bodyKind: null, responseKind: "json" },
  "removeQueryInstance": { method: "DELETE", path: "/v1/admin/query-instances/{id}", bodyKind: null, responseKind: "json" },
  "editQueryInstance": { method: "PATCH", path: "/v1/admin/query-instances/{id}", bodyKind: "json", responseKind: "json" },
  "enableQueryInstance": { method: "PATCH", path: "/v1/admin/query-instances/{id}/enable", bodyKind: null, responseKind: "json" },
  "disableQueryInstance": { method: "PATCH", path: "/v1/admin/query-instances/{id}/disable", bodyKind: null, responseKind: "json" },
  "getProvisioningStrategy": { method: "GET", path: "/v1/admin/query-instances/provisioning", bodyKind: null, responseKind: "json" },
  "changeProvisioningStrategy": { method: "PATCH", path: "/v1/admin/query-instances/provisioning", bodyKind: "json", responseKind: "json" },
  "changeEnabled": { method: "PATCH", path: "/v1/admin/products/{productId}/{enabled}", bodyKind: null, responseKind: "json" },
  "toggleZoneActive": { method: "PATCH", path: "/v1/admin/dns/zones/{zoneId}/toggle-active", bodyKind: null, responseKind: "json" },
  "reassignRecord": { method: "PATCH", path: "/v1/admin/dns/records/{recordId}/re-assign", bodyKind: null, responseKind: "json" },
  "getProvisioningStrategy_1": { method: "GET", path: "/v1/admin/audio-bot-nodes/provisioning", bodyKind: null, responseKind: "json" },
  "changeProvisioningStrategy_1": { method: "PATCH", path: "/v1/admin/audio-bot-nodes/provisioning", bodyKind: "json", responseKind: "json" },
  "isAvailable": { method: "HEAD", path: "/v1/dns/zones/{zoneId}/subdomains/{subdomain}/availability", bodyKind: null, responseKind: "void" },
  "checkAuthentication": { method: "HEAD", path: "/v1/auth/session", bodyKind: null, responseKind: "void" },
  "getWalletTransactions": { method: "GET", path: "/v1/wallet/transactions", bodyKind: null, responseKind: "json" },
  "getBalance": { method: "GET", path: "/v1/wallet/overview", bodyKind: null, responseKind: "json" },
  "getProfile": { method: "GET", path: "/v1/users", bodyKind: null, responseKind: "json" },
  "getTickets": { method: "GET", path: "/v1/tickets", bodyKind: null, responseKind: "json" },
  "getTicketDetails": { method: "GET", path: "/v1/tickets/detail/{id}", bodyKind: null, responseKind: "json" },
  "getAttachment": { method: "GET", path: "/v1/tickets/attachment/{identifier}", bodyKind: null, responseKind: "blob" },
  "getIp": { method: "GET", path: "/v1/test/ip", bodyKind: null, responseKind: "json" },
  "getResources": { method: "GET", path: "/v1/services", bodyKind: null, responseKind: "json" },
  "getResourceById": { method: "GET", path: "/v1/services/{resourceId}", bodyKind: null, responseKind: "json" },
  "getPanelAccess": { method: "GET", path: "/v1/services/audio-bot/{resourceId}/access", bodyKind: null, responseKind: "json" },
  "getProductByCategorySlug": { method: "GET", path: "/v1/products/{categorySlug}", bodyKind: null, responseKind: "json" },
  "getAllGateways": { method: "GET", path: "/v1/payments/gateways", bodyKind: null, responseKind: "json" },
  "getAllGlobalNotifications_1": { method: "GET", path: "/v1/notifications", bodyKind: null, responseKind: "json" },
  "getInvoices": { method: "GET", path: "/v1/invoices", bodyKind: null, responseKind: "json" },
  "getInvoice": { method: "GET", path: "/v1/invoices/{invoiceToken}", bodyKind: null, responseKind: "json" },
  "getProductByCategorySlug_1": { method: "GET", path: "/v1/global/products/{categorySlug}", bodyKind: null, responseKind: "json" },
  "getCategories": { method: "GET", path: "/v1/global/categories", bodyKind: null, responseKind: "json" },
  "getAvailableZones": { method: "GET", path: "/v1/dns/zones", bodyKind: null, responseKind: "json" },
  "getAssignedRecord": { method: "GET", path: "/v1/dns/records/{resourceId}", bodyKind: null, responseKind: "json" },
  "getDashboardOverviewResponse": { method: "GET", path: "/v1/dashboard/overview", bodyKind: null, responseKind: "json" },
  "getCategories_1": { method: "GET", path: "/v1/categories", bodyKind: null, responseKind: "json" },
  "getAllUsers": { method: "GET", path: "/v1/admin/users", bodyKind: null, responseKind: "json" },
  "getUserById": { method: "GET", path: "/v1/admin/users/{userId}", bodyKind: null, responseKind: "json" },
  "getRoles": { method: "GET", path: "/v1/admin/users/roles", bodyKind: null, responseKind: "json" },
  "getAllTickets": { method: "GET", path: "/v1/admin/tickets", bodyKind: null, responseKind: "json" },
  "getAllUserTickets": { method: "GET", path: "/v1/admin/tickets/{userId}", bodyKind: null, responseKind: "json" },
  "getTicketDetails_1": { method: "GET", path: "/v1/admin/tickets/detail/{ticketId}", bodyKind: null, responseKind: "json" },
  "getAllResources": { method: "GET", path: "/v1/admin/resources", bodyKind: null, responseKind: "json" },
  "getResource": { method: "GET", path: "/v1/admin/resources/{resourceId}", bodyKind: null, responseKind: "json" },
  "deleteResource": { method: "DELETE", path: "/v1/admin/resources/{resourceId}", bodyKind: null, responseKind: "json" },
  "getAllProducts": { method: "GET", path: "/v1/admin/products", bodyKind: null, responseKind: "json" },
  "getProduct": { method: "GET", path: "/v1/admin/products/{productId}", bodyKind: null, responseKind: "json" },
  "deleteProduct": { method: "DELETE", path: "/v1/admin/products/{productId}", bodyKind: null, responseKind: "json" },
  "getGatewayDetails": { method: "GET", path: "/v1/admin/payments/gateways/{gatewayId}", bodyKind: null, responseKind: "json" },
  "getModules": { method: "GET", path: "/v1/admin/payments/gateways/modules", bodyKind: null, responseKind: "json" },
  "zoneRecords": { method: "GET", path: "/v1/admin/dns/records/{zoneName}", bodyKind: null, responseKind: "json" },
  "liaraZoneRecords": { method: "GET", path: "/v1/admin/dns/records/resource/{resourceId}", bodyKind: null, responseKind: "json" },
  "overview": { method: "GET", path: "/v1/admin/dashboard/overview", bodyKind: null, responseKind: "json" },
  "getAllAudioBotNodes": { method: "GET", path: "/v1/admin/audio-bot-nodes", bodyKind: null, responseKind: "json" },
  "getAudioBotNodeDetail": { method: "GET", path: "/v1/admin/audio-bot-nodes/{nodeId}", bodyKind: null, responseKind: "json" },
  "deleteAudioBotNode": { method: "DELETE", path: "/v1/admin/audio-bot-nodes/{nodeId}", bodyKind: null, responseKind: "json" },
  "unassignRecord": { method: "DELETE", path: "/v1/dns/records/{recordId}", bodyKind: null, responseKind: "json" },
  "unassignRecord_1": { method: "DELETE", path: "/v1/admin/dns/records/{recordId}", bodyKind: null, responseKind: "json" },
  "deleteCategory": { method: "DELETE", path: "/v1/admin/categories/{categoryId}", bodyKind: null, responseKind: "json" },
  "closeTicket": { method: "POST", path: "/v1/tickets/detail/{ticketId}/close", bodyKind: null, responseKind: "json" },
} as const;

export type OperationId = keyof typeof operations;

export interface OperationInputMap {
  "addTicketMessage": {
    path: {
    ticketId: number;
  };
    body: FormData;
  };
  "editTicket": {
    path: {
    ticketId: number;
  };
    body: Models.TicketEditAdminRequest;
  };
  "chargeWallet": {
    body: Models.BalanceChargeRequest;
  };
  "submitTicket": {
    body: FormData;
  };
  "prolongResource": {
    path: {
    resourceId: number;
  };
  };
  "prolongResource_1": {
    path: {
    resourceId: number;
  };
    body: Models.BillableResourceEditRequest;
  };
  "stopTeaSpeak": {
    path: {
    resourceId: number;
  };
  };
  "startTeaSpeak": {
    path: {
    resourceId: number;
  };
  };
  "newPrivilege": {
    path: {
    resourceId: number;
  };
  };
  "newResource": {
    body: Models.AbstractNewResourceRequest;
  };
  "stopAudioBot": {
    path: {
    resourceId: number;
  };
  };
  "startAudioBot": {
    path: {
    resourceId: number;
  };
  };
  "getAudioBotPlaylistDetail": {
    path: {
    resourceId: number;
    playlistFilename: string;
  };
    body: Models.BasePaginationRequest;
  };
  "editAudioBot": {
    path: {
    resourceId: number;
  };
    body: Models.AudioBotResourceEditRequest;
  };
  "payInvoice": {
    query: {
    invoiceToken: string;
    gatewayId: number;
  };
  };
  "aqayePardakhtCallback": {
    query: {
    cardnumber?: string;
    tracking_number?: string;
    bank?: string;
    status?: string;
    transid?: string;
    invoice_id?: string;
  };
    body: URLSearchParams;
  };
  "getAssignedRecords": Record<string, never>;
  "assignSubdomain": {
    body: Models.AssignSubdomainRequest;
  };
  "register": {
    body: Models.RegisterRequest;
  };
  "logout": Record<string, never>;
  "login": {
    body: Models.LoginRequest;
  };
  "authEntry": {
    body: Models.AuthEntryRequest;
  };
  "unlockUser": {
    path: {
    userId: number;
  };
  };
  "setUserRole": {
    path: {
    userId: number;
    roleId: number;
  };
  };
  "lockUser": {
    path: {
    userId: number;
  };
  };
  "editUser": {
    path: {
    userId: number;
  };
    body: Models.UserEditAdminRequest;
  };
  "submitTicket_1": {
    query: {
    targetUserId: number;
  };
    body: FormData;
  };
  "getAllQueryInstance": Record<string, never>;
  "initQueryInstance": {
    body: Models.QueryInstanceInitRequest;
  };
  "editProduct": {
    path: {
    productId: number;
  };
    body: (Models.AbstractProductEditRequest) | (Models.TeaSpeakProductEditRequest);
  };
  "addProduct": {
    body: Models.AbstractNewResourceRequest;
  };
  "getGateways": Record<string, never>;
  "addGatewayConfig": {
    body: (Models.AqayePardakhtPersistRequest);
  };
  "getAllGlobalNotifications": Record<string, never>;
  "sendGlobalNotification": {
    body: Models.SystemNotificationRequest;
  };
  "editGlobalNotification": {
    path: {
    notificationId: number;
  };
    body: Models.SystemNotificationRequest;
  };
  "deleteGlobalNotification": {
    path: {
    notificationId: number;
  };
  };
  "getAllInvoices": {
    query: {
    filterRequest: Models.InvoiceAdminFilterRequest;
  };
  };
  "sendDebtInvoice": {
    body: Models.AdminDebtInvoiceRequest;
  };
  "getLiaraDnsProviders": Record<string, never>;
  "saveLiaraDnsProvider": {
    body: Models.LiaraDnsProviderPersistRequest;
  };
  "getAllCategories": Record<string, never>;
  "addCategory": {
    body: Models.CategoryAdminRequest;
  };
  "editCategory": {
    path: {
    categoryId: number;
  };
    body: Models.CategoryAdminRequest;
  };
  "editAudioBotNode": {
    path: {
    nodeId: number;
  };
    body: Models.AudioBotNodeEditRequest;
  };
  "initAudioBotNode": {
    body: Models.AudioBotNodeInitRequest;
  };
  "getSettings": Record<string, never>;
  "setSettings": {
    body: Models.ApplicationSettingDto;
  };
  "forceProlongResource": {
    path: {
    resourceId: number;
  };
  };
  "removeQueryInstance": {
    path: {
    id: number;
  };
  };
  "editQueryInstance": {
    path: {
    id: number;
  };
    body: Models.QueryInstanceEditRequest;
  };
  "enableQueryInstance": {
    path: {
    id: number;
  };
  };
  "disableQueryInstance": {
    path: {
    id: number;
  };
  };
  "getProvisioningStrategy": Record<string, never>;
  "changeProvisioningStrategy": {
    body: Models.ChangeProvisioningStrategyRequest;
  };
  "changeEnabled": {
    path: {
    productId: number;
    enabled: boolean;
  };
  };
  "toggleZoneActive": {
    path: {
    zoneId: number;
  };
  };
  "reassignRecord": {
    path: {
    recordId: number;
  };
  };
  "getProvisioningStrategy_1": Record<string, never>;
  "changeProvisioningStrategy_1": {
    body: Models.ChangeProvisioningStrategyRequest;
  };
  "isAvailable": {
    path: {
    zoneId: number;
    subdomain: string;
  };
  };
  "checkAuthentication": Record<string, never>;
  "getWalletTransactions": {
    query: {
    filter: Models.WalletTransactionFilterRequest;
  };
  };
  "getBalance": Record<string, never>;
  "getProfile": Record<string, never>;
  "getTickets": {
    query: {
    filterRequest: Models.TicketFilterRequest;
  };
  };
  "getTicketDetails": {
    path: {
    id: number;
  };
  };
  "getAttachment": {
    path: {
    identifier: string;
  };
  };
  "getIp": Record<string, never>;
  "getResources": Record<string, never>;
  "getResourceById": {
    path: {
    resourceId: number;
  };
  };
  "getPanelAccess": {
    path: {
    resourceId: number;
  };
  };
  "getProductByCategorySlug": {
    path: {
    categorySlug: string;
  };
  };
  "getAllGateways": Record<string, never>;
  "getAllGlobalNotifications_1": Record<string, never>;
  "getInvoices": {
    query: {
    filterRequest: Models.InvoiceFilterRequest;
  };
  };
  "getInvoice": {
    path: {
    invoiceToken: string;
  };
  };
  "getProductByCategorySlug_1": {
    path: {
    categorySlug: string;
  };
  };
  "getCategories": Record<string, never>;
  "getAvailableZones": Record<string, never>;
  "getAssignedRecord": {
    path: {
    resourceId: number;
  };
  };
  "getDashboardOverviewResponse": Record<string, never>;
  "getCategories_1": Record<string, never>;
  "getAllUsers": {
    query: {
    filter: Models.UsersFilterRequest;
  };
  };
  "getUserById": {
    path: {
    userId: number;
  };
  };
  "getRoles": Record<string, never>;
  "getAllTickets": {
    query: {
    filterRequest: Models.TicketFilterRequest;
  };
  };
  "getAllUserTickets": {
    path: {
    userId: number;
  };
    query: {
    filterRequest: Models.TicketFilterRequest;
  };
  };
  "getTicketDetails_1": {
    path: {
    ticketId: number;
  };
  };
  "getAllResources": {
    query: {
    filter: Models.ResourceFilterRequest;
  };
  };
  "getResource": {
    path: {
    resourceId: number;
  };
  };
  "deleteResource": {
    path: {
    resourceId: number;
  };
  };
  "getAllProducts": Record<string, never>;
  "getProduct": {
    path: {
    productId: number;
  };
  };
  "deleteProduct": {
    path: {
    productId: number;
  };
  };
  "getGatewayDetails": {
    path: {
    gatewayId: number;
  };
  };
  "getModules": Record<string, never>;
  "zoneRecords": {
    path: {
    zoneName: string;
  };
  };
  "liaraZoneRecords": {
    path: {
    resourceId: number;
  };
  };
  "overview": Record<string, never>;
  "getAllAudioBotNodes": Record<string, never>;
  "getAudioBotNodeDetail": {
    path: {
    nodeId: number;
  };
  };
  "deleteAudioBotNode": {
    path: {
    nodeId: number;
  };
  };
  "unassignRecord": {
    path: {
    recordId: number;
  };
  };
  "unassignRecord_1": {
    path: {
    recordId: number;
  };
  };
  "deleteCategory": {
    path: {
    categoryId: number;
  };
  };
  "closeTicket": {
    path: {
    ticketId: number;
  };
  };
}

export interface OperationOutputMap {
  "addTicketMessage": Models.SimpleResponse;
  "editTicket": Models.SimpleResponse;
  "chargeWallet": Models.DetailedDataResponseMapStringString;
  "submitTicket": Models.SimpleResponse;
  "prolongResource": Models.SimpleResponse;
  "prolongResource_1": Models.SimpleResponse;
  "stopTeaSpeak": Models.SimpleResponse;
  "startTeaSpeak": Models.SimpleResponse;
  "newPrivilege": Models.SimpleResponse;
  "newResource": Models.SimpleResponse;
  "stopAudioBot": Models.SimpleResponse;
  "startAudioBot": Models.SimpleResponse;
  "getAudioBotPlaylistDetail": Models.DataResponseABPlayListDetailResponse;
  "editAudioBot": Models.SimpleResponse;
  "payInvoice": Models.DataResponseRedirectResponse;
  "aqayePardakhtCallback": void;
  "getAssignedRecords": Models.DataResponseListDnsRecordUserResponse;
  "assignSubdomain": Models.SimpleResponse;
  "register": Models.SimpleResponse;
  "logout": Models.SimpleResponse;
  "login": Models.SimpleResponse;
  "authEntry": {

};
  "unlockUser": Models.SimpleResponse;
  "setUserRole": Models.SimpleResponse;
  "lockUser": Models.SimpleResponse;
  "editUser": Models.SimpleResponse;
  "submitTicket_1": Models.SimpleResponse;
  "getAllQueryInstance": Models.DataResponseListQueryInstanceListResponse;
  "initQueryInstance": Models.SimpleResponse;
  "editProduct": Models.SimpleResponse;
  "addProduct": Models.SimpleResponse;
  "getGateways": Models.DataResponseListGateway;
  "addGatewayConfig": Models.SimpleResponse;
  "getAllGlobalNotifications": Models.DataResponseListSystemNotificationAdminResponse;
  "sendGlobalNotification": Models.SimpleResponse;
  "editGlobalNotification": Models.SimpleResponse;
  "deleteGlobalNotification": Models.SimpleResponse;
  "getAllInvoices": Models.DataResponsePagedModelInvoiceAdminResponse;
  "sendDebtInvoice": Models.DetailedDataResponseString;
  "getLiaraDnsProviders": Models.DataResponseLiaraDnsProviderDetailResponse;
  "saveLiaraDnsProvider": Models.SimpleResponse;
  "getAllCategories": Models.DataResponseListCategoryListAdminResponse;
  "addCategory": Models.SimpleResponse;
  "editCategory": Models.SimpleResponse;
  "editAudioBotNode": Models.SimpleResponse;
  "initAudioBotNode": Models.SimpleResponse;
  "getSettings": Models.DataResponseApplicationSettingDto;
  "setSettings": Models.DetailedDataResponseApplicationSettingDto;
  "forceProlongResource": Models.SimpleResponse;
  "removeQueryInstance": Models.SimpleResponse;
  "editQueryInstance": Models.SimpleResponse;
  "enableQueryInstance": Models.SimpleResponse;
  "disableQueryInstance": Models.SimpleResponse;
  "getProvisioningStrategy": Models.DataResponseProvisionStrategy;
  "changeProvisioningStrategy": Models.SimpleResponse;
  "changeEnabled": Models.SimpleResponse;
  "toggleZoneActive": Models.SimpleResponse;
  "reassignRecord": Models.SimpleResponse;
  "getProvisioningStrategy_1": Models.DataResponseProvisionStrategy;
  "changeProvisioningStrategy_1": Models.SimpleResponse;
  "isAvailable": void;
  "checkAuthentication": void;
  "getWalletTransactions": Models.DataResponsePagedModelWalletTransactionResponse;
  "getBalance": Models.DataResponseWalletOverviewResponse;
  "getProfile": Models.DataResponseUserDetailResponse;
  "getTickets": Models.DataResponsePagedModelTicketListUserResponse;
  "getTicketDetails": Models.DataResponseTicketDetailBaseResponse;
  "getAttachment": Blob;
  "getIp": {

};
  "getResources": Models.DataResponseListResourceListResponse;
  "getResourceById": Models.DataResponseAbstractResourceDetailResponse;
  "getPanelAccess": Models.DataResponseAudioBotScopedPanelAccessResponse;
  "getProductByCategorySlug": unknown;
  "getAllGateways": Models.DataResponseListGatewayListUserResponse;
  "getAllGlobalNotifications_1": Models.DataResponseListSystemNotificationUserResponse;
  "getInvoices": Models.DataResponsePagedModelInvoiceUserResponse;
  "getInvoice": {

};
  "getProductByCategorySlug_1": unknown;
  "getCategories": Models.DataResponseListCategoryListResponse;
  "getAvailableZones": Models.DataResponseListZoneUserResponse;
  "getAssignedRecord": Models.DataResponseDnsRecordUserResponse;
  "getDashboardOverviewResponse": Models.DataResponseDashboardOverviewResponse;
  "getCategories_1": Models.DataResponseListCategoryListResponse;
  "getAllUsers": Models.DataResponsePagedModelUserListResponse;
  "getUserById": Models.DataResponseUserDetailAdminResponse;
  "getRoles": Models.DataResponseListRoleListResponse;
  "getAllTickets": Models.DataResponsePagedModelTicketListAdminResponse;
  "getAllUserTickets": Models.DataResponsePagedModelTicketListAdminResponse;
  "getTicketDetails_1": Models.DataResponseTicketDetailAdminResponse;
  "getAllResources": Models.DataResponsePagedModelResourceListAdminResponse;
  "getResource": Models.DataResponseAbstractResourceDetailResponse;
  "deleteResource": Models.SimpleResponse;
  "getAllProducts": unknown;
  "getProduct": Models.DataResponseAbstractProductDetailResponse;
  "deleteProduct": Models.SimpleResponse;
  "getGatewayDetails": Models.DataResponseGateway;
  "getModules": Models.DataResponseListPaymentGatewayType;
  "zoneRecords": Models.DataResponseListDnsRecordAdminResponse;
  "liaraZoneRecords": Models.DataResponseListDnsRecordAdminResponse;
  "overview": Models.DataResponseAdminMetric;
  "getAllAudioBotNodes": Models.DataResponseListAudioBotNodeListResponse;
  "getAudioBotNodeDetail": Models.DataResponseAudioBotNodeDetailResponse;
  "deleteAudioBotNode": Models.SimpleResponse;
  "unassignRecord": Models.SimpleResponse;
  "unassignRecord_1": Models.SimpleResponse;
  "deleteCategory": Models.SimpleResponse;
  "closeTicket": Models.SimpleResponse;
}

export interface OperationMeta {
  method: string;
  path: string;
  bodyKind: 'json' | 'multipart' | 'form' | null;
  responseKind: 'json' | 'blob' | 'void';
}
