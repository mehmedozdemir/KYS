import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SetupStatus {
  isInitialized: boolean;
}

export interface InitializeRequest {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class SetupService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/setup`;

  getStatus(): Observable<SetupStatus> {
    return this.http.get<SetupStatus>(`${this.baseUrl}/status`);
  }

  initialize(request: InitializeRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/initialize`, request);
  }
}
