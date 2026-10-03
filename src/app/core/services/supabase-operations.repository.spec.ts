import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { SupabaseOperationsRepository } from './supabase-operations.repository';

describe('Live operations repository', () => {
  let auth: any;
  let client: any;
  beforeEach(() => {
    auth = { profile: signal({ id: 'staff' }), signedIn: () => !!auth.profile() };
    client = {
      rpc: vi.fn().mockResolvedValue({ error: null }),
      from: vi.fn((table: string) => {
        const query = {
          select: () => query,
          order: () => query,
          range: vi.fn().mockResolvedValue({ data: [{ id: table }], error: null }),
        };
        return query;
      }),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: { client } },
        { provide: AuthService, useValue: auth },
      ],
    });
  });
  it('loads all live tables and clears them when the session ends', async () => {
    const repo = TestBed.inject(SupabaseOperationsRepository);
    TestBed.tick();
    await repo.refresh();
    expect(repo.customers()[0].id).toBe('customers');
    expect(repo.suppliers()[0].id).toBe('suppliers');
    expect(repo.stockMovements()[0].id).toBe('stock_movements');
    expect(repo.documents()[0].id).toBe('documents');
    expect(new Set(client.from.mock.calls.map((args: string[]) => args[0])).size).toBe(14);
    auth.profile.set(null);
    TestBed.tick();
    expect(repo.customers()).toEqual([]);
    expect(repo.activities()).toEqual([]);
  });
  it('reads past the API page limit', async () => {
    const range = vi.fn((start: number) =>
      Promise.resolve({
        data:
          start === 0
            ? Array.from({ length: 500 }, (_, n) => ({ id: String(n) }))
            : [{ id: 'last' }],
        error: null,
      }),
    );
    client.from.mockImplementation(() => {
      const query = { select: () => query, order: () => query, range };
      return query;
    });
    const repo = TestBed.inject(SupabaseOperationsRepository);
    TestBed.tick();
    await repo.refresh();
    expect(repo.customers()).toHaveLength(501);
    expect(range).toHaveBeenCalledWith(500, 999);
  });
  it('saves via atomic RPCs and assigns creates through the signed-in staff session', async () => {
    const repo = TestBed.inject(SupabaseOperationsRepository);
    TestBed.tick();
    await repo.updateRecord('delivery', 'delivery-id', { fee: 900 });
    expect(client.rpc).toHaveBeenCalledWith('update_operation', {
      p_kind: 'delivery',
      p_id: 'delivery-id',
      p_changes: { fee: 900 },
    });
    await repo.createTask('Task title', 'Body', '2026-10-04');
    expect(client.rpc).toHaveBeenCalledWith('create_operation', {
      p_kind: 'task',
      p_title: 'Task title',
      p_body: 'Body',
      p_due_date: '2026-10-04',
    });
    await repo.createNote('Note title', 'Body');
    expect(client.rpc).toHaveBeenCalledWith('create_operation', {
      p_kind: 'note',
      p_title: 'Note title',
      p_body: 'Body',
      p_due_date: null,
    });
  });
  it('reports failed saves and refuses writes after logout', async () => {
    const repo = TestBed.inject(SupabaseOperationsRepository);
    TestBed.tick();
    client.rpc.mockResolvedValue({ error: { message: 'Invalid fee' } });
    await expect(repo.updateRecord('delivery', 'id', { fee: -1 })).rejects.toThrow('Invalid fee');
    auth.profile.set(null);
    TestBed.tick();
    await expect(repo.createNote('Note title', 'Body')).rejects.toThrow('Συνδεθείτε');
  });
  it('keeps a committed write successful if its follow-up reload fails', async () => {
    const repo = TestBed.inject(SupabaseOperationsRepository);
    TestBed.tick();
    await repo.refresh();
    client.from.mockImplementation(() => {
      const query = {
        select: () => query,
        order: () => query,
        range: () => Promise.resolve({ data: null, error: { message: 'Offline' } }),
      };
      return query;
    });
    await expect(repo.createNote('Note title', 'Body')).resolves.toBeUndefined();
    expect(repo.error()).toContain('φόρτωση');
  });
  it('discards in-flight data when staff logs out', async () => {
    let release!: (result: unknown) => void;
    const deferred = new Promise((resolve) => {
      release = resolve;
    });
    client.from.mockImplementation(() => {
      const query = { select: () => query, order: () => query, range: () => deferred };
      return query;
    });
    const repo = TestBed.inject(SupabaseOperationsRepository);
    TestBed.tick();
    const pending = repo.refresh();
    auth.profile.set(null);
    TestBed.tick();
    release({ data: [{ id: 'private' }], error: null });
    await pending;
    expect(repo.customers()).toEqual([]);
    expect(repo.loading()).toBe(false);
  });
});
