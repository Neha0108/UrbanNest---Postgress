import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../env/environment';

@Injectable({ providedIn: 'root' })
export class Chatbotservice {
  private apiUrl = `${environment.apiUrl}/Chatbot`;

  constructor(private http: HttpClient) {}

  ask(message: string) {
    return this.http.post<{ reply: string }>(`${this.apiUrl}/Ask`, { message });
  }
}