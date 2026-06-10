import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { CustomFieldInputsComponent, CustomFieldDef } from '../../../shared/components/custom-field-inputs/custom-field-inputs.component';

const PRODUCT_TYPE: Record<number, string> = { 0: 'SaaS', 1: 'Müşteriye Özel', 2: 'Hibrit' };
const PRODUCT_TYPE_CSS: Record<number, string> = { 0: 'badge--saas', 1: 'badge--custom', 2: 'badge--hybrid' };
const STATUS_LABEL: Record<string, string> = { Active: 'Aktif', Deprecated: 'Kullanımdan Kalkıyor', Discontinued: 'Kapatıldı' };
const STATUS_CSS: Record<string, string> = { Active: 'badge--active', Deprecated: 'badge--deprecated', Discontinued: 'badge--archived' };
const ENDPOINT_TYPE: Record<number, string> = { 0: 'Frontend', 1: 'REST API', 2: 'gRPC', 3: 'SOAP', 4: 'GraphQL' };
const ENDPOINT_ICON: Record<number, string> = { 0: 'pi-desktop', 1: 'pi-server', 2: 'pi-server', 3: 'pi-server', 4: 'pi-code' };

interface ProductDetail {
  id: string;
  name: string;
  code: string;
  description: string | null;
  version: string | null;
  productType: number;
  status: string;
  poPersonId: string | null;
  poName: string | null;
  techStack: string[];
  repositoryUrl: string | null;
  documentationUrl: string | null;
  teams: { teamId: string; teamName: string; role: string | null; since: string | null }[];
  assignments: { personId: string; fullName: string; responsibility: string | null; startedAt: string | null; isActive: boolean }[];
  endpoints: { id: string; name: string; endpointType: number; defaultBaseUrl: string | null; swaggerUrl: string | null; sortOrder: number }[];
  resourceTemplates: { id: string; name: string; description?: string; resourceTypeId: string; resourceTypeName: string; isRequired: boolean; canBeShared: boolean; sortOrder: number }[];
  customFields: Record<string, unknown>;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, NgClass, DatePipe, FormsModule, CustomFieldInputsComponent],
  template: `
    <div class="page-content">
      @if (loading()) {
        <div class="loading-state">Yükleniyor...</div>
      } @else if (!product()) {
        <div class="loading-state">Ürün bulunamadı. <a routerLink="/products">← Geri dön</a></div>
      } @else {
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <a routerLink="/products">Ürünler</a>
          <span>/</span>
          <span>{{ product()!.name }}</span>
        </div>

        <!-- Header -->
        <div class="header-card">
          <div class="header-main">
            <div class="product-icon"><i class="pi pi-box"></i></div>
            <div>
              <div class="header-top">
                <h1>{{ product()!.name }}</h1>
                <code class="code-badge">{{ product()!.code }}</code>
              </div>
              <p class="header-desc">{{ product()!.description ?? 'Açıklama eklenmemiş' }}</p>
              @if (product()!.version) {
                <span class="version-tag">v{{ product()!.version }}</span>
              }
            </div>
          </div>
          <div class="header-right">
            <span class="badge" [ngClass]="typeCss(product()!.productType)">{{ typeLabel(product()!.productType) }}</span>
            <span class="badge" [ngClass]="statusCss(product()!.status)">{{ statusLabel(product()!.status) }}</span>
            <button type="button" class="btn-edit" (click)="openEdit()">
              <i class="pi pi-pencil"></i> Düzenle
            </button>
          </div>
        </div>

        <!-- Quick stats bar -->
        <div class="stats-bar">
          <div class="stat">
            <span class="stat-val">{{ product()!.poName ?? '—' }}</span>
            <span class="stat-lbl">Ürün Sahibi</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat">
            <span class="stat-val">{{ activeAssignments() }}</span>
            <span class="stat-lbl">Aktif Çalışan</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat">
            <span class="stat-val">{{ product()!.teams.length }}</span>
            <span class="stat-lbl">Ekip</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat">
            <span class="stat-val">{{ product()!.endpoints.length }}</span>
            <span class="stat-lbl">Endpoint</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          @for (tab of tabs; track tab.key) {
            <button class="tab-btn" [class.active]="activeTab() === tab.key" (click)="activeTab.set(tab.key)">
              {{ tab.label }}
            </button>
          }
        </div>

        <!-- Tab: Genel Bilgiler -->
        @if (activeTab() === 'info') {
          <div class="tab-content">
            <div class="info-grid">
              <div class="info-item">
                <label>Ürün Tipi</label>
                <span><span class="badge" [ngClass]="typeCss(product()!.productType)">{{ typeLabel(product()!.productType) }}</span></span>
              </div>
              <div class="info-item">
                <label>Durum</label>
                <span><span class="badge" [ngClass]="statusCss(product()!.status)">{{ statusLabel(product()!.status) }}</span></span>
              </div>
              <div class="info-item">
                <label>Sürüm</label>
                <span>{{ product()!.version ?? '—' }}</span>
              </div>
              <div class="info-item">
                <label>Ürün Sahibi</label>
                @if (product()!.poPersonId) {
                  <a [routerLink]="['/people', product()!.poPersonId]" class="link">{{ product()!.poName }}</a>
                } @else {
                  <span>—</span>
                }
              </div>
              <div class="info-item">
                <label>Kaynak Kod</label>
                @if (product()!.repositoryUrl) {
                  <a [href]="product()!.repositoryUrl" target="_blank" class="link ext-link">
                    <i class="pi pi-external-link"></i> Repo
                  </a>
                } @else {
                  <span>—</span>
                }
              </div>
              <div class="info-item">
                <label>Dokümantasyon</label>
                @if (product()!.documentationUrl) {
                  <a [href]="product()!.documentationUrl" target="_blank" class="link ext-link">
                    <i class="pi pi-external-link"></i> Döküman
                  </a>
                } @else {
                  <span>—</span>
                }
              </div>
            </div>
            @if (product()!.techStack.length) {
              <div class="tech-stack-section">
                <label>Teknoloji Stack'i</label>
                <div class="tech-tags">
                  @for (tech of product()!.techStack; track tech) {
                    <span class="tech-tag">{{ tech }}</span>
                  }
                </div>
              </div>
            }
            <app-custom-field-inputs
              [defs]="customFieldDefs()"
              [values]="product()!.customFields ?? {}"
              mode="view" />
          </div>
        }

        <!-- Tab: Endpoint'ler -->
        @if (activeTab() === 'endpoints') {
          <div class="tab-content">
            <div class="tab-actions-row">
              <span class="tab-section-count">{{ product()!.endpoints.length }} endpoint</span>
              <button type="button" class="btn btn-primary btn-sm" (click)="openAddEndpoint()">
                <i class="pi pi-plus"></i> Yeni Endpoint
              </button>
            </div>
            @if (!product()!.endpoints.length) {
              <p class="empty-text">Endpoint tanımlanmamış.</p>
            } @else {
              <div class="endpoint-list">
                @for (ep of sortedEndpoints(); track ep.id) {
                  <div class="endpoint-card">
                    <div class="ep-header">
                      <div class="ep-icon">
                        <i class="pi" [ngClass]="endpointIcon(ep.endpointType)"></i>
                      </div>
                      <div class="ep-info">
                        <span class="ep-name">{{ ep.name }}</span>
                        <span class="badge badge--ep">{{ endpointTypeLabel(ep.endpointType) }}</span>
                      </div>
                      <button type="button" class="ep-delete-btn" (click)="deleteEndpoint(ep.id)" title="Sil">
                        <i class="pi pi-trash"></i>
                      </button>
                    </div>
                    @if (ep.defaultBaseUrl) {
                      <div class="ep-url">
                        <i class="pi pi-link"></i>
                        <code>{{ ep.defaultBaseUrl }}</code>
                        <button type="button" class="copy-btn" (click)="copy(ep.defaultBaseUrl!)" title="Kopyala">
                          <i class="pi pi-copy"></i>
                        </button>
                      </div>
                    }
                    @if (ep.swaggerUrl) {
                      <div class="ep-url ep-swagger">
                        <i class="pi pi-file-o"></i>
                        <a [href]="ep.swaggerUrl" target="_blank">Swagger / OpenAPI</a>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Tab: Ekipler -->
        @if (activeTab() === 'teams') {
          <div class="tab-content">
            <div class="tab-actions-row">
              <span class="tab-section-count">{{ product()!.teams.length }} ekip</span>
              <button type="button" class="btn btn-primary btn-sm" (click)="openAssignTeam()">
                <i class="pi pi-users"></i> Ekip Ata
              </button>
            </div>
            @if (!product()!.teams.length) {
              <p class="empty-text">Ekip atanmamış.</p>
            } @else {
              <div class="team-list">
                @for (t of product()!.teams; track t.teamId) {
                  <div class="team-card">
                    <div class="team-avatar">{{ t.teamName[0] }}</div>
                    <div class="team-card-info">
                      <a [routerLink]="['/teams', t.teamId]" class="link">{{ t.teamName }}</a>
                      <p class="muted-sm">{{ t.role ?? 'Rol belirtilmemiş' }} @if (t.since) { · {{ t.since | date:'dd.MM.yyyy' }}'den beri }</p>
                    </div>
                    <button type="button" class="btn-icon-danger" title="Ekibi kaldır"
                      [disabled]="removingTeamId() === t.teamId" (click)="removeTeam(t.teamId, t.teamName)">
                      @if (removingTeamId() === t.teamId) { <i class="pi pi-spin pi-spinner"></i> }
                      @else { <i class="pi pi-trash"></i> }
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Tab: Çalışanlar -->
        @if (activeTab() === 'assignments') {
          <div class="tab-content">
            <div class="tab-actions-row">
              <span class="tab-section-count">{{ activeAssignments() }} aktif / {{ product()!.assignments.length }} toplam</span>
              <button type="button" class="btn btn-primary btn-sm" (click)="openAssignPerson()">
                <i class="pi pi-user-plus"></i> Kişi Ata
              </button>
            </div>
            @if (!product()!.assignments.length) {
              <p class="empty-text">Atama yapılmamış.</p>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Kişi</th>
                    <th>Sorumluluk</th>
                    <th>Başlangıç</th>
                    <th>Durum</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (a of product()!.assignments; track a.personId) {
                    <tr [class.inactive-row]="!a.isActive">
                      <td>
                        <a [routerLink]="['/people', a.personId]" class="link">{{ a.fullName }}</a>
                      </td>
                      <td class="muted">{{ a.responsibility ?? '—' }}</td>
                      <td class="muted">{{ a.startedAt ? (a.startedAt | date:'dd.MM.yyyy') : '—' }}</td>
                      <td>
                        <span class="badge" [class]="a.isActive ? 'badge--active' : 'badge--archived'">
                          {{ a.isActive ? 'Aktif' : 'Pasif' }}
                        </span>
                      </td>
                      <td class="actions-cell">
                        <button type="button" class="btn-icon-danger" title="Atamayı kaldır"
                          [disabled]="removingPersonId() === a.personId" (click)="removePerson(a.personId, a.fullName)">
                          @if (removingPersonId() === a.personId) { <i class="pi pi-spin pi-spinner"></i> }
                          @else { <i class="pi pi-trash"></i> }
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        }
        <!-- Tab: Kaynak Şablonları -->
        @if (activeTab() === 'resources') {
          <div class="tab-content">
            <div class="tab-actions-row">
              <span class="tab-section-count">{{ product()!.resourceTemplates.length }} şablon</span>
              <button type="button" class="btn btn-primary btn-sm" (click)="openAddTemplate()">
                <i class="pi pi-plus"></i> Şablon Ekle
              </button>
            </div>
            @if (!product()!.resourceTemplates.length) {
              <p class="empty-text">Henüz kaynak şablonu tanımlanmamış.</p>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Kaynak Tipi</th>
                    <th>Şablon Adı</th>
                    <th>Zorunlu</th>
                    <th>Paylaşılabilir</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of product()!.resourceTemplates; track t.id) {
                    <tr>
                      <td>
                        <span class="type-code">{{ t.resourceTypeName }}</span>
                      </td>
                      <td class="font-medium">{{ t.name }}</td>
                      <td>
                        @if (t.isRequired) {
                          <span class="badge badge--active">Evet</span>
                        } @else {
                          <span class="muted">Hayır</span>
                        }
                      </td>
                      <td>
                        @if (t.canBeShared) {
                          <span class="badge badge--shared">Paylaşılabilir</span>
                        } @else {
                          <span class="muted">Hayır</span>
                        }
                      </td>
                      <td style="text-align:right;width:80px">
                        <button type="button" class="btn-icon" title="Düzenle"
                          (click)="openEditTemplate(t)">
                          <i class="pi pi-pencil"></i>
                        </button>
                        <button type="button" class="btn-icon-danger" title="Sil"
                          [disabled]="deletingTemplateId() === t.id"
                          (click)="deleteTemplate(t.id, t.name)">
                          @if (deletingTemplateId() === t.id) { <i class="pi pi-spin pi-spinner"></i> }
                          @else { <i class="pi pi-trash"></i> }
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        }
      }
    </div>

    <!-- Add / Edit Resource Template Modal -->
    @if (showTemplateModal()) {
      <div class="modal-backdrop" (click)="showTemplateModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingTemplateId() ? 'Kaynak Şablonu Düzenle' : 'Kaynak Şablonu Ekle' }}</h2>
            <button type="button" class="close-btn" (click)="showTemplateModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (templateError()) { <div class="alert-error">{{ templateError() }}</div> }
            @if (!editingTemplateId()) {
              <!-- Mod seçimi -->
              <div class="template-mode-toggle">
                <button type="button"
                  class="mode-btn" [class.mode-btn--active]="!templateFromShared()"
                  (click)="onTemplateFromSharedToggle(false)">
                  <i class="pi pi-file"></i> Sıfırdan Oluştur
                </button>
                <button type="button"
                  class="mode-btn" [class.mode-btn--active]="templateFromShared()"
                  (click)="onTemplateFromSharedToggle(true)">
                  <i class="pi pi-share-alt"></i> Paylaşımlı Kaynaktan
                </button>
              </div>

              @if (templateFromShared()) {
                <!-- Paylaşımlı kaynaktan seç -->
                <div class="form-group">
                  <label>Paylaşımlı Kaynak <span class="req">*</span></label>
                  @if (!sharedResourcesForTemplate().length) {
                    <p class="hint-text">Henüz paylaşımlı kaynak tanımlanmamış.
                      <a routerLink="/resources/shared">Paylaşımlı Kaynaklar</a> sayfasından ekleyin.
                    </p>
                  } @else {
                    <select
                      [value]="selectedSharedForTemplate()?.id ?? ''"
                      (change)="onSharedResourceForTemplateSelect($any($event.target).value)"
                      [class.input-error]="templateSubmitted() && !selectedSharedForTemplate()">
                      <option value="">Seçin</option>
                      @for (sr of sharedResourcesForTemplate(); track sr.id) {
                        <option [value]="sr.id">{{ sr.name }} ({{ sr.resourceTypeName }})</option>
                      }
                    </select>
                    @if (templateSubmitted() && !selectedSharedForTemplate()) {
                      <span class="field-error">Paylaşımlı kaynak seçimi zorunludur</span>
                    }
                  }
                </div>
                @if (selectedSharedForTemplate(); as sr) {
                  <div class="form-group">
                    <label>Kaynak Tipi</label>
                    <input type="text" [value]="sr.resourceTypeName" readonly class="input-readonly" />
                  </div>
                }
              } @else {
                <!-- Manuel kaynak tipi seçimi -->
                <div class="form-group">
                  <label>Kaynak Tipi <span class="req">*</span></label>
                  <select [(ngModel)]="templateForm.resourceTypeId" [class.input-error]="templateSubmitted() && !templateForm.resourceTypeId">
                    <option value="">Tip seçin</option>
                    @for (rt of resourceTypes(); track rt.id) {
                      <option [value]="rt.id">{{ rt.name }}</option>
                    }
                  </select>
                  @if (templateSubmitted() && !templateForm.resourceTypeId) {
                    <span class="field-error">Kaynak tipi zorunludur</span>
                  }
                </div>
              }
            }
            <div class="form-group">
              <label>Şablon Adı <span class="req">*</span></label>
              <input type="text" [(ngModel)]="templateForm.name" placeholder="ör. Ana Veritabanı"
                [class.input-error]="templateSubmitted() && !templateForm.name.trim()" />
              @if (templateSubmitted() && !templateForm.name.trim()) {
                <span class="field-error">Ad zorunludur</span>
              }
            </div>
            <div class="form-group">
              <label>Açıklama</label>
              <input type="text" [(ngModel)]="templateForm.description" placeholder="İsteğe bağlı..." />
            </div>
            <div class="form-row">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="templateForm.isRequired" />
                Zorunlu kaynak
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="templateForm.canBeShared" />
                Paylaşılabilir
              </label>
            </div>
            <div class="form-group">
              <label>Sıralama</label>
              <input type="number" [(ngModel)]="templateForm.sortOrder" min="0" style="width:6rem" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showTemplateModal.set(false)">İptal</button>
            <button type="button" class="btn btn-primary" [disabled]="templateSaving()"
              (click)="editingTemplateId() ? updateTemplate() : saveTemplate()">
              {{ templateSaving() ? 'Kaydediliyor...' : (editingTemplateId() ? 'Güncelle' : 'Ekle') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Add Endpoint Modal -->
    @if (showEndpointModal()) {
      <div class="modal-backdrop" (click)="showEndpointModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Yeni Endpoint</h2>
            <button type="button" class="close-btn" (click)="showEndpointModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (epError()) { <div class="alert-error">{{ epError() }}</div> }
            <div class="form-row">
              <div class="form-group">
                <label>Ad <span class="req">*</span></label>
                <input type="text" [(ngModel)]="epForm.name" [class.input-error]="epSubmitted() && !epForm.name.trim()" placeholder="ör. Web Arayüzü" />
                @if (epSubmitted() && !epForm.name.trim()) { <span class="field-error">Zorunlu alan</span> }
              </div>
              <div class="form-group">
                <label>Tip <span class="req">*</span></label>
                <select [(ngModel)]="epForm.endpointType">
                  <option value="0">Frontend</option>
                  <option value="1">REST API</option>
                  <option value="2">gRPC</option>
                  <option value="3">SOAP</option>
                  <option value="4">GraphQL</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Varsayılan Base URL</label>
              <input type="url" [(ngModel)]="epForm.defaultBaseUrl" placeholder="https://..." />
            </div>
            <div class="form-group">
              <label>Swagger / OpenAPI URL</label>
              <input type="url" [(ngModel)]="epForm.swaggerUrl" placeholder="https://.../swagger" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showEndpointModal.set(false)">İptal</button>
            <button type="button" class="btn btn-primary" [disabled]="epSaving()" (click)="saveEndpoint()">
              {{ epSaving() ? 'Kaydediliyor...' : 'Ekle' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Assign Team Modal -->
    @if (showTeamModal()) {
      <div class="modal-backdrop" (click)="showTeamModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Ekip Ata</h2>
            <button type="button" class="close-btn" (click)="showTeamModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (teamAssignError()) { <div class="alert-error">{{ teamAssignError() }}</div> }
            <div class="form-group">
              <label>Ekip <span class="req">*</span></label>
              <select [(ngModel)]="teamForm.teamId" [class.input-error]="teamSubmitted() && !teamForm.teamId">
                <option value="">Ekip seçin...</option>
                @for (t of availableTeams(); track t.id) {
                  <option [value]="t.id">{{ t.name }}</option>
                }
              </select>
              @if (teamSubmitted() && !teamForm.teamId) { <span class="field-error">Ekip seçimi zorunludur</span> }
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Rol</label>
                <input type="text" [(ngModel)]="teamForm.role" placeholder="ör. Geliştirici Ekibi" />
              </div>
              <div class="form-group">
                <label>Atama Tarihi</label>
                <input type="date" [(ngModel)]="teamForm.since" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showTeamModal.set(false)">İptal</button>
            <button type="button" class="btn btn-primary" [disabled]="teamSaving()" (click)="saveTeamAssign()">
              {{ teamSaving() ? 'Kaydediliyor...' : 'Ata' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Assign Person Modal -->
    @if (showPersonModal()) {
      <div class="modal-backdrop" (click)="showPersonModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Kişi Ata</h2>
            <button type="button" class="close-btn" (click)="showPersonModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (personAssignError()) { <div class="alert-error">{{ personAssignError() }}</div> }
            <div class="form-group">
              <label>Kişi <span class="req">*</span></label>
              <input type="text" placeholder="İsim veya e-posta ara..."
                [(ngModel)]="personSearch" (ngModelChange)="searchPersons($event)" />
              @if (personOptions().length > 0) {
                <div class="dropdown">
                  @for (p of personOptions(); track p.id) {
                    <div class="dropdown-item" (click)="selectPerson(p)">
                      <span class="di-name">{{ p.name }}</span>
                      <span class="di-email">{{ p.email }}</span>
                    </div>
                  }
                </div>
              }
              @if (personForm.personId) {
                <div class="selected-hint"><i class="pi pi-check-circle"></i> {{ selectedPersonName() }}</div>
              }
              @if (personSubmitted() && !personForm.personId) { <span class="field-error">Kişi seçimi zorunludur</span> }
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Sorumluluk</label>
                <input type="text" [(ngModel)]="personForm.responsibility" placeholder="ör. Backend Geliştirme" />
              </div>
              <div class="form-group">
                <label>Başlangıç Tarihi</label>
                <input type="date" [(ngModel)]="personForm.startedAt" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showPersonModal.set(false)">İptal</button>
            <button type="button" class="btn btn-primary" [disabled]="personSaving()" (click)="savePersonAssign()">
              {{ personSaving() ? 'Kaydediliyor...' : 'Ata' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Edit Product Modal -->
    @if (showEditModal()) {
      <div class="modal-backdrop" (click)="showEditModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Ürünü Düzenle</h2>
            <button type="button" class="close-btn" (click)="showEditModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (editError()) {
              <div class="alert-error">{{ editError() }}</div>
            }
            <div class="form-row">
              <div class="form-group">
                <label>Ürün Adı <span class="req">*</span></label>
                <input type="text" [(ngModel)]="editForm.name" [class.input-error]="editSubmitted() && !editForm.name.trim()" />
                @if (editSubmitted() && !editForm.name.trim()) {
                  <span class="field-error">Zorunlu alan</span>
                }
              </div>
              <div class="form-group">
                <label>Durum</label>
                <select [(ngModel)]="editForm.status">
                  <option value="Active">Aktif</option>
                  <option value="Deprecated">Kullanımdan Kalkıyor</option>
                  <option value="Discontinued">Kapatıldı</option>
                </select>
              </div>
            </div>
            <div class="form-group" style="position:relative">
              <label>Ürün Sahibi</label>
              <input type="text" placeholder="İsim veya e-posta ara..."
                [(ngModel)]="editPoSearch" (ngModelChange)="searchEditPo($event)" [disabled]="!!editPoId" />
              @if (editPoOptions().length) {
                <div class="dropdown">
                  @for (p of editPoOptions(); track p.id) {
                    <div class="dropdown-item" (click)="selectEditPo(p)">
                      <span class="di-name">{{ p.name }}</span>
                      <span class="di-email">{{ p.email }}</span>
                    </div>
                  }
                </div>
              }
              @if (editPoId) {
                <div class="selected-hint">
                  <i class="pi pi-check-circle"></i> {{ editPoName }}
                  <button type="button" class="clear-btn" (click)="clearEditPo()">×</button>
                </div>
              }
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Sürüm</label>
                <input type="text" [(ngModel)]="editForm.version" placeholder="ör. 2.4.1" />
              </div>
              <div class="form-group">
                <label>Kaynak Kod URL</label>
                <input type="url" [(ngModel)]="editForm.repositoryUrl" placeholder="https://github.com/..." />
              </div>
            </div>
            <div class="form-group">
              <label>Dokümantasyon URL</label>
              <input type="url" [(ngModel)]="editForm.documentationUrl" placeholder="https://docs.example.com/..." />
            </div>
            <div class="form-group">
              <label>Açıklama</label>
              <textarea [(ngModel)]="editForm.description" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label>Teknoloji Stack'i</label>
              <input type="text" [(ngModel)]="editForm.techStack" placeholder="ör. .NET, Angular, PostgreSQL (virgülle ayırın)" />
              <span class="hint">Virgülle ayırarak girin: .NET, Angular, PostgreSQL</span>
            </div>
            <app-custom-field-inputs
              [defs]="customFieldDefs()"
              [editValues]="editCfValues"
              [submitted]="editSubmitted()"
              mode="edit" />
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showEditModal.set(false)">İptal</button>
            <button type="button" class="btn btn-primary" [disabled]="editSaving()" (click)="saveEdit()">
              {{ editSaving() ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-state { text-align: center; padding: 4rem; color: var(--text-subtle); }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.25rem; a { color: var(--primary); text-decoration: none; &:hover { text-decoration: underline; } } }

    .header-card { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.5rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); flex-wrap: wrap; }
    .header-main { display: flex; align-items: flex-start; gap: 1rem; }
    .product-icon { width: 3rem; height: 3rem; border-radius: 0.5rem; background: var(--success-soft-bg); color: var(--success-strong); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; }
    .header-top { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; h1 { font-size: 1.25rem; font-weight: 700; color: var(--text-strong); } }
    .code-badge { background: var(--surface-3); color: var(--text); padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.8125rem; }
    .header-desc { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }
    .version-tag { margin-top: 0.375rem; display: inline-block; font-size: 0.75rem; background: var(--indigo-soft-bg); color: var(--indigo-strong); padding: 0.125rem 0.5rem; border-radius: 9999px; }
    .header-right { display: flex; gap: 0.5rem; flex-wrap: wrap; padding-top: 0.25rem; }

    .stats-bar { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 0.875rem 1.5rem; display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.25rem; flex-wrap: wrap; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .stat { display: flex; flex-direction: column; gap: 0.125rem; }
    .stat-val { font-size: 1rem; font-weight: 700; color: var(--text-strong); }
    .stat-lbl { font-size: 0.75rem; color: var(--text-subtle); }
    .stat-sep { width: 1px; height: 2.5rem; background: var(--border); }

    .tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); margin-bottom: 1.25rem; }
    .tab-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; background: none; border: none; font-size: 0.875rem; font-weight: 500; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color 0.15s; &:hover { color: var(--text); } &.active { color: var(--primary); border-bottom-color: var(--primary); } }

    .tab-content { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .empty-text { color: var(--text-subtle); font-size: 0.875rem; text-align: center; padding: 2rem; }

    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 1.25rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.75rem; font-weight: 600; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.05em; } span, a { font-size: 0.875rem; color: var(--text-strong); } }
    .link { color: var(--primary); text-decoration: none; &:hover { text-decoration: underline; } }
    .ext-link { display: flex; align-items: center; gap: 0.375rem; i { font-size: 0.75rem; } }
    .tech-stack-section { label { font-size: 0.75rem; font-weight: 600; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.5rem; } }
    .tech-tags { display: flex; flex-wrap: wrap; gap: 0.375rem; }
    .tech-tag { background: var(--indigo-soft-bg); color: var(--indigo-strong); padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }

    .endpoint-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .endpoint-card { background: var(--surface-2); border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.875rem 1rem; }
    .ep-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; width: 100%; }
    .ep-icon { width: 2rem; height: 2rem; border-radius: 0.375rem; background: var(--indigo-soft-bg); color: var(--indigo-strong); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ep-info { display: flex; align-items: center; gap: 0.75rem; }
    .ep-name { font-weight: 500; color: var(--text-strong); font-size: 0.875rem; }
    .badge--ep { background: var(--primary-soft-bg); color: var(--primary-soft-text); }
    .ep-url { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.375rem; code { background: var(--surface); border: 1px solid var(--border); padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-family: monospace; color: var(--text); } a { color: var(--primary); text-decoration: none; &:hover { text-decoration: underline; } } }
    .ep-swagger { i { color: var(--success-strong); } }
    .copy-btn { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.125rem; &:hover { color: var(--text); } }

    .team-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .team-card { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: var(--surface-2); border: 1px solid var(--border); border-radius: 0.5rem; }
    .team-card-info { flex: 1; min-width: 0; }
    .actions-cell { text-align: right; width: 1%; white-space: nowrap; }
    .team-avatar { width: 2rem; height: 2rem; border-radius: 0.375rem; background: var(--indigo-soft-bg); color: var(--indigo-strong); display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 700; flex-shrink: 0; }
    .muted-sm { font-size: 0.75rem; color: var(--text-subtle); margin-top: 0.125rem; }

    .data-table { width: 100%; border-collapse: collapse; th { background: var(--surface-2); padding: 0.625rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--border); } td { padding: 0.75rem; font-size: 0.875rem; color: var(--text); border-bottom: 1px solid var(--surface-3); } tr:last-child td { border-bottom: none; } }
    .inactive-row td { opacity: 0.55; }
    .muted { color: var(--text-muted); }
    .btn-icon { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.25rem; border-radius: 0.25rem; &:hover { color: var(--primary); background: var(--primary-soft-bg); } }
    .btn-icon-danger { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.25rem; border-radius: 0.25rem; &:hover { color: var(--danger); background: var(--danger-faint-bg); } &:disabled { opacity: 0.5; cursor: not-allowed; } }

    .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge--active { background: var(--success-soft-bg); color: var(--success-soft-text); }
    .badge--deprecated { background: var(--warning-soft-bg); color: var(--warning-soft-text); }
    .badge--archived { background: var(--surface-3); color: var(--text-muted); }
    .badge--saas { background: var(--primary-soft-bg-2); color: var(--primary-soft-text); }
    .badge--custom { background: var(--violet-soft-bg); color: var(--violet-soft-text); }
    .badge--hybrid { background: var(--warning-soft-bg); color: var(--warning-soft-text); }

    .header-right { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; padding-top: 0.25rem; }
    .btn-edit { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-size: 0.8125rem; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 0.375rem; &:hover { background: var(--surface-2); border-color: var(--primary); color: var(--primary); } }

    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: var(--primary) !important; color: var(--surface) !important; &:not(:disabled):hover { background: var(--primary-hover) !important; } }
    .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); &:hover { background: var(--surface-3); } }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--surface); border-radius: 0.75rem; width: 100%; max-width: 540px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); flex-shrink: 0; h2 { font-size: 1.125rem; font-weight: 700; color: var(--text-strong); } }
    .close-btn { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.25rem; font-size: 1rem; &:hover { color: var(--text); } }
    .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; flex: 1; min-height: 0; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; flex-shrink: 0; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; position: relative; label { font-size: 0.875rem; font-weight: 500; color: var(--text); } input, select, textarea { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.375rem; font-size: 0.875rem; width: 100%; box-sizing: border-box; resize: vertical; &:focus { outline: none; border-color: var(--primary); } } }
    .input-error { border-color: var(--danger) !important; }
    .field-error { font-size: 0.75rem; color: var(--danger); }
    .hint-text { font-size: 0.8125rem; color: var(--text-muted); margin: 0; a { color: var(--primary); } }
    .input-readonly { background: var(--surface-3) !important; color: var(--text-muted); cursor: not-allowed; border-color: var(--border) !important; }
    .template-mode-toggle { display: flex; gap: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.25rem; background: var(--surface-2); }
    .mode-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border: none; border-radius: 0.375rem; font-size: 0.8125rem; font-weight: 500; color: var(--text-muted); background: none; cursor: pointer; transition: all 0.15s; &:hover { color: var(--text); background: var(--surface); } }
    .mode-btn--active { background: var(--surface) !important; color: var(--primary-strong) !important; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .req { color: var(--danger); }
    .hint { font-size: 0.75rem; color: var(--text-subtle); }
    .section-divider { font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid var(--surface-3); padding-top: 0.75rem; }
    .custom-fields-section { margin-top: 1.25rem; h3 { font-size: 0.875rem; font-weight: 600; color: var(--text); margin-bottom: 0.75rem; } }
    .alert-error { padding: 0.75rem; background: var(--danger-faint-bg); border: 1px solid var(--danger-border); border-radius: 0.375rem; color: var(--danger-soft-text); font-size: 0.8125rem; }

    .badge--shared { background: var(--violet-soft-bg); color: var(--violet-soft-text); }
    .type-code { font-size: 0.875rem; color: var(--text); }
    .font-medium { font-weight: 500; }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text); cursor: pointer; input[type=checkbox] { width: auto; padding: 0; margin: 0; } }

    .tab-actions-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .tab-section-count { font-size: 0.8125rem; color: var(--text-muted); }
    .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }
    .ep-delete-btn { margin-left: auto; background: none; border: none; cursor: pointer; color: var(--border-strong); padding: 0.25rem; border-radius: 0.25rem; &:hover { color: var(--danger); background: var(--danger-faint-bg); } }
    .dropdown { position: absolute; top: 100%; left: 0; right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 0.5rem; z-index: 10; box-shadow: 0 4px 16px rgba(0,0,0,0.12); max-height: 200px; overflow-y: auto; margin-top: 2px; }
    .dropdown-item { padding: 0.625rem 0.75rem; cursor: pointer; display: flex; flex-direction: column; gap: 0.125rem; &:hover { background: var(--surface-3); } }
    .di-name { font-size: 0.875rem; font-weight: 500; color: var(--text-strong); }
    .di-email { font-size: 0.75rem; color: var(--text-subtle); }
    .selected-hint { font-size: 0.8125rem; color: var(--success-strong); display: flex; align-items: center; gap: 0.375rem; margin-top: 0.25rem; }
    .clear-btn { background: none; border: none; cursor: pointer; color: var(--text-subtle); font-size: 1rem; padding: 0 0.25rem; line-height: 1; &:hover { color: var(--danger); } }
  `]
})
export class ProductDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  product = signal<ProductDetail | null>(null);
  loading = signal(true);
  activeTab = signal('info');

  customFieldDefs = signal<CustomFieldDef[]>([]);
  private cfDefsLoaded = false;
  editCfValues: Record<string, string> = {};

  private loadCustomFieldDefs(onDone?: () => void): void {
    if (this.cfDefsLoaded) { onDone?.(); return; }
    this.http.get<CustomFieldDef[]>(`${environment.apiUrl}/custom-field-definitions?entityType=1`).subscribe({
      next: defs => { this.customFieldDefs.set(defs); this.cfDefsLoaded = true; onDone?.(); }
    });
  }

  private buildCustomFields(): Record<string, unknown> | null {
    const defs = this.customFieldDefs();
    if (!defs.length) return null;
    const result: Record<string, unknown> = {};
    let hasAny = false;
    for (const def of defs) {
      const raw = this.editCfValues[def.fieldKey];
      if (!raw && raw !== 'false') continue;
      hasAny = true;
      if (def.fieldType === 'Number') result[def.fieldKey] = Number(raw);
      else if (def.fieldType === 'Boolean') result[def.fieldKey] = raw === 'true';
      else result[def.fieldKey] = raw;
    }
    return hasAny ? result : null;
  }

  showEditModal = signal(false);
  editSaving = signal(false);
  editSubmitted = signal(false);
  editError = signal('');
  editForm = { name: '', description: '', version: '', status: 'Active', repositoryUrl: '', documentationUrl: '', techStack: '' };

  editPoId = '';
  editPoName = '';
  editPoSearch = '';
  editPoOptions = signal<{ id: string; name: string; email: string }[]>([]);

  searchEditPo(query: string): void {
    if (!query.trim()) { this.editPoOptions.set([]); return; }
    this.http.get<{ items: { id: string; firstName: string; lastName: string; email: string }[] }>(
      `${environment.apiUrl}/people?search=${encodeURIComponent(query)}&pageSize=8`
    ).subscribe({ next: r => this.editPoOptions.set(r.items.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, email: p.email }))) });
  }

  selectEditPo(p: { id: string; name: string; email: string }): void {
    this.editPoId = p.id;
    this.editPoName = p.name;
    this.editPoSearch = '';
    this.editPoOptions.set([]);
  }

  clearEditPo(): void {
    this.editPoId = '';
    this.editPoName = '';
    this.editPoSearch = '';
    this.editPoOptions.set([]);
  }
  readonly tabs = [
    { key: 'info', label: 'Genel Bilgiler' },
    { key: 'endpoints', label: 'Endpoint\'ler' },
    { key: 'teams', label: 'Ekipler' },
    { key: 'assignments', label: 'Çalışanlar' },
    { key: 'resources', label: 'Kaynak Şablonları' },
  ];

  activeAssignments() { return (this.product()?.assignments ?? []).filter(a => a.isActive).length; }
  sortedEndpoints() { return [...(this.product()?.endpoints ?? [])].sort((a, b) => a.sortOrder - b.sortOrder); }

  typeLabel(t: number) { return PRODUCT_TYPE[t] ?? t; }
  typeCss(t: number) { return PRODUCT_TYPE_CSS[t] ?? ''; }
  statusLabel(s: string) { return STATUS_LABEL[s] ?? s; }
  statusCss(s: string) { return STATUS_CSS[s] ?? ''; }
  endpointTypeLabel(t: number) { return ENDPOINT_TYPE[t] ?? t; }
  endpointIcon(t: number) { return ENDPOINT_ICON[t] ?? 'pi-server'; }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<ProductDetail>(`${environment.apiUrl}/products/${id}`).subscribe({
      next: p => { this.product.set(p); this.loading.set(false); this.loadCustomFieldDefs(); },
      error: () => this.loading.set(false)
    });
  }

  openEdit() {
    const p = this.product()!;
    this.editForm = {
      name: p.name,
      description: p.description ?? '',
      version: p.version ?? '',
      status: p.status,
      repositoryUrl: p.repositoryUrl ?? '',
      documentationUrl: p.documentationUrl ?? '',
      techStack: p.techStack.join(', ')
    };
    this.editCfValues = {};
    this.editPoId = p.poPersonId ?? '';
    this.editPoName = p.poName ?? '';
    this.editPoSearch = '';
    this.editPoOptions.set([]);
    this.editSubmitted.set(false);
    this.editError.set('');
    this.loadCustomFieldDefs(() => {
      const existing = p.customFields ?? {};
      for (const def of this.customFieldDefs()) {
        const val = existing[def.fieldKey];
        if (val !== undefined && val !== null) {
          this.editCfValues[def.fieldKey] = def.fieldType === 'Boolean' ? (val ? 'true' : 'false') : String(val);
        }
      }
    });
    this.showEditModal.set(true);
  }

  saveEdit() {
    this.editSubmitted.set(true);
    if (!this.editForm.name.trim()) return;
    const requiredMissing = this.customFieldDefs().some(d => d.isRequired && !this.editCfValues[d.fieldKey]);
    if (requiredMissing) return;
    this.editSaving.set(true);
    this.editError.set('');
    const id = this.route.snapshot.paramMap.get('id');
    const techStack = this.editForm.techStack
      .split(',').map(t => t.trim()).filter(t => t.length > 0);
    this.http.put(`${environment.apiUrl}/products/${id}`, {
      name: this.editForm.name.trim(),
      description: this.editForm.description.trim() || null,
      version: this.editForm.version.trim() || null,
      status: this.editForm.status,
      poPersonId: this.editPoId || null,
      techStack: techStack.length ? techStack : null,
      repositoryUrl: this.editForm.repositoryUrl.trim() || null,
      documentationUrl: this.editForm.documentationUrl.trim() || null,
      customFields: this.buildCustomFields()
    }).subscribe({
      next: () => {
        this.editSaving.set(false);
        this.showEditModal.set(false);
        this.http.get<ProductDetail>(`${environment.apiUrl}/products/${id}`).subscribe(p => this.product.set(p));
      },
      error: err => {
        this.editSaving.set(false);
        this.editError.set(err.error?.detail ?? 'Güncelleme başarısız');
      }
    });
  }

  // --- Endpoint management ---
  showEndpointModal = signal(false);
  epSaving = signal(false);
  epSubmitted = signal(false);
  epError = signal('');
  epForm = { name: '', endpointType: '1', defaultBaseUrl: '', swaggerUrl: '' };

  openAddEndpoint() {
    this.epForm = { name: '', endpointType: '1', defaultBaseUrl: '', swaggerUrl: '' };
    this.epSubmitted.set(false);
    this.epError.set('');
    this.showEndpointModal.set(true);
  }

  saveEndpoint() {
    this.epSubmitted.set(true);
    if (!this.epForm.name.trim()) return;
    this.epSaving.set(true);
    this.epError.set('');
    const id = this.route.snapshot.paramMap.get('id');
    this.http.post(`${environment.apiUrl}/products/${id}/endpoints`, {
      name: this.epForm.name.trim(),
      endpointType: Number(this.epForm.endpointType),
      sortOrder: (this.product()?.endpoints.length ?? 0),
      defaultBaseUrl: this.epForm.defaultBaseUrl.trim() || null,
      swaggerUrl: this.epForm.swaggerUrl.trim() || null,
      description: null,
      healthCheckUrl: null,
      defaultAuthType: 0
    }).subscribe({
      next: () => {
        this.epSaving.set(false);
        this.showEndpointModal.set(false);
        this.reload();
      },
      error: err => { this.epSaving.set(false); this.epError.set(err.error?.detail ?? 'Endpoint eklenemedi'); }
    });
  }

  deleteEndpoint(endpointId: string) {
    if (!confirm('Bu endpoint silinecek. Emin misiniz?')) return;
    const id = this.route.snapshot.paramMap.get('id');
    this.http.delete(`${environment.apiUrl}/products/${id}/endpoints/${endpointId}`).subscribe({
      next: () => this.reload()
    });
  }

  // --- Team assignment ---
  showTeamModal = signal(false);
  teamSaving = signal(false);
  teamSubmitted = signal(false);
  teamAssignError = signal('');
  teamForm = { teamId: '', role: '', since: '' };
  private allTeams = signal<{ id: string; name: string }[]>([]);

  availableTeams() {
    const assigned = new Set(this.product()?.teams.map(t => t.teamId) ?? []);
    return this.allTeams().filter(t => !assigned.has(t.id));
  }

  openAssignTeam() {
    this.teamForm = { teamId: '', role: '', since: '' };
    this.teamSubmitted.set(false);
    this.teamAssignError.set('');
    this.showTeamModal.set(true);
    if (!this.allTeams().length) {
      this.http.get<{ items: { id: string; name: string }[] }>(`${environment.apiUrl}/teams?pageSize=200`).subscribe({
        next: r => this.allTeams.set(r.items)
      });
    }
  }

  saveTeamAssign() {
    this.teamSubmitted.set(true);
    if (!this.teamForm.teamId) return;
    this.teamSaving.set(true);
    this.teamAssignError.set('');
    const id = this.route.snapshot.paramMap.get('id');
    this.http.post(`${environment.apiUrl}/products/${id}/teams`, {
      teamId: this.teamForm.teamId,
      role: this.teamForm.role.trim() || null,
      since: this.teamForm.since || null
    }).subscribe({
      next: () => { this.teamSaving.set(false); this.showTeamModal.set(false); this.reload(); },
      error: err => { this.teamSaving.set(false); this.teamAssignError.set(err.error?.detail ?? 'Ekip atanamadı'); }
    });
  }

  removingTeamId = signal<string | null>(null);
  removeTeam(teamId: string, teamName: string) {
    if (!confirm(`"${teamName}" ekibini bu üründen kaldırmak istediğinize emin misiniz?`)) return;
    this.removingTeamId.set(teamId);
    const id = this.route.snapshot.paramMap.get('id');
    this.http.delete(`${environment.apiUrl}/products/${id}/teams/${teamId}`).subscribe({
      next: () => { this.removingTeamId.set(null); this.reload(); },
      error: () => { this.removingTeamId.set(null); }
    });
  }

  // --- Person assignment ---
  showPersonModal = signal(false);
  personSaving = signal(false);
  personSubmitted = signal(false);
  personAssignError = signal('');
  personForm = { personId: '', responsibility: '', startedAt: '' };
  personSearch = '';
  personOptions = signal<{ id: string; name: string; email: string }[]>([]);
  selectedPersonName = signal('');

  openAssignPerson() {
    this.personForm = { personId: '', responsibility: '', startedAt: '' };
    this.personSearch = '';
    this.personOptions.set([]);
    this.selectedPersonName.set('');
    this.personSubmitted.set(false);
    this.personAssignError.set('');
    this.showPersonModal.set(true);
  }

  searchPersons(query: string) {
    if (!query.trim()) { this.personOptions.set([]); return; }
    this.http.get<{ items: { id: string; firstName: string; lastName: string; email: string }[] }>(
      `${environment.apiUrl}/people?search=${encodeURIComponent(query)}&pageSize=10`
    ).subscribe({
      next: r => this.personOptions.set(r.items.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, email: p.email }))),
      error: () => this.personOptions.set([])
    });
  }

  selectPerson(p: { id: string; name: string; email: string }) {
    this.personForm.personId = p.id;
    this.selectedPersonName.set(p.name);
    this.personSearch = '';
    this.personOptions.set([]);
  }

  savePersonAssign() {
    this.personSubmitted.set(true);
    if (!this.personForm.personId) return;
    this.personSaving.set(true);
    this.personAssignError.set('');
    const id = this.route.snapshot.paramMap.get('id');
    this.http.post(`${environment.apiUrl}/products/${id}/assignments`, {
      personId: this.personForm.personId,
      responsibility: this.personForm.responsibility.trim() || null,
      startedAt: this.personForm.startedAt || null
    }).subscribe({
      next: () => { this.personSaving.set(false); this.showPersonModal.set(false); this.reload(); },
      error: err => { this.personSaving.set(false); this.personAssignError.set(err.error?.detail ?? 'Kişi atanamadı'); }
    });
  }

  removingPersonId = signal<string | null>(null);
  removePerson(personId: string, fullName: string) {
    if (!confirm(`"${fullName}" kişisinin bu ürüne atamasını kaldırmak istediğinize emin misiniz?`)) return;
    this.removingPersonId.set(personId);
    const id = this.route.snapshot.paramMap.get('id');
    this.http.delete(`${environment.apiUrl}/products/${id}/assignments/${personId}`).subscribe({
      next: () => { this.removingPersonId.set(null); this.reload(); },
      error: () => { this.removingPersonId.set(null); }
    });
  }

  // --- Resource Templates ---
  showTemplateModal = signal(false);
  templateSaving = signal(false);
  templateSubmitted = signal(false);
  deletingTemplateId = signal<string | null>(null);
  templateError = signal('');
  editingTemplateId = signal<string | null>(null);
  templateForm = { resourceTypeId: '', name: '', description: '', isRequired: false, canBeShared: false, sortOrder: 0 };
  templateFromShared = signal(false);
  resourceTypes = signal<{ id: string; name: string; code: string }[]>([]);
  private resourceTypesLoaded = false;
  sharedResourcesForTemplate = signal<{ id: string; name: string; resourceTypeName: string; resourceTypeId: string }[]>([]);
  private sharedResourcesForTemplateLoaded = false;
  selectedSharedForTemplate = signal<{ id: string; name: string; resourceTypeName: string; resourceTypeId: string } | null>(null);

  openAddTemplate() {
    this.editingTemplateId.set(null);
    this.templateFromShared.set(false);
    this.selectedSharedForTemplate.set(null);
    this.templateForm = { resourceTypeId: '', name: '', description: '', isRequired: false, canBeShared: false, sortOrder: this.product()!.resourceTemplates.length };
    this.templateSubmitted.set(false);
    this.templateError.set('');
    this.showTemplateModal.set(true);
    if (!this.resourceTypesLoaded) {
      this.http.get<{ id: string; name: string; code: string }[]>(`${environment.apiUrl}/resources/types`).subscribe({
        next: r => { this.resourceTypes.set(r); this.resourceTypesLoaded = true; }
      });
    }
    if (!this.sharedResourcesForTemplateLoaded) {
      this.http.get<{ id: string; name: string; resourceTypeName: string; resourceTypeId: string }[]>(`${environment.apiUrl}/resources/shared`).subscribe({
        next: r => { this.sharedResourcesForTemplate.set(r); this.sharedResourcesForTemplateLoaded = true; }
      });
    }
  }

  onTemplateFromSharedToggle(fromShared: boolean) {
    this.templateFromShared.set(fromShared);
    this.selectedSharedForTemplate.set(null);
    this.templateForm.resourceTypeId = '';
    this.templateForm.name = '';
    this.templateForm.canBeShared = fromShared;
  }

  onSharedResourceForTemplateSelect(id: string) {
    const sr = this.sharedResourcesForTemplate().find(x => x.id === id) ?? null;
    this.selectedSharedForTemplate.set(sr);
    if (sr) {
      this.templateForm.resourceTypeId = sr.resourceTypeId;
      this.templateForm.name = sr.name;
      this.templateForm.canBeShared = true;
    }
  }

  openEditTemplate(t: { id: string; name: string; resourceTypeId: string; isRequired: boolean; canBeShared: boolean; sortOrder: number; description?: string }) {
    this.editingTemplateId.set(t.id);
    this.templateFromShared.set(false);
    this.selectedSharedForTemplate.set(null);
    this.templateForm = {
      resourceTypeId: t.resourceTypeId,
      name: t.name,
      description: t.description ?? '',
      isRequired: t.isRequired,
      canBeShared: t.canBeShared,
      sortOrder: t.sortOrder
    };
    this.templateSubmitted.set(false);
    this.templateError.set('');
    this.showTemplateModal.set(true);
  }

  saveTemplate() {
    this.templateSubmitted.set(true);
    if (this.templateFromShared() && !this.selectedSharedForTemplate()) return;
    if (!this.templateForm.resourceTypeId || !this.templateForm.name.trim()) return;
    this.templateSaving.set(true);
    this.templateError.set('');
    const id = this.route.snapshot.paramMap.get('id');
    this.http.post(`${environment.apiUrl}/products/${id}/resource-templates`, {
      resourceTypeId: this.templateForm.resourceTypeId,
      name: this.templateForm.name.trim(),
      description: this.templateForm.description.trim() || null,
      isRequired: this.templateForm.isRequired,
      canBeShared: this.templateForm.canBeShared,
      sortOrder: this.templateForm.sortOrder,
      sharedResourceId: this.templateFromShared() ? this.selectedSharedForTemplate()?.id ?? null : null
    }).subscribe({
      next: () => { this.templateSaving.set(false); this.showTemplateModal.set(false); this.reload(); },
      error: err => { this.templateSaving.set(false); this.templateError.set(err.error?.detail ?? 'Şablon eklenemedi'); }
    });
  }

  updateTemplate() {
    this.templateSubmitted.set(true);
    if (!this.templateForm.name.trim()) return;
    this.templateSaving.set(true);
    this.templateError.set('');
    const productId = this.route.snapshot.paramMap.get('id');
    const templateId = this.editingTemplateId()!;
    this.http.put(`${environment.apiUrl}/products/${productId}/resource-templates/${templateId}`, {
      name: this.templateForm.name.trim(),
      description: this.templateForm.description.trim() || null,
      isRequired: this.templateForm.isRequired,
      canBeShared: this.templateForm.canBeShared,
      sortOrder: this.templateForm.sortOrder
    }).subscribe({
      next: () => { this.templateSaving.set(false); this.showTemplateModal.set(false); this.reload(); },
      error: err => { this.templateSaving.set(false); this.templateError.set(err.error?.detail ?? 'Şablon güncellenemedi'); }
    });
  }

  deleteTemplate(templateId: string, templateName: string) {
    if (!confirm(`"${templateName}" kaynak şablonunu silmek istediğinizden emin misiniz?`)) return;
    this.deletingTemplateId.set(templateId);
    const productId = this.route.snapshot.paramMap.get('id');
    this.http.delete(`${environment.apiUrl}/products/${productId}/resource-templates/${templateId}`).subscribe({
      next: () => { this.deletingTemplateId.set(null); this.reload(); },
      error: (err) => {
        this.deletingTemplateId.set(null);
        alert(err.error?.detail ?? 'Şablon silinemedi.');
      }
    });
  }

  private reload() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<ProductDetail>(`${environment.apiUrl}/products/${id}`).subscribe(p => this.product.set(p));
  }

  copy(text: string) {
    navigator.clipboard.writeText(text);
  }
}
