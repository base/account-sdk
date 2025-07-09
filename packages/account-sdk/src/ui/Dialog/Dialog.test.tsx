import '@testing-library/jest-dom';

import { fireEvent, render, screen } from '@testing-library/preact';
import { vi } from 'vitest';

import { DialogContainer, DialogInstance, DialogInstanceProps } from './Dialog.js';

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

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    renderDialogContainer({ handleClose });

    const closeButton = document.getElementsByClassName(
      '-base-acc-sdk-dialog-instance-header-close'
    )[0];
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
});
