import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';

interface CredentialStub {
  id: string;
  fieldKey: string;
  lastRotatedAt: string | null;
}

interface PersonalCredentialStub {
  id: string;
  fieldKey: string;
  lastRotatedAt: string | null;
  createdAt: string;
}

interface FieldSchemaDef {
  type: string;
  label: string;
  required: boolean;
  default?: string | number;
}

interface EnvironmentResource {
  id: string;
  resourceTypeName: string;
  resourceTypeCode: string;
  templateName: string;
  isShared: boolean;
  sharedResourceId: string | null;
  sharedResourceName: string | null;
  isActive: boolean;
  notes: string | null;
  credentials: CredentialStub[];
  fieldSchema: Record<string, FieldSchemaDef>;
  sharedConnectionFields: Record<string, unknown>;
  sharedCredentials: CredentialStub[];
}

interface EndpointUrl {
  id: string | null;
  productEndpointId: string;
  endpointName: string;
  endpointType: string;
  baseUrl: string | null;
  swaggerUrl: string | null;
  healthCheckUrl: string | null;
  authTypeName: string | null;
  isActive: boolean;
  credentials: CredentialStub[];
}

interface AvailableTemplate {
  id: string;
  name: string;
  resourceTypeName: string;
  isRequired: boolean;
  canBeShared: boolean;
  fieldSchema: Record<string, FieldSchemaDef>;
  sharedResourceId: string | null;
  sharedResourceName: string | null;
}

interface SharedResourceOption {
  id: string;
  name: string;
  resourceTypeId: string;
  resourceTypeName: string;
  connectionFields: Record<string, unknown>;
  fieldSchema: Record<string, FieldSchemaDef>;
}

interface SharedResourceDetail {
  id: string;
  name: string;
  resourceTypeId: string;
  resourceTypeName: string;
  connectionFields: Record<string, unknown>;
  fieldSchema: Record<string, FieldSchemaDef>;
  credentials: { id: string; fieldKey: string }[];
}

interface EnvironmentSummary {
  id: string;
  name: string;
  environmentTypeName: string;
  environmentTypeCode: string;
  environmentTypeColor: string | null;
  isActive: boolean;
}

interface EnvironmentDetail {
  id: string;
  customerProductId: string;
  productId: string;
  customerId: string;
  customerName: string;
  productName: string;
  name: string;
  environmentTypeName: string;
  environmentTypeCode: string;
  environmentTypeColor: string | null;
  hostingPlatformId: string | null;
  hostingPlatformName: string | null;
  hostingPlatformIcon: string | null;
  hostingPlatformColor: string | null;
  isActive: boolean;
  notes: string | null;
  resources: EnvironmentResource[];
  endpoints: EndpointUrl[];
  availableTemplates: AvailableTemplate[];
}

