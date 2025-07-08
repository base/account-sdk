import { initDialogue } from ':ui/Dialogue/index.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { presentAddOwnerDialog } from './presentAddOwnerDialog.js';

vi.mock(':ui/Dialogue/index.js', () => ({
  initDialogue: vi.fn(),
}));

describe('presentAddOwnerDialog', () => {
  let mockDialogue: {
    presentItem: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockDialogue = {
      presentItem: vi.fn(),
      clear: vi.fn(),
    };
    (initDialogue as ReturnType<typeof vi.fn>).mockReturnValue(mockDialogue);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should present snackbar with correct options', async () => {
    const promise = presentAddOwnerDialog();

    expect(mockDialogue.presentItem).toHaveBeenCalledWith({
      title: expect.stringContaining('Re-authorize'),
      message: expect.stringContaining('has lost access to your account'),
      actionItems: expect.arrayContaining([
        expect.objectContaining({
          text: 'Confirm',
          variant: 'primary',
        }),
        expect.objectContaining({
          text: 'Not now',
          variant: 'secondary',
        }),
      ]),
      onClose: expect.any(Function),
    });

    const confirmClick = mockDialogue.presentItem.mock.calls[0][0].actionItems[0].onClick;
    confirmClick();

    await expect(promise).resolves.toBe('authenticate');
    expect(mockDialogue.clear).toHaveBeenCalled();
  });

  it('should resolve with cancel when cancel is clicked', async () => {
    const promise = presentAddOwnerDialog();

    const cancelClick = mockDialogue.presentItem.mock.calls[0][0].actionItems[1].onClick;
    cancelClick();

    await expect(promise).resolves.toBe('cancel');
    expect(mockDialogue.clear).toHaveBeenCalled();
  });
});
