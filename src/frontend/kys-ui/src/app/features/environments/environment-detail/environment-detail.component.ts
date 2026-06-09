import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

interface CredentialStub {
  id: string;
  fieldKey: string;
  lastRotatedAt: string | null;
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
  isActive: boolean;
  notes: string | null;
  resources: EnvironmentResource[];
  endpoints: EndpointUrl[];
  availableTemplates: AvailableTemplate[];
}

@Component({
  selector: 'app-environment-detail',
  standalone: true,
  imports: [RouterLink, NgClass, FormsModule, DatePipe],
  template: `
    <div class="page-content">
      @if (loading()) {
        <div class="loading-state">Yükleniyor...</div>
      } @else if (!env()) {
        <div class="loading-state">Ortam bulunamadı. <a routerLink="/customers">← Müşterilere dön</a></div>
      } @else {
        <div class="breadcrumb">
          <a routerLink="/customers">Müşteriler</a>
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
                @if (!env()!.isActive) {
                  <span class="badge badge--inactive">Pasif</span>
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
                        <span class="env-pill-inactive">pasif</span>
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
              <span class="stat-lbl">Kaynak</span>
            </div>
            <div class="stat">
              <span class="stat-val">{{ env()!.endpoints.length }}</span>
              <span class="stat-lbl">Endpoint</span>
            </div>
            <div class="stat">
              <span class="stat-val">{{ totalCredentialCount() }}</span>
              <span class="stat-lbl">Credential</span>
            </div>
          </div>
        </div>

        <!-- Resources -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Kaynaklar</h2>
            @if (env()!.availableTemplates.length) {
              <button type="button" class="btn-add-resource" (click)="openAddResource()">
                <i class="pi pi-plus"></i> Kaynak Ekle
              </button>
            }
          </div>
          @if (!env()!.resources.length) {
            <div class="empty-card">
              <i class="pi pi-database"></i>
              <p>Henüz kaynak tanımlanmamış.</p>
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
                        <span class="badge badge--shared"><i class="pi pi-share-alt"></i> Paylaşımlı</span>
                        @if (r.sharedResourceName) {
                          <span class="shared-name">{{ r.sharedResourceName }}</span>
                        }
                      }
                      @if (!r.isActive) {
                        <span class="badge badge--inactive">Pasif</span>
                      }
                    </div>
                    <div class="resource-actions">
                      @if (r.credentials.length) {
                        <span class="cred-count">{{ r.credentials.length }} credential</span>
                      }
                      <button type="button" class="btn-cred" (click)="openCredModal(r)">
                        <i class="pi pi-key"></i> Credential Yönet
                      </button>
                      <button type="button" class="btn-remove-resource" title="Kaynağı Kaldır"
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
                  @let schemaEntries = resourceSchemaEntries(r);
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
            <h2 class="section-title">Endpoint URL'leri</h2>
          </div>
          @if (!env()!.endpoints.length) {
            <div class="empty-card">
              <i class="pi pi-link"></i>
              <p>Bu ürün için henüz endpoint tanımlanmamış. Endpoint tanımları ürün yönetiminden eklenir.</p>
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
                        <span class="badge badge--inactive">Pasif</span>
                      }
                      @if (ep.authTypeName && ep.authTypeName !== 'None') {
                        <span class="badge badge--auth">
                          <i class="pi pi-lock"></i> {{ authTypeLabel(ep.authTypeName) }}
                        </span>
                      }
                      @if (ep.credentials.length) {
                        <span class="ep-cred-count">{{ ep.credentials.length }} cred</span>
                      }
                    </div>
                    <div class="ep-actions">
                      @if (ep.id) {
                        <button type="button" class="btn-ep-auth" (click)="openEpCredModal(ep)" title="Auth Yönet">
                          <i class="pi pi-key"></i>
                        </button>
                      }
                      <button type="button" class="btn-ep-edit" (click)="openEndpointEdit(ep)" title="URL Düzenle">
                        <i class="pi pi-pencil"></i>
                      </button>
                      @if (ep.id) {
                        <button type="button" class="btn-ep-delete"
                          [disabled]="deletingEndpointId() === ep.productEndpointId"
                          (click)="deleteEndpoint(ep)" title="Bu ortamdaki URL kaydını kaldır">
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
                        <button type="button" class="copy-btn" (click)="copy(ep.baseUrl)" title="Kopyala">
                          <i class="pi pi-copy"></i>
                        </button>
                      </div>
                      @if (ep.swaggerUrl) {
                        <div class="url-row">
                          <span class="url-lbl">Swagger</span>
                          <a [href]="ep.swaggerUrl" target="_blank" class="url-link">
                            {{ ep.swaggerUrl }}<i class="pi pi-external-link"></i>
                          </a>
                          <button type="button" class="copy-btn" (click)="copy(ep.swaggerUrl!)" title="Kopyala">
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
                      <i class="pi pi-info-circle"></i> URL henüz girilmemiş
                      <button type="button" class="btn-set-url" (click)="openEndpointEdit(ep)">URL Belirle</button>
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
            <h2>Kaynak Ekle</h2>
            <button type="button" class="modal-close" (click)="closeAddResource()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (addResourceError()) {
              <div class="alert-error">{{ addResourceError() }}</div>
            }
            <div class="form-group">
              <label>Kaynak Şablonu <span class="required">*</span></label>
              <select [(ngModel)]="addResourceForm.templateId"
                (ngModelChange)="onTemplateChange($event)"
                [class.input-error]="addResourceSubmitted() && !addResourceForm.templateId">
                <option value="">Şablon seçin</option>
                @for (t of env()!.availableTemplates; track t.id) {
                  <option [value]="t.id">{{ t.name }} ({{ t.resourceTypeName }})</option>
                }
              </select>
              @if (addResourceSubmitted() && !addResourceForm.templateId) {
                <span class="error-msg">Şablon seçimi zorunludur</span>
              }
            </div>
            @if (selectedTemplate()?.canBeShared) {
              <div class="form-group">
                <label class="checkbox-label-inline">
                  <input type="checkbox" [(ngModel)]="addResourceForm.isShared" (ngModelChange)="onSharedChange()" />
                  Paylaşımlı kaynak kullan
                </label>
              </div>
              @if (addResourceForm.isShared) {
                <div class="form-group">
                  <label>Paylaşımlı Kaynak <span class="required">*</span></label>
                  <select [(ngModel)]="addResourceForm.sharedResourceId"
                    [class.input-error]="addResourceSubmitted() && addResourceForm.isShared && !addResourceForm.sharedResourceId">
                    <option value="">Seçin</option>
                    @for (sr of sharedResources(); track sr.id) {
                      <option [value]="sr.id">{{ sr.name }}</option>
                    }
                  </select>
                  @if (addResourceSubmitted() && addResourceForm.isShared && !addResourceForm.sharedResourceId) {
                    <span class="error-msg">Paylaşımlı kaynak seçimi zorunludur</span>
                  }
                </div>
              }
            }
            <div class="form-group">
              <label>Notlar</label>
              <input type="text" [(ngModel)]="addResourceForm.notes" placeholder="İsteğe bağlı..." />
            </div>

            <!-- Dinamik credential alanları -->
            @let tpl = selectedTemplate();
            @if (tpl && addResourceSchemaKeys(tpl).length) {
              <div class="cred-fields-section">
                <div class="cred-fields-title">
                  <i class="pi pi-key"></i>
                  Bağlantı Bilgileri
                  <span class="cred-fields-hint">(kaynak tipi: {{ tpl.resourceTypeName }})</span>
                </div>
                @for (key of addResourceSchemaKeys(tpl); track key) {
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
                        [placeholder]="def.required ? 'Zorunlu alan' : 'İsteğe bağlı'" />
                    } @else if (def.type === 'number') {
                      <input type="number"
                        [value]="addResourceCreds[key] ?? ''"
                        (input)="addResourceCreds[key] = $any($event.target).value"
                        [placeholder]="def['default'] != null ? ('Varsayılan: ' + def['default']) : ''" />
                    } @else {
                      <input type="text"
                        [value]="addResourceCreds[key] ?? ''"
                        (input)="addResourceCreds[key] = $any($event.target).value"
                        [placeholder]="def['default'] != null ? ('Varsayılan: ' + def['default']) : (def.required ? 'Zorunlu alan' : 'İsteğe bağlı')" />
                    }
                  </div>
                }
              </div>
            }
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeAddResource()">İptal</button>
            <button type="button" class="btn btn-primary" [disabled]="addResourceSaving()" (click)="saveResource()">
              @if (addResourceSaving()) { <i class="pi pi-spin pi-spinner"></i> Ekleniyor... } @else { Ekle }
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
              <h2>{{ editingEp()!.baseUrl ? 'Endpoint URL Düzenle' : 'Endpoint URL Belirle' }}</h2>
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
                <span class="error-msg">Base URL zorunludur</span>
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
              <label>Auth Tipi</label>
              <select [(ngModel)]="epForm.authType">
                <option value="None">Yok</option>
                <option value="BasicAuth">Basic Auth (kullanıcı adı + şifre)</option>
                <option value="BearerToken">Bearer Token</option>
                <option value="ApiKey">API Key</option>
                <option value="OAuth2">OAuth2 (client credentials)</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeEpModal()">İptal</button>
            <button type="button" class="btn btn-primary" [disabled]="epSaving()" (click)="saveEndpointUrl()">
              @if (epSaving()) { Kaydediliyor... } @else { Kaydet }
            </button>
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
              <h2>{{ credEndpoint() ? 'Auth Credential Yönetimi' : 'Credential Yönetimi' }}</h2>
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
              <div class="cred-section-title">Kayıtlı Credential'lar</div>
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
                        <button type="button" class="copy-btn" (click)="copy(val)" title="Kopyala"><i class="pi pi-copy"></i></button>
                        <button type="button" class="btn-hide" (click)="hideValue(c.id)"><i class="pi pi-eye-slash"></i> Gizle</button>
                      } @else {
                        <span class="cred-masked-lg">••••••••</span>
                        <button type="button" class="btn-reveal" [disabled]="revealLoading()[c.id]" (click)="reveal(c.id)">
                          @if (revealLoading()[c.id]) { <i class="pi pi-spin pi-spinner"></i> }
                          @else { <i class="pi pi-eye"></i> Göster }
                        </button>
                      }
                    </div>
                    <div class="cred-meta">
                      @if (c.lastRotatedAt) {
                        <span class="cred-rotated">{{ c.lastRotatedAt | date:'dd.MM.yyyy HH:mm' }}</span>
                      }
                      <button type="button" class="btn-edit-cred" (click)="startEdit(c)" title="Güncelle">
                        <i class="pi pi-pencil"></i>
                      </button>
                      <button type="button" class="btn-del-cred" (click)="deleteCredential(c.id)" title="Sil"
                        [disabled]="deletingCredId() === c.id">
                        @if (deletingCredId() === c.id) { <i class="pi pi-spin pi-spinner"></i> }
                        @else { <i class="pi pi-trash"></i> }
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="empty-creds">{{ credEndpoint() ? 'Bu endpoint için henüz auth credential tanımlanmamış.' : 'Bu kaynak için henüz credential tanımlanmamış.' }}</p>
            }

            <!-- FieldSchema'dan gelen tanımsız alanlar için hızlı ekleme -->
            @if (undefinedSchemaFields().length && !editingCredKey) {
              <div class="schema-hint">
                <i class="pi pi-info-circle"></i>
                Eksik alanlar:
                @for (fk of undefinedSchemaFields(); track fk) {
                  <button type="button" class="schema-field-chip" (click)="prefillField(fk)">
                    + {{ fieldLabel(fk) }}
                  </button>
                }
              </div>
            }

            <!-- Yeni / Güncelleme Formu -->
            <div class="cred-form-divider">
              <span>{{ editingCredKey ? (fieldLabel(editingCredKey) + ' güncelle') : 'Credential Ekle' }}</span>
              @if (editingCredKey) {
                <button type="button" class="btn-cancel-edit" (click)="cancelEdit()">İptal</button>
              }
            </div>
            <div class="cred-form">
              <div class="form-group">
                <label>Alan Adı <span class="required">*</span></label>
                @if (schemaKeys().length && !editingCredKey) {
                  <select [(ngModel)]="credForm.fieldKey"
                    [class.input-error]="credSubmitted() && !credForm.fieldKey.trim()">
                    <option value="">Alan seçin</option>
                    @for (fk of schemaKeys(); track fk) {
                      <option [value]="fk">{{ fieldLabel(fk) }} ({{ fk }})</option>
                    }
                    <option value="__custom__">Özel alan...</option>
                  </select>
                } @else {
                  <input type="text" [(ngModel)]="credForm.fieldKey"
                    placeholder="ör. password, connectionString, apiKey"
                    [disabled]="!!editingCredKey"
                    [class.input-error]="credSubmitted() && !credForm.fieldKey.trim()" />
                }
                @if (credSubmitted() && !credForm.fieldKey.trim()) {
                  <span class="error-msg">Alan adı zorunludur</span>
                }
                @if (credForm.fieldKey === '__custom__') {
                  <input type="text" [(ngModel)]="credForm.customFieldKey" placeholder="Alan adını girin"
                    style="margin-top:0.375rem" />
                }
              </div>
              <div class="form-group">
                <label>Değer <span class="required">*</span></label>
                <div class="password-input-wrap">
                  <input [type]="isValueHidden() ? 'password' : 'text'" [(ngModel)]="credForm.value"
                    placeholder="Değer giriniz"
                    [class.input-error]="credSubmitted() && !credForm.value.trim()" />
                  @if (isSecretField(activeFieldKey())) {
                    <button type="button" class="pw-toggle" (click)="showNewValue = !showNewValue">
                      <i class="pi" [class]="showNewValue ? 'pi-eye-slash' : 'pi-eye'"></i>
                    </button>
                  }
                </div>
                @if (credSubmitted() && !credForm.value.trim()) {
                  <span class="error-msg">Değer zorunludur</span>
                }
              </div>
              @if (credError()) {
                <div class="alert-error">{{ credError() }}</div>
              }
              <button type="button" class="btn-save-cred" [disabled]="credSaving()" (click)="saveCredential()">
                @if (credSaving()) { <i class="pi pi-spin pi-spinner"></i> Kaydediliyor... }
                @else { <i class="pi pi-check"></i> {{ editingCredKey ? 'Güncelle' : 'Ekle' }} }
              </button>
            </div>

          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-state { text-align: center; padding: 4rem; color: #9CA3AF; a { color: #3B82F6; text-decoration: none; } }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #6B7280; margin-bottom: 1.25rem; a { color: #3B82F6; text-decoration: none; &:hover { text-decoration: underline; } } }

    .header-card { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); flex-wrap: wrap; }
    .header-left { display: flex; align-items: center; gap: 1rem; flex: 1; }
    .env-icon { width: 3rem; height: 3rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; }
    .header-title-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; h1 { font-size: 1.25rem; font-weight: 700; color: #111827; } }
    .type-badge { display: inline-flex; align-items: center; padding: 0.2rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .header-notes { font-size: 0.875rem; color: #6B7280; margin-top: 0.25rem; }
    .env-switcher { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.625rem; }
    .env-pill { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.25rem 0.625rem; border: 1px solid #E5E7EB; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background: white; color: #6B7280; cursor: pointer; transition: all 0.15s; white-space: nowrap; &:hover:not(.env-pill--active) { background: #F3F4F6; border-color: #D1D5DB; color: #374151; } }
    .env-pill--active { font-weight: 600; cursor: default; }
    .env-pill-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; flex-shrink: 0; }
    .env-pill-inactive { font-size: 0.65rem; color: #9CA3AF; font-weight: 400; }
    .header-stats { display: flex; gap: 1.5rem; flex-shrink: 0; }
    .stat { text-align: center; }
    .stat-val { display: block; font-size: 1.5rem; font-weight: 700; color: #111827; }
    .stat-lbl { font-size: 0.75rem; color: #9CA3AF; }

    .section { margin-bottom: 1.5rem; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .section-title { font-size: 1rem; font-weight: 700; color: #374151; margin: 0; }
    .btn-add-resource { background: white; color: #374151; border: 1px solid #D1D5DB; border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-size: 0.8125rem; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 0.375rem; &:hover { border-color: #3B82F6; color: #2563EB; background: #EFF6FF; } }
    .checkbox-label-inline { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #374151; cursor: pointer; }
    .empty-card { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 2.5rem; text-align: center; color: #9CA3AF; i { font-size: 2rem; margin-bottom: 0.5rem; display: block; } p { font-size: 0.875rem; } }

    /* Resource cards */
    .resource-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .resource-card { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 1rem 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .inactive-card { opacity: 0.65; }
    .resource-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .resource-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .type-code { background: #F3F4F6; color: #6B7280; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.75rem; }
    .resource-name { font-weight: 600; color: #111827; font-size: 0.875rem; }
    .resource-type-label { font-size: 0.8125rem; color: #6B7280; }
    .shared-name { font-size: 0.75rem; color: #6B7280; }
    .resource-actions { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
    .cred-count { font-size: 0.75rem; color: #6B7280; background: #F3F4F6; padding: 0.125rem 0.5rem; border-radius: 9999px; }
    .btn-cred { background: white; color: #374151; border: 1px solid #D1D5DB; border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-size: 0.8125rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.375rem; &:hover { border-color: #F59E0B; color: #B45309; background: #FFFBEB; } }
    .btn-remove-resource { background: none; border: 1px solid #E5E7EB; border-radius: 0.375rem; padding: 0.25rem 0.5rem; font-size: 0.8125rem; cursor: pointer; color: #9CA3AF; display: inline-flex; align-items: center; &:hover { border-color: #FCA5A5; color: #EF4444; background: #FEF2F2; } &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .resource-notes { font-size: 0.8125rem; color: #6B7280; margin-top: 0.5rem; }
    /* Key:value credential grid in resource cards */
    .cred-kv-grid { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.625rem; }
    .cred-kv-item { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.25rem 0.5rem 0.25rem 0.625rem; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0.375rem; font-size: 0.75rem; }
    .cred-kv-item.cred-kv-missing { background: #FFFBEB; border-color: #FDE68A; }
    .cred-kv-label { color: #6B7280; font-weight: 500; }
    .cred-kv-value { color: #111827; font-family: monospace; font-weight: 600; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cred-kv-pw { letter-spacing: 0.05em; }
    .cred-kv-empty { color: #D97706; font-family: inherit; }
    .cred-kv-eye { background: none; border: none; cursor: pointer; color: #9CA3AF; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-size: 0.75rem; display: inline-flex; align-items: center; flex-shrink: 0; &:hover:not(:disabled) { color: #374151; background: #E5E7EB; } &:disabled { opacity: 0.5; cursor: default; } }

    /* Dynamic credential fields in add-resource modal */
    .cred-fields-section { background: #F8FAFF; border: 1px solid #DBEAFE; border-radius: 0.5rem; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .cred-fields-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; font-weight: 600; color: #1E40AF; i { color: #3B82F6; } }
    .cred-fields-hint { font-size: 0.75rem; color: #6B7280; font-weight: 400; }
    .field-key-badge { background: #EFF6FF; color: #1D4ED8; padding: 0.1rem 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.7rem; margin-left: 0.25rem; }

    /* Endpoint grid */
    .endpoint-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 0.75rem; }
    .endpoint-card { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .ep-no-url { border-style: dashed; background: #FAFAFA; }
    .ep-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .ep-icon { width: 2rem; height: 2rem; background: #EEF2FF; color: #4F46E5; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.875rem; }
    .ep-title { flex: 1; min-width: 0; }
    .ep-name { font-weight: 600; color: #111827; font-size: 0.875rem; }
    .ep-type { font-size: 0.75rem; color: #9CA3AF; }
    .ep-badges { display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
    .ep-actions { display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; }
    .ep-cred-count { font-size: 0.7rem; color: #6B7280; background: #F3F4F6; padding: 0.1rem 0.4rem; border-radius: 9999px; }
    .badge--auth { background: #FEF3C7; color: #92400E; }
    .btn-ep-auth { background: none; border: 1px solid #E5E7EB; border-radius: 0.375rem; padding: 0.25rem 0.5rem; cursor: pointer; color: #9CA3AF; font-size: 0.75rem; flex-shrink: 0; &:hover { border-color: #F59E0B; color: #B45309; background: #FFFBEB; } }
    .btn-ep-edit { background: none; border: 1px solid #E5E7EB; border-radius: 0.375rem; padding: 0.25rem 0.5rem; cursor: pointer; color: #9CA3AF; font-size: 0.75rem; flex-shrink: 0; &:hover { background: #F3F4F6; color: #374151; border-color: #D1D5DB; } }
    .btn-ep-delete { background: none; border: 1px solid #E5E7EB; border-radius: 0.375rem; padding: 0.25rem 0.5rem; cursor: pointer; color: #9CA3AF; font-size: 0.75rem; flex-shrink: 0; &:hover { border-color: #FCA5A5; color: #EF4444; background: #FEF2F2; } &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .ep-no-url-hint { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: #9CA3AF; padding: 0.5rem 0; i { font-size: 0.75rem; } }
    .btn-set-url { background: none; border: 1px solid #D1D5DB; border-radius: 0.375rem; padding: 0.2rem 0.625rem; font-size: 0.8125rem; cursor: pointer; color: #374151; margin-left: 0.25rem; &:hover { border-color: #3B82F6; color: #2563EB; background: #EFF6FF; } }
    .ep-urls { display: flex; flex-direction: column; gap: 0.5rem; }
    .url-row { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
    .url-lbl { font-size: 0.7rem; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; flex-shrink: 0; width: 3.5rem; }
    .url-link { flex: 1; font-size: 0.8125rem; color: #3B82F6; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 0.25rem; &:hover { text-decoration: underline; } i { font-size: 0.7rem; flex-shrink: 0; } }
    .copy-btn { background: none; border: 1px solid #E5E7EB; border-radius: 0.25rem; padding: 0.125rem 0.375rem; cursor: pointer; color: #9CA3AF; font-size: 0.75rem; flex-shrink: 0; &:hover { background: #F3F4F6; color: #374151; } }

    /* Badges */
    .badge { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }
    .badge--active { background: #D1FAE5; color: #065F46; }
    .badge--inactive { background: #FEF3C7; color: #92400E; }
    .badge--shared { background: #EDE9FE; color: #5B21B6; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: white; border-radius: 0.75rem; width: 100%; max-width: 560px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; }
    .modal--wide { max-width: 680px; }
    .modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.25rem 1.5rem; border-bottom: 1px solid #E5E7EB; flex-shrink: 0; h2 { font-size: 1.125rem; font-weight: 700; color: #111827; } }
    .modal-subtitle { font-size: 0.8125rem; color: #6B7280; margin-top: 0.125rem; }
    .modal-close { background: none; border: none; cursor: pointer; color: #6B7280; font-size: 1.25rem; padding: 0.25rem; border-radius: 0.375rem; flex-shrink: 0; &:hover { background: #F3F4F6; } }
    .modal-body { padding: 1.5rem; overflow-y: auto; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #E5E7EB; display: flex; justify-content: flex-end; gap: 0.75rem; flex-shrink: 0; }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1.25rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: #3B82F6 !important; color: #ffffff !important; &:not(:disabled):hover { background: #2563EB !important; } }
    .btn-secondary { background: white; color: #374151; border: 1px solid #D1D5DB; &:hover { background: #F3F4F6; } }

    /* Credential modal internals */
    .cred-section-title { font-size: 0.8125rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; }
    .cred-table { display: flex; flex-direction: column; gap: 0.5rem; }
    .cred-row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0.5rem; }
    .cred-key { font-size: 0.875rem; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 0.375rem; min-width: 140px; i { color: #D97706; } }
    .cred-value-cell { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0; }
    .cred-revealed { font-family: monospace; font-size: 0.875rem; color: #065F46; background: #D1FAE5; padding: 0.25rem 0.5rem; border-radius: 0.25rem; word-break: break-all; flex: 1; }
    .cred-masked-lg { font-family: monospace; color: #9CA3AF; letter-spacing: 0.1em; font-size: 1rem; }
    .btn-reveal { background: white; color: #374151; border: 1px solid #D1D5DB; border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-size: 0.8125rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.375rem; &:hover { border-color: #3B82F6; color: #2563EB; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-hide { background: none; border: none; cursor: pointer; color: #9CA3AF; font-size: 0.8125rem; display: inline-flex; align-items: center; gap: 0.25rem; &:hover { color: #374151; } }
    .cred-meta { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .cred-rotated { font-size: 0.75rem; color: #9CA3AF; }
    .btn-edit-cred { background: none; border: none; cursor: pointer; color: #6B7280; font-size: 0.8125rem; display: inline-flex; align-items: center; gap: 0.25rem; &:hover { color: #374151; } }
    .empty-creds { font-size: 0.875rem; color: #9CA3AF; text-align: center; padding: 1rem; background: #F9FAFB; border: 1px dashed #E5E7EB; border-radius: 0.5rem; }

    .cred-key-code { font-family: monospace; font-size: 0.7rem; background: #F3F4F6; color: #6B7280; padding: 0.1rem 0.3rem; border-radius: 0.2rem; }
    .btn-del-cred { background: none; border: none; cursor: pointer; color: #EF4444; font-size: 0.8125rem; padding: 0.2rem; border-radius: 0.25rem; display: inline-flex; align-items: center; &:hover { background: #FEF2F2; } &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .schema-hint { display: flex; align-items: center; flex-wrap: wrap; gap: 0.375rem; padding: 0.625rem; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 0.5rem; font-size: 0.8125rem; color: #1D4ED8; i { flex-shrink: 0; } }
    .schema-field-chip { background: white; color: #1D4ED8; border: 1px solid #BFDBFE; border-radius: 9999px; padding: 0.15rem 0.6rem; font-size: 0.75rem; cursor: pointer; &:hover { background: #DBEAFE; } }
    .cred-form-divider { display: flex; align-items: center; justify-content: space-between; font-size: 0.8125rem; font-weight: 600; color: #374151; border-top: 1px solid #E5E7EB; padding-top: 0.75rem; }
    .btn-cancel-edit { background: none; border: none; cursor: pointer; color: #9CA3AF; font-size: 0.8125rem; &:hover { color: #374151; } }
    .cred-form { display: flex; flex-direction: column; gap: 0.875rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.8125rem; font-weight: 600; color: #374151; } input, select { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; font-size: 0.875rem; color: #111827; background: white; &:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); } &:disabled { background: #F9FAFB; color: #9CA3AF; } } }
    .password-input-wrap { position: relative; input { width: 100%; padding-right: 2.5rem; box-sizing: border-box; } }
    .pw-toggle { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #9CA3AF; padding: 0.25rem; &:hover { color: #374151; } }
    .input-error { border-color: #EF4444 !important; }
    .error-msg { font-size: 0.75rem; color: #EF4444; }
    .required { color: #EF4444; }
    .alert-error { padding: 0.75rem; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 0.375rem; color: #991B1B; font-size: 0.8125rem; }
    .btn-save-cred { background: #F59E0B; color: white; border: none; border-radius: 0.5rem; padding: 0.5rem 1.25rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 0.375rem; align-self: flex-start; &:hover { background: #D97706; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
  `]
})
export class EnvironmentDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  env = signal<EnvironmentDetail | null>(null);
  loading = signal(true);
  siblings = signal<EnvironmentSummary[]>([]);

  // Add resource modal state
  showAddResourceModal = signal(false);
  addResourceSaving = signal(false);
  addResourceSubmitted = signal(false);
  addResourceError = signal('');
  addResourceForm = { templateId: '', isShared: false, sharedResourceId: '', notes: '' };
  addResourceCreds: Record<string, string> = {};
  selectedTemplate = signal<AvailableTemplate | null>(null);
  sharedResources = signal<{ id: string; name: string }[]>([]);
  private sharedResourcesLoaded = false;

  openAddResource() {
    this.addResourceForm = { templateId: '', isShared: false, sharedResourceId: '', notes: '' };
    this.addResourceCreds = {};
    this.selectedTemplate.set(null);
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
    this.addResourceCreds = {};
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
    if (this.addResourceForm.isShared && !this.sharedResourcesLoaded) {
      this.http.get<{ id: string; name: string }[]>(`${environment.apiUrl}/resources/shared`).subscribe({
        next: r => { this.sharedResources.set(r); this.sharedResourcesLoaded = true; }
      });
    }
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
        this.addResourceError.set(err.error?.detail ?? 'Kaynak eklenemedi.');
      }
    });
  }

  removingResourceId = signal<string | null>(null);

  removeResource(r: EnvironmentResource) {
    if (!confirm(`"${r.templateName}" kaynağını ortamdan kaldırmak istediğinizden emin misiniz?`)) return;
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
    if (!confirm(`"${ep.endpointName}" için bu ortamdaki URL kaydını kaldırmak istediğinizden emin misiniz?\n\nEndpoint tanımı ürün üzerinde kalır; sadece bu ortamın URL bilgisi silinir.`)) return;
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
        this.epSaveError.set(err.error?.detail ?? 'URL kaydedilemedi.');
      }
    });
  }

  authTypeLabel(name: string | null): string {
    const labels: Record<string, string> = {
      BasicAuth: 'Basic Auth', BearerToken: 'Bearer Token',
      ApiKey: 'API Key', OAuth2: 'OAuth2', None: 'Auth Yok'
    };
    return name ? (labels[name] ?? name) : 'Auth Yok';
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
      username: 'Kullanıcı Adı',
      password: 'Şifre',
      token: 'Token (statik)',
      tokenUrl: 'Token URL',
      apiKey: 'API Anahtarı',
      apiKeyHeader: 'API Key Header Adı',
      clientId: 'Client ID',
      clientSecret: 'Client Secret',
      scope: 'Scope',
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
    if (!confirm('Bu credential silinecek. Emin misiniz?')) return;
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
        this.credError.set('Credential silinemedi.');
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
        this.credError.set('Credential gösterilemedi. Yetkiniz olmayabilir.');
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
        this.credError.set(err.error?.detail ?? 'Credential kaydedilemedi.');
      }
    });
  }

  envColor(alpha: number): string {
    const c = this.env()?.environmentTypeColor ?? '#6B7280';
    return c + Math.round(alpha * 255).toString(16).padStart(2, '0');
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
