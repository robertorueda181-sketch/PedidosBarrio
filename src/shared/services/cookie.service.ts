import { Injectable } from '@angular/core';

export interface CookieOptions {
  expires?: Date | number; // Date o días
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

@Injectable({
  providedIn: 'root'
})
export class CookieService {

  /**
   * Establece una cookie
   */
  set(name: string, value: string, options: CookieOptions = {}): void {
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options.expires) {
      let expiresDate: Date;
      
      if (typeof options.expires === 'number') {
        expiresDate = new Date();
        expiresDate.setTime(expiresDate.getTime() + (options.expires * 24 * 60 * 60 * 1000));
      } else {
        expiresDate = options.expires;
      }
      
      cookieString += `; expires=${expiresDate.toUTCString()}`;
    }

    if (options.path) {
      cookieString += `; path=${options.path}`;
    } else {
      cookieString += '; path=/';
    }

    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }

    if (options.secure) {
      cookieString += '; secure';
    }

    if (options.sameSite) {
      cookieString += `; SameSite=${options.sameSite}`;
    }

    document.cookie = cookieString;
  }

  /**
   * Obtiene el valor de una cookie
   */
  get(name: string): string | null {
    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }

    return null;
  }

  /**
   * Obtiene el valor de una cookie como objeto JSON
   */
  getObject<T>(name: string): T | null {
    const value = this.get(name);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch (e) {
        console.error('Error parsing cookie JSON:', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Establece una cookie con valor de objeto JSON
   */
  setObject(name: string, value: any, options: CookieOptions = {}): void {
    this.set(name, JSON.stringify(value), options);
  }

  /**
   * Elimina una cookie
   */
  delete(name: string, path: string = '/'): void {
    this.set(name, '', { expires: -1, path });
  }

  /**
   * Verifica si una cookie existe
   */
  exists(name: string): boolean {
    return this.get(name) !== null;
  }

  /**
   * Obtiene todas las cookies como objeto
   */
  getAll(): { [key: string]: string } {
    const cookies: { [key: string]: string } = {};
    const cookieArray = document.cookie.split(';');

    for (let cookie of cookieArray) {
      cookie = cookie.trim();
      const [name, value] = cookie.split('=');
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value);
      }
    }

    return cookies;
  }

  /**
   * Elimina todas las cookies
   */
  deleteAll(path: string = '/'): void {
    const cookies = this.getAll();
    for (let name in cookies) {
      this.delete(name, path);
    }
  }
}