interface HostingPlatformOption {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

@Component({
  selector: 'app-environment-detail',
  standalone: true,
  imports: [RouterLink, NgClass, FormsModule, DatePipe, TranslocoModule],
  template: `
    <div class="page-content">
      @if (loading()) {
        <div class="loading-state">{{ 'common.loading' | transloco }}</div>
      } @else if (!env()) {
        <div class="loading-state">{{ 'environments.notFound' | transloco }} <a routerLink="/customers">{{ 'environments.backToCustomers' | transloco }}</a></div>
      } @else {
        <div class="breadcrumb">
          <a routerLink="/customers">{{ 'environments.breadcrumbCustomers' | transloco }}</a>
          <span>/</span>
          <a [routerLink]="['/customers', env()!.customerId]">{{ env()!.customerName }}</a>
          <span>/</span>
          <span>{{ env()!.productName }}</span>
          <span>/</span>
          <span>{{ env()!.name }}</span>
        </div>

        <!-- Header -->
        <div class="header-card">
          <div class="header-left">
            <div class="env-icon" [style.background]="envColor(0.15)" [style.color]="env()!.environmentTypeColor ?? '#6B7280'">
              <i class="pi pi-server"></i>
            </div>
            <div>
              <div class="header-title-row">
                <h1>{{ env()!.name }}</h1>
                <span class="type-badge" [style.background]="envColor(0.15)" [style.color]="env()!.environmentTypeColor ?? '#6B7280'">
                  {{ env()!.environmentTypeName }}
                </span>
                <div class="plat-picker">
                  @if (env()!.hostingPlatformName) {
                    <button type="button" class="plat-badge plat-badge--btn"
                      [style.background]="hexAlpha(env()!.hostingPlatformColor, 0.15)"
                      [style.color]="env()!.hostingPlatformColor ?? '#6B7280'"
                      (click)="togglePlatformMenu($event)" [title]="'environments.changePlatform' | transloco">
                      <i class="pi" [ngClass]="env()!.hostingPlatformIcon ?? 'pi-server'"></i>
                      {{ env()!.hostingPlatformName }}
                      @if (platformSaving()) { <i class="pi pi-spin pi-spinner"></i> }
                      @else { <i class="pi pi-chevron-down plat-caret"></i> }
                    </button>
                  } @else {
                    <button type="button" class="plat-add-btn" (click)="togglePlatformMenu($event)">
                      <i class="pi pi-cloud"></i> {{ 'environments.selectPlatform' | transloco }}
                      @if (platformSaving()) { <i class="pi pi-spin pi-spinner"></i> }
                    </button>
                  }

                  @if (showPlatformMenu()) {
                    <div class="plat-menu-backdrop" (click)="showPlatformMenu.set(false)"></div>
                    <div class="plat-menu">
                      @for (p of hostingPlatforms(); track p.id) {
                        <button type="button" class="plat-menu-item"
                          [class.active]="p.id === env()!.hostingPlatformId"
                          (click)="selectPlatform(p.id)">
                          <span class="plat-menu-icon"
                            [style.background]="hexAlpha(p.color, 0.15)"
                            [style.color]="p.color ?? '#6B7280'">
                            <i class="pi" [ngClass]="p.icon ?? 'pi-server'"></i>
                          </span>
                          <span class="plat-menu-name">{{ p.name }}</span>
                          @if (p.id === env()!.hostingPlatformId) { <i class="pi pi-check"></i> }
                        </button>
                      }
                      @if (env()!.hostingPlatformId) {
                        <button type="button" class="plat-menu-item plat-menu-clear" (click)="selectPlatform('')">
                          <span class="plat-menu-icon plat-menu-icon--clear"><i class="pi pi-times"></i></span>
                          <span class="plat-menu-name">{{ 'environments.clearPlatform' | transloco }}</span>
                        </button>
                      }
                    </div>
                  }
                </div>
                @if (!env()!.isActive) {
                  <span class="badge badge--inactive">{{ 'environments.inactive' | transloco }}</span>
                }
              </div>
              @if (env()!.notes) {
                <p class="header-notes">{{ env()!.notes }}</p>
              }
              @if (siblings().length > 1) {
                <div class="env-switcher">
                  @for (s of siblings(); track s.id) {
                    <button type="button"
                      class="env-pill"
                      [class.env-pill--active]="s.id === env()!.id"
                      [style.background]="s.id === env()!.id ? siblingColor(s, 0.15) : ''"
                      [style.color]="s.id === env()!.id ? (s.environmentTypeColor ?? '#6B7280') : ''"
                      [style.border-color]="s.id === env()!.id ? (s.environmentTypeColor ?? '#6B7280') + '66' : ''"
                      [title]="s.environmentTypeName"
                      (click)="s.id !== env()!.id && navigateToSibling(s.id)">
                      <span class="env-pill-dot"
                        [style.background]="s.environmentTypeColor ?? '#6B7280'">
                      </span>
                      {{ s.name }}
                      @if (!s.isActive) {
                        <span class="env-pill-inactive">{{ 'environments.inactive' | transloco }}</span>
                      }
                    </button>
                  }
                </div>
              }
            </div>
          </div>
          <div class="header-stats">
            <div class="stat">
              <span class="stat-val">{{ env()!.resources.length }}</span>
              <span class="stat-lbl">{{ 'environments.statResources' | transloco }}</span>
            </div>
            <div class="stat">
              <span class="stat-val">{{ env()!.endpoints.length }}</span>
              <span class="stat-lbl">{{ 'environments.statEndpoints' | transloco }}</span>
            </div>
            <div class="stat">
              <span class="stat-val">{{ totalCredentialCount() }}</span>
              <span class="stat-lbl">{{ 'environments.statCredentials' | transloco }}</span>
            </div>
          </div>
        </div>

        <!-- Resources -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">{{ 'environments.resources' | transloco }}</h2>
            @if (env()!.availableTemplates.length) {
              <button type="button" class="btn-add-resource" (click)="openAddResource()">
                <i class="pi pi-plus"></i> {{ 'environments.addResource' | transloco }}
              </button>
            }
          </div>
          @if (!env()!.resources.length) {
            <div class="empty-card">
              <i class="pi pi-database"></i>
              <p>{{ 'environments.noResources' | transloco }}</p>
            </div>
          } @else {
            <div class="resource-list">
              @for (r of env()!.resources; track r.id) {
                <div class="resource-card" [class.inactive-card]="!r.isActive">
                  <div class="resource-header">
                    <div class="resource-meta">
                      <code class="type-code">{{ r.resourceTypeCode }}</code>
                      <span class="resource-name">{{ r.templateName }}</span>
                      <span class="resource-type-label">{{ r.resourceTypeName }}</span>
                      @if (r.isShared) {
                        <span class="badge badge--shared"><i class="pi pi-share-alt"></i> {{ 'environments.shared' | transloco }}</span>
                        @if (r.sharedResourceName) {
                          <span class="shared-name">{{ r.sharedResourceName }}</span>
                        }
                      }
                      @if (!r.isActive) {
                        <span class="badge badge--inactive">{{ 'environments.inactive' | transloco }}</span>
                      }
                    </div>
                    <div class="resource-actions">
                      @if (r.credentials.length) {
                        <span class="cred-count">{{ 'environments.credentialCount' | transloco:{ count: r.credentials.length } }}</span>
                      }
                      <button type="button" class="btn-cred" (click)="openCredModal(r)">
                        <i class="pi pi-key"></i> {{ 'environments.manageCredential' | transloco }}
                      </button>
                      <button type="button" class="btn-personal-cred" (click)="openPersonalCredModal(r)">
                        <i class="pi pi-user"></i> {{ 'environments.myPersonalCreds' | transloco }}
                        @if ((personalCreds()[r.id]?.length ?? 0) > 0) {
                          <span class="personal-cred-badge">{{ personalCreds()[r.id].length }}</span>
                        }
                      </button>
                      <button type="button" class="btn-remove-resource" [title]="'environments.removeResourceTitle' | transloco"
                        [disabled]="removingResourceId() === r.id"
                        (click)="removeResource(r)">
                        @if (removingResourceId() === r.id) {
                          <i class="pi pi-spin pi-spinner"></i>
                        } @else {
                          <i class="pi pi-trash"></i>
                        }
                      </button>
                    </div>
                  </div>
                  @if (r.notes) {
                    <p class="resource-notes">{{ r.notes }}</p>
                  }

                  <!-- Paylaşılan kaynaktan kalıtılan bilgiler -->
                  @if (r.isShared) {
                    @let inheritedConn = sharedConnEntries(r);
                    @if (inheritedConn.length || r.sharedCredentials.length) {
                      <div class="inherited-box">
                        <div class="inherited-title"><i class="pi pi-share-alt"></i> {{ 'environments.sharedValues' | transloco:{ name: r.sharedResourceName } }}</div>
                        <div class="cred-kv-grid">
                          @for (entry of inheritedConn; track entry.key) {
                            <div class="cred-kv-item">
                              <span class="cred-kv-label">{{ entry.label }}</span>
                              <span class="cred-kv-value">{{ entry.value }}</span>
                            </div>
                          }
                          @for (stub of r.sharedCredentials; track stub.id) {
                            <div class="cred-kv-item">
                              <span class="cred-kv-label">{{ sharedCredLabel(r, stub.fieldKey) }}</span>
                              <span class="cred-kv-value cred-kv-pw">
                                {{ cardVisiblePasswords()[stub.id] ? (cardRevealedValues()[stub.id] ?? '••••••') : '••••••' }}
                              </span>
                              <button type="button" class="cred-kv-eye"
                                [disabled]="cardRevealingIds()[stub.id]"
                                (click)="toggleCardPassword(stub.id)">
                                @if (cardRevealingIds()[stub.id]) {
                                  <i class="pi pi-spin pi-spinner"></i>
                                } @else {
                                  <i class="pi" [ngClass]="cardVisiblePasswords()[stub.id] ? 'pi-eye-slash' : 'pi-eye'"></i>
                                }
                              </button>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  }

                  @let schemaEntries = resourceOwnSchemaEntries(r);
                  @if (schemaEntries.length) {
                    <div class="cred-kv-grid">
                      @for (entry of schemaEntries; track entry.key) {
                        @let stub = credStubForKey(r, entry.key);
                        <div class="cred-kv-item" [class.cred-kv-missing]="!stub">
                          <span class="cred-kv-label">{{ entry.label }}</span>
                          @if (!stub) {
                            <span class="cred-kv-value cred-kv-empty">—</span>
                          } @else if (entry.type === 'password') {
                            <span class="cred-kv-value cred-kv-pw">
                              {{ cardVisiblePasswords()[stub.id] ? (cardRevealedValues()[stub.id] ?? '••••••') : '••••••' }}
                            </span>
                            <button type="button" class="cred-kv-eye"
                              [disabled]="cardRevealingIds()[stub.id]"
                              (click)="toggleCardPassword(stub.id)">
                              @if (cardRevealingIds()[stub.id]) {
                                <i class="pi pi-spin pi-spinner"></i>
                              } @else {
                                <i class="pi" [ngClass]="cardVisiblePasswords()[stub.id] ? 'pi-eye-slash' : 'pi-eye'"></i>
                              }
                            </button>
                          } @else {
                            <span class="cred-kv-value">{{ cardRevealedValues()[stub.id] ?? '···' }}</span>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Endpoint URLs -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">{{ 'environments.endpointUrls' | transloco }}</h2>
          </div>
          @if (!env()!.endpoints.length) {
            <div class="empty-card">
              <i class="pi pi-link"></i>
              <p>{{ 'environments.noEndpoints' | transloco }}</p>
            </div>
          } @else {
            <div class="endpoint-grid">
              @for (ep of env()!.endpoints; track ep.productEndpointId) {
                <div class="endpoint-card" [class.inactive-card]="!ep.isActive" [class.ep-no-url]="!ep.baseUrl">
                  <div class="ep-header">
                    <div class="ep-icon">
                      <i class="pi" [ngClass]="epTypeIcon(ep.endpointType)"></i>
                    </div>
                    <div class="ep-title">
                      <div class="ep-name">{{ ep.endpointName }}</div>
                      <div class="ep-type">{{ ep.endpointType }}</div>
                    </div>
                    <div class="ep-badges">
                      @if (!ep.isActive) {
                        <span class="badge badge--inactive">{{ 'environments.inactive' | transloco }}</span>
                      }
                      @if (ep.authTypeName && ep.authTypeName !== 'None') {
                        <span class="badge badge--auth">
                          <i class="pi pi-lock"></i> {{ authTypeLabel(ep.authTypeName) }}
                        </span>
                      }
                      @if (ep.credentials.length) {
                        <span class="ep-cred-count">{{ 'environments.credShort' | transloco:{ count: ep.credentials.length } }}</span>
                      }
                    </div>
                    <div class="ep-actions">
                      @if (ep.id) {
                        <button type="button" class="btn-ep-auth" (click)="openEpCredModal(ep)" [title]="'environments.manageAuth' | transloco">
                          <i class="pi pi-key"></i>
                        </button>
                      }
                      <button type="button" class="btn-ep-edit" (click)="openEndpointEdit(ep)" [title]="'environments.editUrl' | transloco">
                        <i class="pi pi-pencil"></i>
                      </button>
                      @if (ep.id) {
                        <button type="button" class="btn-ep-delete"
                          [disabled]="deletingEndpointId() === ep.productEndpointId"
                          (click)="deleteEndpoint(ep)" [title]="'environments.deleteUrlTitle' | transloco">
                          @if (deletingEndpointId() === ep.productEndpointId) {
                            <i class="pi pi-spin pi-spinner"></i>
                          } @else {
                            <i class="pi pi-trash"></i>
                          }
                        </button>
                      }
                    </div>
                  </div>
                  @if (ep.baseUrl) {
                    <div class="ep-urls">
                      <div class="url-row">
                        <span class="url-lbl">Base URL</span>
                        <a [href]="ep.baseUrl" target="_blank" class="url-link" title="{{ ep.baseUrl }}">
                          {{ ep.baseUrl }}<i class="pi pi-external-link"></i>
                        </a>
                        <button type="button" class="copy-btn" (click)="copy(ep.baseUrl)" [title]="'common.copy' | transloco">
                          <i class="pi pi-copy"></i>
                        </button>
                      </div>
                      @if (ep.swaggerUrl) {
                        <div class="url-row">
                          <span class="url-lbl">Swagger</span>
                          <a [href]="ep.swaggerUrl" target="_blank" class="url-link">
                            {{ ep.swaggerUrl }}<i class="pi pi-external-link"></i>
                          </a>
                          <button type="button" class="copy-btn" (click)="copy(ep.swaggerUrl!)" [title]="'common.copy' | transloco">
                            <i class="pi pi-copy"></i>
                          </button>
                        </div>
                      }
                      @if (ep.healthCheckUrl) {
                        <div class="url-row">
                          <span class="url-lbl">Health</span>
                          <a [href]="ep.healthCheckUrl" target="_blank" class="url-link">
                            {{ ep.healthCheckUrl }}<i class="pi pi-external-link"></i>
                          </a>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="ep-no-url-hint">
                      <i class="pi pi-info-circle"></i> {{ 'environments.urlNotSet' | transloco }}
                      <button type="button" class="btn-set-url" (click)="openEndpointEdit(ep)">{{ 'environments.setUrl' | transloco }}</button>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    <!-- Kaynak Ekle Modal -->
    @if (showAddResourceModal()) {
      <div class="modal-backdrop" (click)="closeAddResource()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ 'environments.addResource' | transloco }}</h2>
            <button type="button" class="modal-close" (click)="closeAddResource()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (addResourceError()) {
              <div class="alert-error">{{ addResourceError() }}</div>
            }
            <div class="form-group">
              <label>{{ 'environments.resourceTemplate' | transloco }} <span class="required">*</span></label>
              <select [(ngModel)]="addResourceForm.templateId"
                (ngModelChange)="onTemplateChange($event)"
                [class.input-error]="addResourceSubmitted() && !addResourceForm.templateId">
                <option value="">{{ 'environments.selectTemplate' | transloco }}</option>
                @for (t of env()!.availableTemplates; track t.id) {
                  <option [value]="t.id">{{ t.name }} ({{ t.resourceTypeName }})</option>
                }
              </select>
              @if (addResourceSubmitted() && !addResourceForm.templateId) {
                <span class="error-msg">{{ 'environments.templateRequired' | transloco }}</span>
              }
            </div>
            @if (templateBoundShared()) {
              <!-- Şablon belirli bir paylaşımlı kaynağa bağlı — otomatik kullanılır -->
              <div class="shared-bound-note">
                <i class="pi pi-share-alt"></i>
                <span [innerHTML]="'environments.templateBoundNote' | transloco:{ name: selectedTemplate()?.sharedResourceName }"></span>
              </div>

              <!-- Paylaşımlı kaynaktan kalıtılan bilgiler (salt okunur) -->
              @if (selectedSharedResource(); as sr) {
                @if (sharedFieldKeys().length || sharedCredKeys().length) {
                  <div class="cred-fields-section cred-fields-section--readonly">
                    <div class="cred-fields-title">
                      <i class="pi pi-lock"></i>
                      {{ 'environments.sharedInfoAuto' | transloco }}
                      <span class="cred-fields-hint">{{ 'environments.viaResource' | transloco:{ name: sr.name } }}</span>
                    </div>
                    @for (key of sharedFieldKeys(); track key) {
                      @let def = sr.fieldSchema[key];
                      <div class="form-group">
                        <label>
                          {{ def?.label ?? key }}
                          <code class="field-key-badge">{{ key }}</code>
                        </label>
                        <input type="text" [value]="$any(sr.connectionFields[key]) ?? ''" readonly class="input-readonly" />
                      </div>
                    }
                    @for (key of sharedCredKeys(); track key) {
                      @let def = sr.fieldSchema[key];
                      <div class="form-group">
                        <label>
                          {{ def?.label ?? key }}
                          <code class="field-key-badge">{{ key }}</code>
                          <span class="secret-tag"><i class="pi pi-lock"></i> {{ 'environments.encrypted' | transloco }}</span>
                        </label>
                        <input type="text" [value]="'environments.sharedPasswordPlaceholder' | transloco" readonly class="input-readonly" />
                      </div>
                    }
                  </div>
                }
                <div class="form-group">
                  <label class="checkbox-label-inline">
                    <input type="checkbox" [(ngModel)]="addResourceForm.override" />
                    {{ 'environments.overrideToggle' | transloco }}
                  </label>
                </div>
              }
            } @else if (selectedTemplate()?.canBeShared) {
              <div class="form-group">
                <label class="checkbox-label-inline">
                  <input type="checkbox" [(ngModel)]="addResourceForm.isShared" (ngModelChange)="onSharedChange()" />
                  {{ 'environments.useSharedResource' | transloco }}
                </label>
              </div>
              @if (addResourceForm.isShared) {
                <div class="form-group">
                  <label>{{ 'environments.sharedResource' | transloco }} <span class="required">*</span></label>
                  <select [(ngModel)]="addResourceForm.sharedResourceId"
                    (ngModelChange)="onSharedResourceSelect($event)"
                    [class.input-error]="addResourceSubmitted() && addResourceForm.isShared && !addResourceForm.sharedResourceId">
                    <option value="">{{ 'common.select' | transloco }}</option>
                    @for (sr of sharedResources(); track sr.id) {
                      <option [value]="sr.id">{{ sr.name }} ({{ sr.resourceTypeName }})</option>
                    }
                  </select>
                  @if (addResourceSubmitted() && addResourceForm.isShared && !addResourceForm.sharedResourceId) {
                    <span class="error-msg">{{ 'environments.sharedResourceRequired' | transloco }}</span>
                  }
                </div>

                <!-- Paylaşımlı kaynaktan kalıtılan bilgiler (salt okunur) -->
                @if (selectedSharedResource(); as sr) {
                  @if (sharedFieldKeys().length || sharedCredKeys().length) {
                    <div class="cred-fields-section cred-fields-section--readonly">
                      <div class="cred-fields-title">
                        <i class="pi pi-lock"></i>
                        {{ 'environments.sharedInfoAuto' | transloco }}
                        <span class="cred-fields-hint">{{ 'environments.viaResource' | transloco:{ name: sr.name } }}</span>
                      </div>
                      @for (key of sharedFieldKeys(); track key) {
                        @let def = sr.fieldSchema[key];
                        <div class="form-group">
                          <label>
                            {{ def?.label ?? key }}
                            <code class="field-key-badge">{{ key }}</code>
                          </label>
                          <input type="text" [value]="$any(sr.connectionFields[key]) ?? ''" readonly class="input-readonly" />
                        </div>
                      }
                      @for (key of sharedCredKeys(); track key) {
                        @let def = sr.fieldSchema[key];
                        <div class="form-group">
                          <label>
                            {{ def?.label ?? key }}
                            <code class="field-key-badge">{{ key }}</code>
                            <span class="secret-tag"><i class="pi pi-lock"></i> {{ 'environments.encrypted' | transloco }}</span>
                          </label>
                          <input type="text" [value]="'environments.sharedPasswordPlaceholder' | transloco" readonly class="input-readonly" />
                        </div>
                      }
                    </div>
                  }

                  <!-- Override toggle -->
                  <div class="form-group">
                    <label class="checkbox-label-inline">
                      <input type="checkbox" [(ngModel)]="addResourceForm.override" />
                      {{ 'environments.overrideToggle' | transloco }}
                    </label>
                  </div>
                }
              }
            }
            <div class="form-group">
              <label>{{ 'environments.notes' | transloco }}</label>
              <input type="text" [(ngModel)]="addResourceForm.notes" [placeholder]="'environments.notesPlaceholder' | transloco" />
            </div>

            <!-- Dinamik credential alanları -->
            @let tpl = selectedTemplate();
            @if (tpl) {
              @let useShared = addResourceForm.isShared && selectedSharedResource();
              @let fieldKeys = useShared
                ? (addResourceForm.override ? addResourceSchemaKeys(tpl) : privateFieldKeys(tpl))
                : addResourceSchemaKeys(tpl);
              @if (fieldKeys.length) {
                <div class="cred-fields-section">
                  <div class="cred-fields-title">
                    <i class="pi pi-key"></i>
                    @if (useShared) {
                      {{ 'environments.envSpecificInfo' | transloco }}
                    } @else {
                      {{ 'environments.connectionInfo' | transloco }}
                    }
                    <span class="cred-fields-hint">{{ 'environments.resourceTypeHint' | transloco:{ name: tpl.resourceTypeName } }}</span>
                  </div>
                  @for (key of fieldKeys; track key) {
                    @let def = tpl.fieldSchema[key];
                    <div class="form-group">
                      <label>
                        {{ def.label }}
                        @if (def.required) { <span class="required">*</span> }
                        <code class="field-key-badge">{{ key }}</code>
                      </label>
                      @if (def.type === 'password') {
                        <input type="password" autocomplete="new-password"
                          [value]="addResourceCreds[key] ?? ''"
                          (input)="addResourceCreds[key] = $any($event.target).value"
                          [placeholder]="def.required ? ('environments.requiredFieldPlaceholder' | transloco) : ('environments.optionalPlaceholder' | transloco)" />
                      } @else if (def.type === 'number') {
                        <input type="number"
                          [value]="addResourceCreds[key] ?? ''"
                          (input)="addResourceCreds[key] = $any($event.target).value"
                          [placeholder]="def['default'] != null ? ('environments.defaultPlaceholder' | transloco:{ value: def['default'] }) : ''" />
                      } @else {
                        <input type="text"
                          [value]="addResourceCreds[key] ?? ''"
                          (input)="addResourceCreds[key] = $any($event.target).value"
                          [placeholder]="def['default'] != null ? ('environments.defaultPlaceholder' | transloco:{ value: def['default'] }) : (def.required ? ('environments.requiredFieldPlaceholder' | transloco) : ('environments.optionalPlaceholder' | transloco))" />
                      }
                    </div>
                  }
                </div>
              }
            }
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeAddResource()">{{ 'common.cancel' | transloco }}</button>
            <button type="button" class="btn btn-primary" [disabled]="addResourceSaving()" (click)="saveResource()">
              @if (addResourceSaving()) { <i class="pi pi-spin pi-spinner"></i> {{ 'common.adding' | transloco }} } @else { {{ 'common.add' | transloco }} }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Endpoint URL Düzenleme Modal -->
    @if (showEpModal() && editingEp()) {
      <div class="modal-backdrop" (click)="closeEpModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>{{ (editingEp()!.baseUrl ? 'environments.editEndpointUrl' : 'environments.setEndpointUrl') | transloco }}</h2>
              <p class="modal-subtitle">{{ editingEp()!.endpointName }} · {{ editingEp()!.endpointType }}</p>
            </div>
            <button type="button" class="modal-close" (click)="closeEpModal()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (epSaveError()) {
              <div class="alert-error">{{ epSaveError() }}</div>
            }
            <div class="form-group">
              <label>Base URL <span class="required">*</span></label>
              <input type="url" [(ngModel)]="epForm.baseUrl" placeholder="https://api.example.com"
                [class.input-error]="epSubmitted() && !epForm.baseUrl.trim()" />
              @if (epSubmitted() && !epForm.baseUrl.trim()) {
                <span class="error-msg">{{ 'environments.baseUrlRequired' | transloco }}</span>
              }
            </div>
            <div class="form-group">
              <label>Swagger URL</label>
              <input type="url" [(ngModel)]="epForm.swaggerUrl" placeholder="https://api.example.com/swagger" />
            </div>
            <div class="form-group">
              <label>Health Check URL</label>
              <input type="url" [(ngModel)]="epForm.healthCheckUrl" placeholder="https://api.example.com/health" />
            </div>
            <div class="form-group">
              <label>{{ 'environments.authType' | transloco }}</label>
              <select [(ngModel)]="epForm.authType">
                <option value="None">{{ 'environments.authNone' | transloco }}</option>
                <option value="BasicAuth">{{ 'environments.authBasic' | transloco }}</option>
                <option value="BearerToken">Bearer Token</option>
                <option value="ApiKey">API Key</option>
                <option value="OAuth2">{{ 'environments.authOAuth2' | transloco }}</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeEpModal()">{{ 'common.cancel' | transloco }}</button>
            <button type="button" class="btn btn-primary" [disabled]="epSaving()" (click)="saveEndpointUrl()">
              @if (epSaving()) { {{ 'common.saving' | transloco }} } @else { {{ 'common.save' | transloco }} }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Kişisel Credential Modal -->
    @if (showPersonalCredModal() && personalCredResource()) {
      <div class="modal-backdrop" (click)="closePersonalCredModal()">
        <div class="modal modal--wide" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>{{ 'environments.personalCredsMgmt' | transloco }}</h2>
              <p class="modal-subtitle">{{ personalCredResource()!.templateName }} · {{ personalCredResource()!.resourceTypeName }}</p>
            </div>
            <button type="button" class="modal-close" (click)="closePersonalCredModal()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">

            <!-- Bilgi kutusu -->
            <div class="personal-creds-info-box">
              <i class="pi pi-shield"></i>
              {{ 'environments.personalCredsInfo' | transloco }}
            </div>

            <!-- Mevcut kişisel credential'lar -->
            @if (personalCredsLoading()[personalCredResource()!.id]) {
              <div class="loading-state">{{ 'common.loading' | transloco }}</div>
            } @else if ((personalCreds()[personalCredResource()!.id]?.length ?? 0) === 0) {
              <p class="empty-creds">{{ 'environments.personalCredsEmpty' | transloco }}</p>
            } @else {
              <div class="cred-section-title">{{ 'environments.savedCredentials' | transloco }}</div>
              <div class="cred-table">
                @for (c of personalCreds()[personalCredResource()!.id]; track c.id) {
                  <div class="cred-row">
                    <span class="cred-key">
                      <i class="pi pi-user"></i>
                      {{ fieldLabelForResource(personalCredResource()!, c.fieldKey) }}
                      <code class="cred-key-code">{{ c.fieldKey }}</code>
                    </span>
                    <div class="cred-value-cell">
                      @if (personalCredsRevealed()[c.id]; as val) {
                        <span class="cred-revealed">{{ val }}</span>
                        <button type="button" class="copy-btn" (click)="copy(val)" [title]="'common.copy' | transloco"><i class="pi pi-copy"></i></button>
                        <button type="button" class="btn-hide" (click)="hidePersonalCredValue(c.id)"><i class="pi pi-eye-slash"></i> {{ 'environments.hide' | transloco }}</button>
                      } @else {
                        <span class="cred-masked-lg">••••••••</span>
                        <button type="button" class="btn-reveal" [disabled]="personalCredsRevealLoading()[c.id]" (click)="revealPersonalCred(c.id)">
                          @if (personalCredsRevealLoading()[c.id]) { <i class="pi pi-spin pi-spinner"></i> }
                          @else { <i class="pi pi-eye"></i> {{ 'environments.reveal' | transloco }} }
                        </button>
                      }
                    </div>
                    <div class="cred-meta">
                      @if (c.lastRotatedAt) {
                        <span class="cred-rotated">{{ c.lastRotatedAt | date:'dd.MM.yyyy HH:mm' }}</span>
                      }
                      <button type="button" class="btn-edit-cred"
                        (click)="startEditPersonalCred(c)" [title]="'common.update' | transloco">
                        <i class="pi pi-pencil"></i>
                      </button>
                      <button type="button" class="btn-del-cred"
                        [disabled]="deletingPersonalCredId()[c.id]"
                        (click)="deletePersonalCred(c.id)" [title]="'common.delete' | transloco">
                        @if (deletingPersonalCredId()[c.id]) { <i class="pi pi-spin pi-spinner"></i> }
                        @else { <i class="pi pi-trash"></i> }
                      </button>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Ekle / Güncelle formu -->
            <div class="cred-form-divider">
              <span>{{ personalCredEditingKey() ? ('environments.updateField' | transloco:{ field: fieldLabelForResource(personalCredResource()!, personalCredEditingKey()!) }) : ('environments.addCredential' | transloco) }}</span>
              @if (personalCredEditingKey()) {
                <button type="button" class="btn-cancel-edit" (click)="cancelEditPersonalCred()">{{ 'common.cancel' | transloco }}</button>
              }
            </div>
            <div class="cred-form">
              <div class="form-group">
                <label>{{ 'environments.fieldName' | transloco }} <span class="required">*</span></label>
                @if (personalCredSchemaKeys().length && !personalCredEditingKey()) {
                  <select [(ngModel)]="personalCredForm.fieldKey"
                    [class.input-error]="personalCredSubmitted() && !personalCredForm.fieldKey.trim()">
                    <option value="">{{ 'environments.selectField' | transloco }}</option>
                    @for (fk of personalCredSchemaKeys(); track fk) {
                      <option [value]="fk">{{ fieldLabelForResource(personalCredResource()!, fk) }} ({{ fk }})</option>
                    }
                    <option value="__custom__">{{ 'environments.customField' | transloco }}</option>
                  </select>
                } @else {
                  <input type="text" [(ngModel)]="personalCredForm.fieldKey"
                    [placeholder]="'environments.fieldKeyPlaceholder' | transloco"
                    [disabled]="!!personalCredEditingKey()"
                    [class.input-error]="personalCredSubmitted() && !personalCredForm.fieldKey.trim()" />
                }
                @if (personalCredSubmitted() && !personalCredForm.fieldKey.trim()) {
                  <span class="error-msg">{{ 'environments.fieldNameRequired' | transloco }}</span>
                }
                @if (personalCredForm.fieldKey === '__custom__') {
                  <input type="text" [(ngModel)]="personalCredForm.customFieldKey"
                    [placeholder]="'environments.enterFieldName' | transloco"
                    style="margin-top:0.375rem" />
                }
              </div>
              <div class="form-group">
                <label>{{ 'environments.value' | transloco }} <span class="required">*</span></label>
                <div class="password-input-wrap">
                  <input [type]="personalCredShowValue() ? 'text' : 'password'"
                    [(ngModel)]="personalCredForm.value"
                    [placeholder]="'environments.enterValue' | transloco"
                    [class.input-error]="personalCredSubmitted() && !personalCredForm.value.trim()" />
                  <button type="button" class="pw-toggle" (click)="togglePersonalCredValue()">
                    <i class="pi" [class]="personalCredShowValue() ? 'pi-eye-slash' : 'pi-eye'"></i>
                  </button>
                </div>
                @if (personalCredSubmitted() && !personalCredForm.value.trim()) {
                  <span class="error-msg">{{ 'environments.valueRequired' | transloco }}</span>
                }
              </div>
              @if (personalCredError()) {
                <div class="alert-error">{{ personalCredError() }}</div>
              }
              <button type="button" class="btn-save-cred" [disabled]="personalCredSaving()" (click)="savePersonalCred()">
                @if (personalCredSaving()) { <i class="pi pi-spin pi-spinner"></i> {{ 'common.saving' | transloco }} }
                @else { <i class="pi pi-check"></i> {{ (personalCredEditingKey() ? 'common.update' : 'common.add') | transloco }} }
              </button>
            </div>

          </div>
        </div>
      </div>
    }

    <!-- Credential Yönetim Modal -->
    @if (showCredModal() && (credResource() || credEndpoint())) {
      <div class="modal-backdrop" (click)="closeCredModal()">
        <div class="modal modal--wide" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>{{ (credEndpoint() ? 'environments.authCredMgmt' : 'environments.credMgmt') | transloco }}</h2>
              <p class="modal-subtitle">
                {{ credResource() ? (credResource()!.templateName + ' · ' + credResource()!.resourceTypeName)
                                  : (credEndpoint()!.endpointName + ' · ' + authTypeLabel(credEndpoint()!.authTypeName)) }}
              </p>
            </div>
            <button type="button" class="modal-close" (click)="closeCredModal()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">

            <!-- Mevcut Credential'lar -->
            @if (activeCredentials().length) {
              <div class="cred-section-title">{{ 'environments.savedCredentials' | transloco }}</div>
              <div class="cred-table">
                @for (c of activeCredentials(); track c.id) {
                  <div class="cred-row">
                    <span class="cred-key">
                      <i class="pi pi-key"></i>
                      {{ fieldLabel(c.fieldKey) }}
                      <code class="cred-key-code">{{ c.fieldKey }}</code>
                    </span>
                    <div class="cred-value-cell">
                      @if (revealedValues()[c.id]; as val) {
                        <span class="cred-revealed">{{ val }}</span>
                        <button type="button" class="copy-btn" (click)="copy(val)" [title]="'common.copy' | transloco"><i class="pi pi-copy"></i></button>
                        <button type="button" class="btn-hide" (click)="hideValue(c.id)"><i class="pi pi-eye-slash"></i> {{ 'environments.hide' | transloco }}</button>
                      } @else {
                        <span class="cred-masked-lg">••••••••</span>
                        <button type="button" class="btn-reveal" [disabled]="revealLoading()[c.id]" (click)="reveal(c.id)">
                          @if (revealLoading()[c.id]) { <i class="pi pi-spin pi-spinner"></i> }
                          @else { <i class="pi pi-eye"></i> {{ 'environments.reveal' | transloco }} }
                        </button>
                      }
                    </div>
                    <div class="cred-meta">
                      @if (c.lastRotatedAt) {
                        <span class="cred-rotated">{{ c.lastRotatedAt | date:'dd.MM.yyyy HH:mm' }}</span>
                      }
                      <button type="button" class="btn-edit-cred" (click)="startEdit(c)" [title]="'common.update' | transloco">
                        <i class="pi pi-pencil"></i>
                      </button>
                      <button type="button" class="btn-del-cred" (click)="deleteCredential(c.id)" [title]="'common.delete' | transloco"
                        [disabled]="deletingCredId() === c.id">
                        @if (deletingCredId() === c.id) { <i class="pi pi-spin pi-spinner"></i> }
                        @else { <i class="pi pi-trash"></i> }
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="empty-creds">{{ (credEndpoint() ? 'environments.noAuthCreds' : 'environments.noResourceCreds') | transloco }}</p>
            }

            <!-- FieldSchema'dan gelen tanımsız alanlar için hızlı ekleme -->
            @if (undefinedSchemaFields().length && !editingCredKey) {
              <div class="schema-hint">
                <i class="pi pi-info-circle"></i>
                {{ 'environments.missingFields' | transloco }}
                @for (fk of undefinedSchemaFields(); track fk) {
                  <button type="button" class="schema-field-chip" (click)="prefillField(fk)">
                    + {{ fieldLabel(fk) }}
                  </button>
                }
              </div>
            }

            <!-- Yeni / Güncelleme Formu -->
            <div class="cred-form-divider">
              <span>{{ editingCredKey ? ('environments.updateField' | transloco:{ field: fieldLabel(editingCredKey) }) : ('environments.addCredential' | transloco) }}</span>
              @if (editingCredKey) {
                <button type="button" class="btn-cancel-edit" (click)="cancelEdit()">{{ 'common.cancel' | transloco }}</button>
              }
            </div>
            <div class="cred-form">
              <div class="form-group">
                <label>{{ 'environments.fieldName' | transloco }} <span class="required">*</span></label>
                @if (schemaKeys().length && !editingCredKey) {
                  <select [(ngModel)]="credForm.fieldKey"
                    [class.input-error]="credSubmitted() && !credForm.fieldKey.trim()">
                    <option value="">{{ 'environments.selectField' | transloco }}</option>
                    @for (fk of schemaKeys(); track fk) {
                      <option [value]="fk">{{ fieldLabel(fk) }} ({{ fk }})</option>
                    }
                    <option value="__custom__">{{ 'environments.customField' | transloco }}</option>
                  </select>
                } @else {
                  <input type="text" [(ngModel)]="credForm.fieldKey"
                    [placeholder]="'environments.fieldKeyPlaceholder' | transloco"
                    [disabled]="!!editingCredKey"
                    [class.input-error]="credSubmitted() && !credForm.fieldKey.trim()" />
                }
                @if (credSubmitted() && !credForm.fieldKey.trim()) {
                  <span class="error-msg">{{ 'environments.fieldNameRequired' | transloco }}</span>
                }
                @if (credForm.fieldKey === '__custom__') {
                  <input type="text" [(ngModel)]="credForm.customFieldKey" [placeholder]="'environments.enterFieldName' | transloco"
                    style="margin-top:0.375rem" />
                }
              </div>
              <div class="form-group">
                <label>{{ 'environments.value' | transloco }} <span class="required">*</span></label>
                <div class="password-input-wrap">
                  <input [type]="isValueHidden() ? 'password' : 'text'" [(ngModel)]="credForm.value"
                    [placeholder]="'environments.enterValue' | transloco"
                    [class.input-error]="credSubmitted() && !credForm.value.trim()" />
                  @if (isSecretField(activeFieldKey())) {
                    <button type="button" class="pw-toggle" (click)="showNewValue = !showNewValue">
                      <i class="pi" [class]="showNewValue ? 'pi-eye-slash' : 'pi-eye'"></i>
                    </button>
                  }
                </div>
                @if (credSubmitted() && !credForm.value.trim()) {
                  <span class="error-msg">{{ 'environments.valueRequired' | transloco }}</span>
                }
              </div>
              @if (credError()) {
                <div class="alert-error">{{ credError() }}</div>
              }
              <button type="button" class="btn-save-cred" [disabled]="credSaving()" (click)="saveCredential()">
                @if (credSaving()) { <i class="pi pi-spin pi-spinner"></i> {{ 'common.saving' | transloco }} }
                @else { <i class="pi pi-check"></i> {{ (editingCredKey ? 'common.update' : 'common.add') | transloco }} }
              </button>
            </div>

          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-state { text-align: center; padding: 4rem; color: var(--text-subtle); a { color: var(--primary); text-decoration: none; } }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.25rem; a { color: var(--primary); text-decoration: none; &:hover { text-decoration: underline; } } }

    .header-card { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); flex-wrap: wrap; }
    .header-left { display: flex; align-items: center; gap: 1rem; flex: 1; }
    .env-icon { width: 3rem; height: 3rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; }
    .header-title-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; h1 { font-size: 1.25rem; font-weight: 700; color: var(--text-strong); } }
    .type-badge { display: inline-flex; align-items: center; padding: 0.2rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .plat-badge { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; i { font-size: 0.7rem; } }
    .header-notes { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }

    .plat-picker { position: relative; display: inline-flex; }
    .plat-badge--btn { border: none; cursor: pointer; transition: filter 0.12s; &:hover { filter: brightness(0.95); } }
    .plat-caret { opacity: 0.7; font-size: 0.6rem !important; }
    .plat-add-btn { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; cursor: pointer; color: var(--text-muted); background: transparent; border: 1px dashed var(--border-strong); &:hover { border-color: var(--primary); color: var(--primary); } i { font-size: 0.7rem; } }
    .plat-menu-backdrop { position: fixed; inset: 0; z-index: 90; }
    .plat-menu { position: absolute; top: calc(100% + 0.375rem); left: 0; z-index: 100; min-width: 220px; background: var(--surface); border: 1px solid var(--border); border-radius: 0.625rem; box-shadow: var(--shadow-lg); padding: 0.375rem; display: flex; flex-direction: column; gap: 1px; }
    .plat-menu-item { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.4rem 0.5rem; background: none; border: none; cursor: pointer; border-radius: 0.375rem; font-size: 0.8125rem; color: var(--text); text-align: left; &:hover { background: var(--hover); } &.active { background: var(--primary-soft-bg); } i.pi-check { margin-left: auto; color: var(--primary); font-size: 0.75rem; } }
    .plat-menu-icon { width: 1.5rem; height: 1.5rem; border-radius: 0.375rem; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0; }
    .plat-menu-icon--clear { background: var(--surface-3); color: var(--text-muted); }
    .plat-menu-name { flex: 1; }
    .plat-menu-clear { color: var(--text-muted); border-top: 1px solid var(--border-light); margin-top: 1px; padding-top: 0.45rem; }
    .env-switcher { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.625rem; }
    .env-pill { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.25rem 0.625rem; border: 1px solid var(--border); border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background: var(--surface); color: var(--text-muted); cursor: pointer; transition: all 0.15s; white-space: nowrap; &:hover:not(.env-pill--active) { background: var(--surface-3); border-color: var(--border-strong); color: var(--text); } }
    .env-pill--active { font-weight: 600; cursor: default; }
    .env-pill-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; flex-shrink: 0; }
    .env-pill-inactive { font-size: 0.65rem; color: var(--text-subtle); font-weight: 400; }
    .header-stats { display: flex; gap: 1.5rem; flex-shrink: 0; }
    .stat { text-align: center; }
    .stat-val { display: block; font-size: 1.5rem; font-weight: 700; color: var(--text-strong); }
    .stat-lbl { font-size: 0.75rem; color: var(--text-subtle); }

    .section { margin-bottom: 1.5rem; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .section-title { font-size: 1rem; font-weight: 700; color: var(--text); margin: 0; }
    .btn-add-resource { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-size: 0.8125rem; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 0.375rem; &:hover { border-color: var(--primary); color: var(--primary-hover); background: var(--primary-soft-bg); } }
    .checkbox-label-inline { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text); cursor: pointer; }
    .empty-card { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 2.5rem; text-align: center; color: var(--text-subtle); i { font-size: 2rem; margin-bottom: 0.5rem; display: block; } p { font-size: 0.875rem; } }

    /* Resource cards */
    .resource-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .resource-card { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1rem 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .inactive-card { opacity: 0.65; }
    .resource-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .resource-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .type-code { background: var(--surface-3); color: var(--text-muted); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.75rem; }
    .resource-name { font-weight: 600; color: var(--text-strong); font-size: 0.875rem; }
    .resource-type-label { font-size: 0.8125rem; color: var(--text-muted); }
    .shared-name { font-size: 0.75rem; color: var(--text-muted); }
    .resource-actions { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
    .cred-count { font-size: 0.75rem; color: var(--text-muted); background: var(--surface-3); padding: 0.125rem 0.5rem; border-radius: 9999px; }
    .btn-cred { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-size: 0.8125rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.375rem; &:hover { border-color: var(--warning); color: var(--warning-soft-text); background: var(--warning-faint-bg); } }
    .btn-remove-resource { background: none; border: 1px solid var(--border); border-radius: 0.375rem; padding: 0.25rem 0.5rem; font-size: 0.8125rem; cursor: pointer; color: var(--text-subtle); display: inline-flex; align-items: center; &:hover { border-color: var(--danger-soft-text); color: var(--danger); background: var(--danger-faint-bg); } &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .resource-notes { font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.5rem; }
    /* Key:value credential grid in resource cards */
    .cred-kv-grid { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.625rem; }
    .cred-kv-item { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.25rem 0.5rem 0.25rem 0.625rem; background: var(--surface-2); border: 1px solid var(--border); border-radius: 0.375rem; font-size: 0.75rem; }
    .cred-kv-item.cred-kv-missing { background: var(--warning-faint-bg); border-color: var(--warning-border); }
    .cred-kv-label { color: var(--text-muted); font-weight: 500; }
    .cred-kv-value { color: var(--text-strong); font-family: monospace; font-weight: 600; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cred-kv-pw { letter-spacing: 0.05em; }
    .cred-kv-empty { color: var(--warning-strong); font-family: inherit; }
    .cred-kv-eye { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-size: 0.75rem; display: inline-flex; align-items: center; flex-shrink: 0; &:hover:not(:disabled) { color: var(--text); background: var(--border); } &:disabled { opacity: 0.5; cursor: default; } }

    /* Dynamic credential fields in add-resource modal */
    .cred-fields-section { background: var(--primary-soft-bg); border: 1px solid var(--primary-soft-bg-2); border-radius: 0.5rem; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .cred-fields-section--readonly { background: var(--surface-2); border-color: var(--border); .cred-fields-title { color: var(--text-muted); i { color: var(--text-subtle); } } }
    .cred-fields-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; font-weight: 600; color: var(--primary-soft-text); i { color: var(--primary); } }
    .cred-fields-hint { font-size: 0.75rem; color: var(--text-muted); font-weight: 400; }
    .input-readonly { background: var(--surface-3) !important; color: var(--text-muted); cursor: not-allowed; border-color: var(--border) !important; }
    .secret-tag { font-size: 0.6875rem; color: var(--warning-soft-text); background: var(--warning-soft-bg); padding: 0.0625rem 0.375rem; border-radius: 0.25rem; font-weight: 500; display: inline-flex; align-items: center; gap: 0.1875rem; margin-left: 0.25rem; }
    .shared-bound-note { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 0.875rem; background: var(--primary-soft-bg); border: 1px solid var(--primary-soft-bg-2); border-radius: 0.5rem; font-size: 0.8125rem; color: var(--primary-strong); i { color: var(--primary); } strong { font-weight: 600; } }
    .inherited-box { background: var(--surface-2); border: 1px dashed var(--border-strong); border-radius: 0.5rem; padding: 0.75rem; margin-top: 0.5rem; }
    .inherited-title { display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem; i { color: var(--text-subtle); } }
    .field-key-badge { background: var(--primary-soft-bg); color: var(--primary-strong); padding: 0.1rem 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.7rem; margin-left: 0.25rem; }

    /* Endpoint grid */
    .endpoint-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 0.75rem; }
    .endpoint-card { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .ep-no-url { border-style: dashed; background: var(--surface-2); }
    .ep-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .ep-icon { width: 2rem; height: 2rem; background: var(--indigo-soft-bg); color: var(--indigo-strong); border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.875rem; }
    .ep-title { flex: 1; min-width: 0; }
    .ep-name { font-weight: 600; color: var(--text-strong); font-size: 0.875rem; }
    .ep-type { font-size: 0.75rem; color: var(--text-subtle); }
    .ep-badges { display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
    .ep-actions { display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; }
    .ep-cred-count { font-size: 0.7rem; color: var(--text-muted); background: var(--surface-3); padding: 0.1rem 0.4rem; border-radius: 9999px; }
    .badge--auth { background: var(--warning-soft-bg); color: var(--warning-soft-text); }
    .btn-ep-auth { background: none; border: 1px solid var(--border); border-radius: 0.375rem; padding: 0.25rem 0.5rem; cursor: pointer; color: var(--text-subtle); font-size: 0.75rem; flex-shrink: 0; &:hover { border-color: var(--warning); color: var(--warning-soft-text); background: var(--warning-faint-bg); } }
    .btn-ep-edit { background: none; border: 1px solid var(--border); border-radius: 0.375rem; padding: 0.25rem 0.5rem; cursor: pointer; color: var(--text-subtle); font-size: 0.75rem; flex-shrink: 0; &:hover { background: var(--surface-3); color: var(--text); border-color: var(--border-strong); } }
    .btn-ep-delete { background: none; border: 1px solid var(--border); border-radius: 0.375rem; padding: 0.25rem 0.5rem; cursor: pointer; color: var(--text-subtle); font-size: 0.75rem; flex-shrink: 0; &:hover { border-color: var(--danger-soft-text); color: var(--danger); background: var(--danger-faint-bg); } &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .ep-no-url-hint { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: var(--text-subtle); padding: 0.5rem 0; i { font-size: 0.75rem; } }
    .btn-set-url { background: none; border: 1px solid var(--border-strong); border-radius: 0.375rem; padding: 0.2rem 0.625rem; font-size: 0.8125rem; cursor: pointer; color: var(--text); margin-left: 0.25rem; &:hover { border-color: var(--primary); color: var(--primary-hover); background: var(--primary-soft-bg); } }
    .ep-urls { display: flex; flex-direction: column; gap: 0.5rem; }
    .url-row { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
    .url-lbl { font-size: 0.7rem; font-weight: 600; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.05em; flex-shrink: 0; width: 3.5rem; }
    .url-link { flex: 1; font-size: 0.8125rem; color: var(--primary); text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 0.25rem; &:hover { text-decoration: underline; } i { font-size: 0.7rem; flex-shrink: 0; } }
    .copy-btn { background: none; border: 1px solid var(--border); border-radius: 0.25rem; padding: 0.125rem 0.375rem; cursor: pointer; color: var(--text-subtle); font-size: 0.75rem; flex-shrink: 0; &:hover { background: var(--surface-3); color: var(--text); } }

    /* Badges */
    .badge { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }
    .badge--active { background: var(--success-soft-bg); color: var(--success-soft-text); }
    .badge--inactive { background: var(--warning-soft-bg); color: var(--warning-soft-text); }
    .badge--shared { background: var(--violet-soft-bg); color: var(--violet-soft-text); }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--surface); border-radius: 0.75rem; width: 100%; max-width: 560px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; }
    .modal--wide { max-width: 680px; }
    .modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); flex-shrink: 0; h2 { font-size: 1.125rem; font-weight: 700; color: var(--text-strong); } }
    .modal-subtitle { font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.125rem; }
    .modal-close { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 1.25rem; padding: 0.25rem; border-radius: 0.375rem; flex-shrink: 0; &:hover { background: var(--surface-3); } }
    .modal-body { padding: 1.5rem; overflow-y: auto; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; flex-shrink: 0; }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1.25rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: var(--primary) !important; color: var(--surface) !important; &:not(:disabled):hover { background: var(--primary-hover) !important; } }
    .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); &:hover { background: var(--surface-3); } }

    /* Credential modal internals */
    .cred-section-title { font-size: 0.8125rem; font-weight: 600; color: var(--text); text-transform: uppercase; letter-spacing: 0.05em; }
    .cred-table { display: flex; flex-direction: column; gap: 0.5rem; }
    .cred-row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: var(--surface-2); border: 1px solid var(--border); border-radius: 0.5rem; }
    .cred-key { font-size: 0.875rem; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 0.375rem; min-width: 140px; i { color: var(--warning-strong); } }
    .cred-value-cell { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0; }
    .cred-revealed { font-family: monospace; font-size: 0.875rem; color: var(--success-soft-text); background: var(--success-soft-bg); padding: 0.25rem 0.5rem; border-radius: 0.25rem; word-break: break-all; flex: 1; }
    .cred-masked-lg { font-family: monospace; color: var(--text-subtle); letter-spacing: 0.1em; font-size: 1rem; }
    .btn-reveal { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-size: 0.8125rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.375rem; &:hover { border-color: var(--primary); color: var(--primary-hover); } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-hide { background: none; border: none; cursor: pointer; color: var(--text-subtle); font-size: 0.8125rem; display: inline-flex; align-items: center; gap: 0.25rem; &:hover { color: var(--text); } }
    .cred-meta { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .cred-rotated { font-size: 0.75rem; color: var(--text-subtle); }
    .btn-edit-cred { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 0.8125rem; display: inline-flex; align-items: center; gap: 0.25rem; &:hover { color: var(--text); } }
    .empty-creds { font-size: 0.875rem; color: var(--text-subtle); text-align: center; padding: 1rem; background: var(--surface-2); border: 1px dashed var(--border); border-radius: 0.5rem; }

    .cred-key-code { font-family: monospace; font-size: 0.7rem; background: var(--surface-3); color: var(--text-muted); padding: 0.1rem 0.3rem; border-radius: 0.2rem; }
    .btn-del-cred { background: none; border: none; cursor: pointer; color: var(--danger); font-size: 0.8125rem; padding: 0.2rem; border-radius: 0.25rem; display: inline-flex; align-items: center; &:hover { background: var(--danger-faint-bg); } &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .schema-hint { display: flex; align-items: center; flex-wrap: wrap; gap: 0.375rem; padding: 0.625rem; background: var(--primary-soft-bg); border: 1px solid var(--primary-soft-bg-2); border-radius: 0.5rem; font-size: 0.8125rem; color: var(--primary-strong); i { flex-shrink: 0; } }
    .schema-field-chip { background: var(--surface); color: var(--primary-strong); border: 1px solid var(--primary-soft-bg-2); border-radius: 9999px; padding: 0.15rem 0.6rem; font-size: 0.75rem; cursor: pointer; &:hover { background: var(--primary-soft-bg-2); } }
    .cred-form-divider { display: flex; align-items: center; justify-content: space-between; font-size: 0.8125rem; font-weight: 600; color: var(--text); border-top: 1px solid var(--border); padding-top: 0.75rem; }
    .btn-cancel-edit { background: none; border: none; cursor: pointer; color: var(--text-subtle); font-size: 0.8125rem; &:hover { color: var(--text); } }
    .cred-form { display: flex; flex-direction: column; gap: 0.875rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.8125rem; font-weight: 600; color: var(--text); } input, select { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.375rem; font-size: 0.875rem; color: var(--text-strong); background: var(--surface); &:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); } &:disabled { background: var(--surface-2); color: var(--text-subtle); } } }
    .password-input-wrap { position: relative; input { width: 100%; padding-right: 2.5rem; box-sizing: border-box; } }
    .pw-toggle { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.25rem; &:hover { color: var(--text); } }
    .input-error { border-color: var(--danger) !important; }
    .error-msg { font-size: 0.75rem; color: var(--danger); }
    .required { color: var(--danger); }
    .alert-error { padding: 0.75rem; background: var(--danger-faint-bg); border: 1px solid var(--danger-border); border-radius: 0.375rem; color: var(--danger-soft-text); font-size: 0.8125rem; }
    .btn-save-cred { background: var(--warning); color: white; border: none; border-radius: 0.5rem; padding: 0.5rem 1.25rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 0.375rem; align-self: flex-start; &:hover { background: var(--warning-strong); } &:disabled { opacity: 0.6; cursor: not-allowed; } }

    /* Personal credentials */
    .btn-personal-cred { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-size: 0.8125rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.375rem; &:hover { border-color: var(--indigo-strong); color: var(--indigo-strong); background: var(--indigo-soft-bg); } }
    .personal-cred-badge { background: var(--indigo-soft-bg); color: var(--indigo-strong); border-radius: 9999px; padding: 0.05rem 0.4rem; font-size: 0.7rem; font-weight: 700; }
    .personal-creds-info-box { display: flex; align-items: flex-start; gap: 0.625rem; padding: 0.75rem 1rem; background: var(--indigo-soft-bg); border: 1px solid var(--indigo-soft-bg-2, #c7d2fe); border-radius: 0.5rem; font-size: 0.8125rem; color: var(--indigo-strong, #4338ca); i { flex-shrink: 0; margin-top: 0.1rem; } }
  `]
})
export class EnvironmentDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private transloco = inject(TranslocoService);

  env = signal<EnvironmentDetail | null>(null);
  loading = signal(true);
  siblings = signal<EnvironmentSummary[]>([]);
  hostingPlatforms = signal<HostingPlatformOption[]>([]);
  platformSaving = signal(false);
  showPlatformMenu = signal(false);

  // Add resource modal state
  showAddResourceModal = signal(false);
  addResourceSaving = signal(false);
  addResourceSubmitted = signal(false);
  addResourceError = signal('');
  addResourceForm = { templateId: '', isShared: false, sharedResourceId: '', notes: '', override: false };
  addResourceCreds: Record<string, string> = {};
  selectedTemplate = signal<AvailableTemplate | null>(null);
  sharedResources = signal<SharedResourceOption[]>([]);
  selectedSharedResource = signal<SharedResourceOption | null>(null);
  sharedCredKeys = signal<string[]>([]);
  private sharedResourcesLoaded = false;

  openAddResource() {
    this.addResourceForm = { templateId: '', isShared: false, sharedResourceId: '', notes: '', override: false };
    this.addResourceCreds = {};
    this.selectedTemplate.set(null);
    this.selectedSharedResource.set(null);
    this.sharedCredKeys.set([]);
    this.addResourceSubmitted.set(false);
    this.addResourceError.set('');
    this.showAddResourceModal.set(true);
  }

  closeAddResource() { this.showAddResourceModal.set(false); }

  onTemplateChange(templateId: string) {
    const t = this.env()!.availableTemplates.find(x => x.id === templateId) ?? null;
    this.selectedTemplate.set(t);
    this.addResourceForm.isShared = false;
    this.addResourceForm.sharedResourceId = '';
    this.addResourceForm.override = false;
    this.addResourceCreds = {};
    this.selectedSharedResource.set(null);
    this.sharedCredKeys.set([]);

    // Şablon belirli bir paylaşımlı kaynağa bağlıysa otomatik kullan
    if (t?.sharedResourceId) {
      this.addResourceForm.isShared = true;
      this.addResourceForm.sharedResourceId = t.sharedResourceId;
      this.loadSharedResourceDetail(t.sharedResourceId);
    }
  }

  // Şablonun belirli bir paylaşımlı kaynağa bağlı olup olmadığı
  templateBoundShared(): boolean {
    return !!this.selectedTemplate()?.sharedResourceId;
  }

  private loadSharedResourceDetail(id: string) {
    this.http.get<SharedResourceDetail>(`${environment.apiUrl}/resources/shared/${id}`).subscribe({
      next: d => {
        this.selectedSharedResource.set({
          id: d.id,
          name: d.name,
          resourceTypeId: d.resourceTypeId,
          resourceTypeName: d.resourceTypeName,
          connectionFields: d.connectionFields ?? {},
          fieldSchema: d.fieldSchema ?? {}
        });
        this.sharedCredKeys.set((d.credentials ?? []).map(c => c.fieldKey));
      }
    });
  }

  addResourceSchemaKeys(tpl: AvailableTemplate): string[] {
    return tpl.fieldSchema ? Object.keys(tpl.fieldSchema) : [];
  }

  resourceSchemaEntries(r: EnvironmentResource): { key: string; label: string; type: string }[] {
    if (!r.fieldSchema) return [];
    return Object.entries(r.fieldSchema).map(([key, def]) => ({
      key,
      label: (def as FieldSchemaDef).label ?? key,
      type: (def as FieldSchemaDef).type ?? 'string'
    }));
  }

  // Kaynağın kendi (ortama özgü) alanları — paylaşımlıdan kalıtılanları hariç tut
  resourceOwnSchemaEntries(r: EnvironmentResource): { key: string; label: string; type: string }[] {
    const inherited = new Set([
      ...Object.keys(r.sharedConnectionFields ?? {}),
      ...(r.sharedCredentials ?? []).map(c => c.fieldKey)
    ]);
    return this.resourceSchemaEntries(r).filter(e => !inherited.has(e.key));
  }

  sharedConnEntries(r: EnvironmentResource): { key: string; label: string; value: string }[] {
    return Object.entries(r.sharedConnectionFields ?? {}).map(([key, value]) => ({
      key,
      label: (r.fieldSchema?.[key] as FieldSchemaDef | undefined)?.label ?? key,
      value: value == null ? '—' : String(value)
    }));
  }

  sharedCredLabel(r: EnvironmentResource, key: string): string {
    return (r.fieldSchema?.[key] as FieldSchemaDef | undefined)?.label ?? key;
  }

  credForKey(r: EnvironmentResource, key: string): boolean {
    return r.credentials.some(c => c.fieldKey === key);
  }

  credStubForKey(r: EnvironmentResource, key: string): CredentialStub | undefined {
    return r.credentials.find(c => c.fieldKey === key);
  }

  // --- Card-level credential reveal state ---
  cardRevealedValues = signal<Record<string, string>>({});
  cardVisiblePasswords = signal<Record<string, boolean>>({});
  cardRevealingIds = signal<Record<string, boolean>>({});

  private autoRevealNonPasswordCreds(detail: EnvironmentDetail) {
    this.cardRevealedValues.set({});
    this.cardVisiblePasswords.set({});
    this.cardRevealingIds.set({});
    for (const resource of detail.resources) {
      for (const cred of resource.credentials) {
        const def = resource.fieldSchema?.[cred.fieldKey] as FieldSchemaDef | undefined;
        if (def && def.type !== 'password') {
          this.http.get<{ value: string }>(`${environment.apiUrl}/credentials/${cred.id}/reveal`).subscribe({
            next: res => this.cardRevealedValues.update(v => ({ ...v, [cred.id]: res.value }))
          });
        }
      }
    }
  }

  toggleCardPassword(credId: string) {
    if (this.cardVisiblePasswords()[credId]) {
      this.cardVisiblePasswords.update(v => ({ ...v, [credId]: false }));
      return;
    }
    if (this.cardRevealedValues()[credId] !== undefined) {
      this.cardVisiblePasswords.update(v => ({ ...v, [credId]: true }));
      return;
    }
    this.cardRevealingIds.update(v => ({ ...v, [credId]: true }));
    this.http.get<{ value: string }>(`${environment.apiUrl}/credentials/${credId}/reveal`).subscribe({
      next: res => {
        this.cardRevealedValues.update(v => ({ ...v, [credId]: res.value }));
        this.cardVisiblePasswords.update(v => ({ ...v, [credId]: true }));
        this.cardRevealingIds.update(v => ({ ...v, [credId]: false }));
      },
      error: () => this.cardRevealingIds.update(v => ({ ...v, [credId]: false }))
    });
  }

  onSharedChange() {
    this.addResourceForm.sharedResourceId = '';
    this.addResourceForm.override = false;
    this.selectedSharedResource.set(null);
    this.sharedCredKeys.set([]);
    if (this.addResourceForm.isShared && !this.sharedResourcesLoaded) {
      this.http.get<SharedResourceOption[]>(`${environment.apiUrl}/resources/shared`).subscribe({
        next: r => { this.sharedResources.set(r); this.sharedResourcesLoaded = true; }
      });
    }
  }

  onSharedResourceSelect(id: string) {
    this.addResourceCreds = {};
    this.selectedSharedResource.set(null);
    this.sharedCredKeys.set([]);
    if (id) {
      this.loadSharedResourceDetail(id);
    }
  }

  sharedFieldKeys(): string[] {
    const sr = this.selectedSharedResource();
    return sr ? Object.keys(sr.connectionFields) : [];
  }

  // Paylaşılan kaynaktan kalıtılan tüm anahtarlar (connection + şifreli)
  private inheritedKeys(): Set<string> {
    return new Set([...this.sharedFieldKeys(), ...this.sharedCredKeys()]);
  }

  privateFieldKeys(tpl: AvailableTemplate): string[] {
    const inherited = this.inheritedKeys();
    return Object.keys(tpl.fieldSchema).filter(k => !inherited.has(k));
  }

  saveResource() {
    this.addResourceSubmitted.set(true);
    const f = this.addResourceForm;
    if (!f.templateId) return;
    if (f.isShared && !f.sharedResourceId) return;
    this.addResourceSaving.set(true);
    this.addResourceError.set('');
    const envId = this.env()!.id;
    this.http.post<{ id: string }>(`${environment.apiUrl}/environments/${envId}/resources`, {
      productResourceTemplateId: f.templateId,
      isShared: f.isShared,
      sharedResourceId: f.isShared ? f.sharedResourceId : null,
      connectionFields: {},
      notes: f.notes.trim() || null
    }).subscribe({
      next: (res) => {
        const credEntries = Object.entries(this.addResourceCreds).filter(([, v]) => v.trim());
        if (credEntries.length) {
          const requests = credEntries.map(([fieldKey, plainValue]) =>
            this.http.put(`${environment.apiUrl}/credentials`, {
              environmentResourceId: res.id,
              sharedResourceId: null,
              fieldKey,
              plainValue
            })
          );
          let remaining = requests.length;
          requests.forEach(req => req.subscribe({
            next: () => { if (--remaining === 0) this.finishAdd(res.id); },
            error: () => { if (--remaining === 0) this.finishAdd(res.id); }
          }));
        } else {
          this.finishAdd(res.id);
        }
      },
      error: err => {
        this.addResourceSaving.set(false);
        this.addResourceError.set(err.error?.detail ?? this.transloco.translate('environments.resourceAddError'));
      }
    });
  }

  removingResourceId = signal<string | null>(null);

  removeResource(r: EnvironmentResource) {
    if (!confirm(this.transloco.translate('environments.removeResourceConfirm', { name: r.templateName }))) return;
    this.removingResourceId.set(r.id);
    const envId = this.env()!.id;
    this.http.delete(`${environment.apiUrl}/environments/${envId}/resources/${r.id}`).subscribe({
      next: () => { this.removingResourceId.set(null); this.load(); },
      error: () => { this.removingResourceId.set(null); }
    });
  }

  private finishAdd(newResourceId: string) {
    this.addResourceSaving.set(false);
    this.closeAddResource();
    this.load((detail) => {
      const newResource = detail.resources.find(r => r.id === newResourceId);
      if (newResource && Object.keys(newResource.fieldSchema ?? {}).length) {
        this.openCredModal(newResource);
      }
    });
  }

  deletingEndpointId = signal<string | null>(null);

  deleteEndpoint(ep: EndpointUrl) {
    if (!confirm(this.transloco.translate('environments.deleteEndpointConfirm', { name: ep.endpointName }))) return;
    this.deletingEndpointId.set(ep.productEndpointId);
    const envId = this.env()!.id;
    this.http.delete(`${environment.apiUrl}/environments/${envId}/endpoints/${ep.productEndpointId}`).subscribe({
      next: () => { this.deletingEndpointId.set(null); this.load(); },
      error: () => { this.deletingEndpointId.set(null); }
    });
  }

  // Endpoint edit modal state
  showEpModal = signal(false);
  editingEp = signal<EndpointUrl | null>(null);
  epSaving = signal(false);
  epSubmitted = signal(false);
  epSaveError = signal('');
  epForm = { baseUrl: '', swaggerUrl: '', healthCheckUrl: '', authType: 'None' };

  openEndpointEdit(ep: EndpointUrl) {
    this.editingEp.set(ep);
    this.epForm = {
      baseUrl: ep.baseUrl ?? '',
      swaggerUrl: ep.swaggerUrl ?? '',
      healthCheckUrl: ep.healthCheckUrl ?? '',
      authType: ep.authTypeName ?? 'None'
    };
    this.epSubmitted.set(false);
    this.epSaveError.set('');
    this.showEpModal.set(true);
  }

  closeEpModal() { this.showEpModal.set(false); this.editingEp.set(null); }

  saveEndpointUrl() {
    this.epSubmitted.set(true);
    if (!this.epForm.baseUrl.trim()) return;
    this.epSaving.set(true);
    this.epSaveError.set('');
    const envId = this.env()!.id;
    const productEndpointId = this.editingEp()!.productEndpointId;
    this.http.put(`${environment.apiUrl}/environments/${envId}/endpoints/${productEndpointId}`, {
      baseUrl: this.epForm.baseUrl.trim(),
      swaggerUrl: this.epForm.swaggerUrl.trim() || null,
      healthCheckUrl: this.epForm.healthCheckUrl.trim() || null,
      authType: this.epForm.authType === 'None' ? null : this.epForm.authType,
      authConfig: {},
      notes: null
    }).subscribe({
      next: () => {
        this.epSaving.set(false);
        this.closeEpModal();
        this.load();
      },
      error: err => {
        this.epSaving.set(false);
        this.epSaveError.set(err.error?.detail ?? this.transloco.translate('environments.urlSaveError'));
      }
    });
  }

  authTypeLabel(name: string | null): string {
    const labels: Record<string, string> = {
      BasicAuth: 'Basic Auth', BearerToken: 'Bearer Token',
      ApiKey: 'API Key', OAuth2: 'OAuth2', None: this.transloco.translate('environments.authNoneLabel')
    };
    return name ? (labels[name] ?? name) : this.transloco.translate('environments.authNoneLabel');
  }

  // Personal credential modal state
  showPersonalCredModal = signal(false);
  personalCredResource = signal<EnvironmentResource | null>(null);
  personalCreds = signal<Record<string, PersonalCredentialStub[]>>({});
  personalCredsLoading = signal<Record<string, boolean>>({});
  personalCredsRevealed = signal<Record<string, string>>({});
  personalCredsRevealLoading = signal<Record<string, boolean>>({});
  personalCredEditingKey = signal<string | null>(null);
  personalCredSubmitted = signal(false);
  personalCredSaving = signal(false);
  personalCredError = signal('');
  personalCredShowValue = signal(false);
  personalCredForm = { fieldKey: '', customFieldKey: '', value: '' };
  deletingPersonalCredId = signal<Record<string, boolean>>({});

  togglePersonalCredValue() { this.personalCredShowValue.update(v => !v); }

  openPersonalCredModal(r: EnvironmentResource) {
    this.personalCredResource.set(r);
    this.personalCredEditingKey.set(null);
    this.personalCredSubmitted.set(false);
    this.personalCredError.set('');
    this.personalCredShowValue.set(false);
    this.personalCredForm = { fieldKey: '', customFieldKey: '', value: '' };
    this.showPersonalCredModal.set(true);
    if (!this.personalCreds()[r.id]) {
      this.loadPersonalCreds(r.id);
    }
  }

  closePersonalCredModal() {
    this.showPersonalCredModal.set(false);
    this.personalCredResource.set(null);
  }

  private loadPersonalCreds(resourceId: string) {
    this.personalCredsLoading.update(m => ({ ...m, [resourceId]: true }));
    this.http.get<PersonalCredentialStub[]>(
      `${environment.apiUrl}/personal-credentials?environmentResourceId=${resourceId}`
    ).subscribe({
      next: list => {
        this.personalCreds.update(m => ({ ...m, [resourceId]: list }));
        this.personalCredsLoading.update(m => ({ ...m, [resourceId]: false }));
      },
      error: () => this.personalCredsLoading.update(m => ({ ...m, [resourceId]: false }))
    });
  }

  personalCredSchemaKeys(): string[] {
    const r = this.personalCredResource();
    return r ? Object.keys(r.fieldSchema ?? {}) : [];
  }

  fieldLabelForResource(r: EnvironmentResource, fieldKey: string): string {
    const schema = r.fieldSchema;
    if (schema?.[fieldKey]?.label) return schema[fieldKey].label;
    const commonLabels: Record<string, string> = {
      username: this.transloco.translate('environments.fieldUsername'),
      password: this.transloco.translate('environments.fieldPassword'),
      token: this.transloco.translate('environments.fieldToken'),
      apiKey: this.transloco.translate('environments.fieldApiKey'),
      clientId: 'Client ID', clientSecret: 'Client Secret'
    };
    return commonLabels[fieldKey] ?? fieldKey;
  }

  startEditPersonalCred(c: PersonalCredentialStub) {
    this.personalCredEditingKey.set(c.fieldKey);
    this.personalCredForm = { fieldKey: c.fieldKey, customFieldKey: '', value: '' };
    this.personalCredSubmitted.set(false);
    this.personalCredError.set('');
    this.personalCredShowValue.set(false);
  }

  cancelEditPersonalCred() {
    this.personalCredEditingKey.set(null);
    this.personalCredForm = { fieldKey: '', customFieldKey: '', value: '' };
    this.personalCredSubmitted.set(false);
    this.personalCredError.set('');
  }

  revealPersonalCred(credId: string) {
    this.personalCredsRevealLoading.update(m => ({ ...m, [credId]: true }));
    this.http.get<{ value: string }>(`${environment.apiUrl}/personal-credentials/${credId}/reveal`).subscribe({
      next: r => {
        this.personalCredsRevealed.update(m => ({ ...m, [credId]: r.value }));
        this.personalCredsRevealLoading.update(m => ({ ...m, [credId]: false }));
        setTimeout(() => this.hidePersonalCredValue(credId), 30_000);
      },
      error: () => {
        this.personalCredsRevealLoading.update(m => ({ ...m, [credId]: false }));
        this.personalCredError.set(this.transloco.translate('environments.personalCredRevealError'));
      }
    });
  }

  hidePersonalCredValue(credId: string) {
    this.personalCredsRevealed.update(m => { const u = { ...m }; delete u[credId]; return u; });
  }

  savePersonalCred() {
    this.personalCredSubmitted.set(true);
    const resolvedKey = this.personalCredForm.fieldKey === '__custom__'
      ? this.personalCredForm.customFieldKey.trim()
      : this.personalCredForm.fieldKey.trim();
    if (!resolvedKey || !this.personalCredForm.value.trim()) return;

    this.personalCredSaving.set(true);
    this.personalCredError.set('');
    const resourceId = this.personalCredResource()!.id;

    this.http.put<{ id: string }>(`${environment.apiUrl}/personal-credentials`, {
      environmentResourceId: resourceId,
      sharedResourceId: null,
      fieldKey: resolvedKey,
      plainValue: this.personalCredForm.value.trim()
    }).subscribe({
      next: () => {
        this.personalCredSaving.set(false);
        this.cancelEditPersonalCred();
        this.loadPersonalCreds(resourceId);
      },
      error: err => {
        this.personalCredSaving.set(false);
        this.personalCredError.set(err.error?.detail ?? this.transloco.translate('environments.personalCredSaveError'));
      }
    });
  }

  deletePersonalCred(credId: string) {
    if (!confirm(this.transloco.translate('environments.personalCredDeleteConfirm'))) return;
    this.deletingPersonalCredId.update(m => ({ ...m, [credId]: true }));
    this.http.delete(`${environment.apiUrl}/personal-credentials/${credId}`).subscribe({
      next: () => {
        this.deletingPersonalCredId.update(m => ({ ...m, [credId]: false }));
        const resourceId = this.personalCredResource()?.id;
        if (resourceId) this.loadPersonalCreds(resourceId);
      },
      error: () => {
        this.deletingPersonalCredId.update(m => ({ ...m, [credId]: false }));
        this.personalCredError.set(this.transloco.translate('environments.personalCredDeleteError'));
      }
    });
  }

  // Credential modal state
  showCredModal = signal(false);
  credResource = signal<EnvironmentResource | null>(null);
  credEndpoint = signal<EndpointUrl | null>(null);
  revealedValues = signal<Record<string, string>>({});
  revealLoading = signal<Record<string, boolean>>({});
  credSaving = signal(false);
  credSubmitted = signal(false);
  credError = signal('');
  editingCredKey = '';
  showNewValue = false;
  credForm = { fieldKey: '', customFieldKey: '', value: '' };
  deletingCredId = signal<string | null>(null);

  activeCredentials(): CredentialStub[] {
    return this.credResource()?.credentials ?? this.credEndpoint()?.credentials ?? [];
  }

  ngOnInit() {
    this.load();
    this.loadHostingPlatforms();
  }

  private load(onDone?: (d: EnvironmentDetail) => void) {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<EnvironmentDetail>(`${environment.apiUrl}/environments/${id}`).subscribe({
      next: d => {
        this.env.set(d);
        this.loading.set(false);
        this.autoRevealNonPasswordCreds(d);
        this.loadSiblings(d.customerProductId);
        onDone?.(d);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadSiblings(customerProductId: string) {
    this.http.get<EnvironmentSummary[]>(
      `${environment.apiUrl}/environments/customer-products/${customerProductId}`
    ).subscribe({ next: list => this.siblings.set(list) });
  }

  navigateToSibling(siblingId: string) {
    this.router.navigate(['/environments', siblingId]).then(() => {
      this.loading.set(true);
      this.env.set(null);
      this.siblings.set([]);
      this.load();
    });
  }

  siblingColor(s: EnvironmentSummary, alpha: number): string {
    const c = s.environmentTypeColor ?? '#6B7280';
    return c + Math.round(alpha * 255).toString(16).padStart(2, '0');
  }

  totalCredentialCount(): number {
    return this.env()?.resources.reduce((sum, r) => sum + r.credentials.length, 0) ?? 0;
  }

  openCredModal(r: EnvironmentResource) {
    this.credResource.set(r);
    this.credEndpoint.set(null);
    this.revealedValues.set({});
    this.revealLoading.set({});
    this.credForm = { fieldKey: '', customFieldKey: '', value: '' };
    this.editingCredKey = '';
    this.credSubmitted.set(false);
    this.credError.set('');
    this.showCredModal.set(true);
  }

  openEpCredModal(ep: EndpointUrl) {
    this.credEndpoint.set(ep);
    this.credResource.set(null);
    this.revealedValues.set({});
    this.revealLoading.set({});
    this.credForm = { fieldKey: '', customFieldKey: '', value: '' };
    this.editingCredKey = '';
    this.credSubmitted.set(false);
    this.credError.set('');
    this.showCredModal.set(true);
  }

  schemaKeys(): string[] {
    const resource = this.credResource();
    if (resource) return Object.keys(resource.fieldSchema ?? {});
    const ep = this.credEndpoint();
    if (ep) {
      if (ep.authTypeName === 'BasicAuth') return ['username', 'password'];
      if (ep.authTypeName === 'BearerToken') return ['tokenUrl', 'username', 'password', 'clientId', 'clientSecret', 'token'];
      if (ep.authTypeName === 'ApiKey') return ['apiKey', 'apiKeyHeader'];
      if (ep.authTypeName === 'OAuth2') return ['tokenUrl', 'clientId', 'clientSecret', 'scope'];
    }
    return [];
  }

  fieldLabel(fieldKey: string): string {
    const schema = this.credResource()?.fieldSchema;
    if (schema?.[fieldKey]?.label) return schema[fieldKey].label;
    const commonLabels: Record<string, string> = {
      username: this.transloco.translate('environments.fieldUsername'),
      password: this.transloco.translate('environments.fieldPassword'),
      token: this.transloco.translate('environments.fieldToken'),
      tokenUrl: this.transloco.translate('environments.fieldTokenUrl'),
      apiKey: this.transloco.translate('environments.fieldApiKey'),
      apiKeyHeader: this.transloco.translate('environments.fieldApiKeyHeader'),
      clientId: 'Client ID',
      clientSecret: 'Client Secret',
      scope: this.transloco.translate('environments.fieldScope'),
    };
    return commonLabels[fieldKey] ?? fieldKey;
  }

  private readonly SECRET_FIELDS = new Set(['password', 'clientSecret', 'token', 'apiKey']);

  isSecretField(key: string): boolean {
    return this.SECRET_FIELDS.has(key);
  }

  activeFieldKey(): string {
    const k = this.credForm.fieldKey;
    return k === '__custom__' ? this.credForm.customFieldKey : k;
  }

  isValueHidden(): boolean {
    return this.isSecretField(this.activeFieldKey()) && !this.showNewValue;
  }

  undefinedSchemaFields(): string[] {
    const keys = this.schemaKeys();
    if (!keys.length) return [];
    const definedKeys = new Set(this.activeCredentials().map(c => c.fieldKey));
    return keys.filter(k => !definedKeys.has(k));
  }

  prefillField(fieldKey: string) {
    this.credForm = { fieldKey, customFieldKey: '', value: '' };
    this.credSubmitted.set(false);
    this.credError.set('');
    this.showNewValue = !this.isSecretField(fieldKey);
  }

  deleteCredential(credId: string) {
    if (!confirm(this.transloco.translate('environments.deleteCredConfirm'))) return;
    this.deletingCredId.set(credId);
    const resourceId = this.credResource()?.id ?? null;
    const endpointId = this.credEndpoint()?.id ?? null;
    this.http.delete(`${environment.apiUrl}/credentials/${credId}`).subscribe({
      next: () => {
        this.deletingCredId.set(null);
        this.load(d => {
          if (resourceId) {
            const updated = d.resources.find(r => r.id === resourceId);
            if (updated) this.credResource.set(updated);
          } else if (endpointId) {
            const updated = d.endpoints.find(e => e.id === endpointId);
            if (updated) this.credEndpoint.set(updated);
          }
        });
      },
      error: () => {
        this.deletingCredId.set(null);
        this.credError.set(this.transloco.translate('environments.credDeleteError'));
      }
    });
  }

  closeCredModal() {
    this.showCredModal.set(false);
    this.credResource.set(null);
    this.credEndpoint.set(null);
  }

  reveal(credId: string) {
    this.revealLoading.update(m => ({ ...m, [credId]: true }));
    this.http.get<{ value: string }>(`${environment.apiUrl}/credentials/${credId}/reveal`).subscribe({
      next: r => {
        this.revealedValues.update(m => ({ ...m, [credId]: r.value }));
        this.revealLoading.update(m => ({ ...m, [credId]: false }));
        // Auto-hide after 30 seconds
        setTimeout(() => this.hideValue(credId), 30_000);
      },
      error: () => {
        this.revealLoading.update(m => ({ ...m, [credId]: false }));
        this.credError.set(this.transloco.translate('environments.credRevealError'));
      }
    });
  }

  hideValue(credId: string) {
    this.revealedValues.update(m => {
      const updated = { ...m };
      delete updated[credId];
      return updated;
    });
  }

  startEdit(c: CredentialStub) {
    this.editingCredKey = c.fieldKey;
    this.credForm = { fieldKey: c.fieldKey, customFieldKey: '', value: '' };
    this.credSubmitted.set(false);
    this.credError.set('');
    this.showNewValue = !this.isSecretField(c.fieldKey);
  }

  cancelEdit() {
    this.editingCredKey = '';
    this.credForm = { fieldKey: '', customFieldKey: '', value: '' };
    this.credSubmitted.set(false);
  }

  saveCredential() {
    this.credSubmitted.set(true);
    const resolvedKey = this.credForm.fieldKey === '__custom__'
      ? this.credForm.customFieldKey.trim()
      : this.credForm.fieldKey.trim();
    if (!resolvedKey || !this.credForm.value.trim()) return;

    this.credSaving.set(true);
    this.credError.set('');

    const resourceId = this.credResource()?.id ?? null;
    const endpointId = this.credEndpoint()?.id ?? null;
    const body = {
      environmentResourceId: resourceId,
      endpointUrlId: endpointId,
      sharedResourceId: null,
      fieldKey: resolvedKey,
      plainValue: this.credForm.value.trim()
    };

    this.http.put(`${environment.apiUrl}/credentials`, body).subscribe({
      next: () => {
        this.credSaving.set(false);
        this.load(d => {
          if (resourceId) {
            const updated = d.resources.find(r => r.id === resourceId);
            if (updated) this.credResource.set(updated);
          } else if (endpointId) {
            const updated = d.endpoints.find(e => e.id === endpointId);
            if (updated) this.credEndpoint.set(updated);
          }
        });
        this.cancelEdit();
      },
      error: err => {
        this.credSaving.set(false);
        this.credError.set(err.error?.detail ?? this.transloco.translate('environments.credSaveError'));
      }
    });
  }

  envColor(alpha: number): string {
    return this.hexAlpha(this.env()?.environmentTypeColor ?? null, alpha);
  }

  hexAlpha(color: string | null, alpha: number): string {
    const c = color ?? '#6B7280';
    return c + Math.round(alpha * 255).toString(16).padStart(2, '0');
  }

  private loadHostingPlatforms(): void {
    if (this.hostingPlatforms().length) return;
    this.http.get<HostingPlatformOption[]>(`${environment.apiUrl}/environments/hosting-platforms`).subscribe({
      next: p => this.hostingPlatforms.set(p)
    });
  }

  togglePlatformMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showPlatformMenu.update(v => !v);
  }

  selectPlatform(platformId: string): void {
    this.showPlatformMenu.set(false);
    if ((this.env()?.hostingPlatformId ?? '') === platformId) return;
    const e = this.env();
    if (!e) return;
    this.platformSaving.set(true);
    this.http.put(`${environment.apiUrl}/environments/${e.id}/hosting-platform`, {
      hostingPlatformId: platformId || null
    }).subscribe({
      next: () => { this.platformSaving.set(false); this.load(); },
      error: () => this.platformSaving.set(false)
    });
  }

  epTypeIcon(type: string): string {
    const map: Record<string, string> = {
      Frontend: 'pi-desktop', RestAPI: 'pi-server', Grpc: 'pi-bolt',
      Soap: 'pi-code', GraphQL: 'pi-share-alt'
    };
    return map[type] ?? 'pi-box';
  }

  copy(text: string) {
    navigator.clipboard.writeText(text);
  }
}
