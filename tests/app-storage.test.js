import { describe, expect, it, vi } from 'vitest';
import {
  buildAppStorageDirectoryPath,
  ensureAppStorageDirectory,
} from '../resources/js/core/app-storage.js';

describe('app storage', () => {
  it('monta o caminho do diretorio sem barra duplicada', () => {
    expect(
      buildAppStorageDirectoryPath(
        '/Users/matheuspuppe/Library/Application Support/',
      ),
    ).toBe('/Users/matheuspuppe/Library/Application Support/calculo-rescisao');
  });

  it('nao recria o diretorio quando ele ja existe', async () => {
    const filesystem = {
      getStats: vi.fn(async () => ({ isDirectory: true })),
      createDirectory: vi.fn(),
    };

    const directoryPath = await ensureAppStorageDirectory({
      filesystem,
      appDataPath: '/Users/matheuspuppe/Library/Application Support',
    });

    expect(directoryPath).toBe(
      '/Users/matheuspuppe/Library/Application Support/calculo-rescisao',
    );
    expect(filesystem.createDirectory).not.toHaveBeenCalled();
  });

  it('cria o diretorio quando ele ainda nao existe', async () => {
    const filesystem = {
      getStats: vi.fn(async () => {
        throw new Error('missing');
      }),
      createDirectory: vi.fn(async () => {}),
    };

    const directoryPath = await ensureAppStorageDirectory({
      filesystem,
      appDataPath: '/Users/matheuspuppe/Library/Application Support',
    });

    expect(directoryPath).toBe(
      '/Users/matheuspuppe/Library/Application Support/calculo-rescisao',
    );
    expect(filesystem.createDirectory).toHaveBeenCalledWith(
      '/Users/matheuspuppe/Library/Application Support/calculo-rescisao',
    );
  });
});
