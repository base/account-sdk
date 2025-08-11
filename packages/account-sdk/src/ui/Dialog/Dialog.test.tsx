import '@testing-library/jest-dom';

import { fireEvent, render, screen } from '@testing-library/preact';
import { vi } from 'vitest';

import { DialogContainer, DialogInstance, DialogInstanceProps } from './Dialog.js';

// Mock des hooks
vi.mock('../hooks/index.js', () => ({
  usePhonePortrait: vi.fn(() => false),
  useDragToDismiss: vi.fn(() => ({
    dragY: 0,
    isDragging: false,
    handlers: {
      onTouchStart: vi.fn(),
      onTouchMove: vi.fn(),
      onTouchEnd: vi.fn(),
    },
  })),
  useUsername: vi.fn(() => ({
    isLoading: false,
    username: 'testuser.eth',
  })),
}));

// Mock du store et getDisplayableUsername
vi.mock(':store/store.js', () => ({
  store: {
    account: {
      get: vi.fn(() => ({ accounts: ['0x123'] })),
    },
  },
}));

vi.mock(':core/username/getDisplayableUsername.js', () => ({
  getDisplayableUsername: vi.fn(() => Promise.resolve('testuser.eth')),
}));

const renderDialogContainer = (props?: Partial<DialogInstanceProps>) =>
  render(
    <DialogContainer>
      <DialogInstance title="Test Title" message="Test message" handleClose={() => {}} {...props} />
    </DialogContainer>
  );

describe('DialogContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'setTimeout');
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders with title and message', () => {
    renderDialogContainer();

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  test('renders hidden initially', () => {
    renderDialogContainer();

    const hiddenClass = document.getElementsByClassName('-base-acc-sdk-dialog-instance-hidden');
    expect(hiddenClass.length).toEqual(1);

    vi.runAllTimers();
    expect(setTimeout).toHaveBeenCalledTimes(1);
  });

  test('shows action button when provided', () => {
    const onClick = vi.fn();
    renderDialogContainer({
      actionItems: [
        {
          text: 'Try again',
          onClick,
          variant: 'primary',
        },
      ],
    });

    const button = screen.getByText('Try again');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON'); // Vérifie que c'est un bouton sémantique

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('shows secondary button when provided', () => {
    const onClick = vi.fn();
    renderDialogContainer({
      actionItems: [
        {
          text: 'Cancel',
          onClick,
          variant: 'secondary',
        },
      ],
    });

    const button = screen.getByText('Cancel');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    renderDialogContainer({ handleClose });

    const closeButton = document.getElementsByClassName(
      '-base-acc-sdk-dialog-instance-header-close'
    )[0];

    expect(closeButton.tagName).toBe('BUTTON'); // Vérifie que c'est un bouton
    expect(closeButton).toHaveAttribute('aria-label', 'Close dialog'); // Accessibilité

    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('renders both buttons when provided', () => {
    const primaryClick = vi.fn();
    const secondaryClick = vi.fn();

    renderDialogContainer({
      actionItems: [
        {
          text: 'Primary',
          onClick: primaryClick,
          variant: 'primary',
        },
        {
          text: 'Secondary',
          onClick: secondaryClick,
          variant: 'secondary',
        },
      ],
    });

    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Secondary')).toBeInTheDocument();
  });

  test('displays username when loaded', () => {
    renderDialogContainer();

    // Le mock retourne 'testuser.eth'
    expect(screen.getByText('Signed in as testuser.eth')).toBeInTheDocument();
  });

  test('displays default title when no username', async () => {
    // Mock pour retourner pas d'username
    const { useUsername } = vi.mocked(await import('../hooks/index.js'));
    useUsername.mockReturnValue({
      isLoading: false,
      username: null,
    });

    renderDialogContainer();

    expect(screen.getByText('Base Account')).toBeInTheDocument();
  });

  test('uses drag handlers from hook', async () => {
    const mockHandlers = {
      onTouchStart: vi.fn(),
      onTouchMove: vi.fn(),
      onTouchEnd: vi.fn(),
    };

    const { useDragToDismiss } = vi.mocked(await import('../hooks/index.js'));
    useDragToDismiss.mockReturnValue({
      dragY: 50,
      isDragging: true,
      handlers: mockHandlers,
    });

    renderDialogContainer();

    const backdrop = document.getElementsByClassName('-base-acc-sdk-dialog-backdrop')[0];

    // Vérifie que les handlers sont attachés
    fireEvent.touchStart(backdrop);
    fireEvent.touchMove(backdrop);
    fireEvent.touchEnd(backdrop);

    expect(mockHandlers.onTouchStart).toHaveBeenCalled();
    expect(mockHandlers.onTouchMove).toHaveBeenCalled();
    expect(mockHandlers.onTouchEnd).toHaveBeenCalled();
  });

  test('applies drag transform from hook', async () => {
    const { useDragToDismiss } = vi.mocked(await import('../hooks/index.js'));
    useDragToDismiss.mockReturnValue({
      dragY: 100,
      isDragging: true,
      handlers: {
        onTouchStart: vi.fn(),
        onTouchMove: vi.fn(),
        onTouchEnd: vi.fn(),
      },
    });

    renderDialogContainer();

    const dialog = document.getElementsByClassName('-base-acc-sdk-dialog')[0];
    expect(dialog).toHaveStyle('transform: translateY(100px)');
    expect(dialog).toHaveStyle('transition: none');
  });

  test('shows handle bar on phone portrait', async () => {
    const { usePhonePortrait } = vi.mocked(await import('../hooks/index.js'));
    usePhonePortrait.mockReturnValue(true);

    renderDialogContainer();

    const handleBar = document.getElementsByClassName('-base-acc-sdk-dialog-handle-bar')[0];
    expect(handleBar).toBeInTheDocument();
  });

  test('hides handle bar on desktop', async () => {
    const { usePhonePortrait } = vi.mocked(await import('../hooks/index.js'));
    usePhonePortrait.mockReturnValue(false);

    renderDialogContainer();

    const handleBar = document.getElementsByClassName('-base-acc-sdk-dialog-handle-bar')[0];
    expect(handleBar).toBeUndefined();
  });
});
