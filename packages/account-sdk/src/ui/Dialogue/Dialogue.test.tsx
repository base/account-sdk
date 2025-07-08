import '@testing-library/jest-dom';

import { fireEvent, render, screen } from '@testing-library/preact';
// biome-ignore lint/correctness/noUnusedImports: preact
import { h } from 'preact';
import { vi } from 'vitest';

import { DialogueContainer, DialogueInstance, DialogueInstanceProps } from './Dialogue.js';

const renderDialogueContainer = (props?: Partial<DialogueInstanceProps>) =>
  render(
    <DialogueContainer>
      <DialogueInstance
        title="Test Title"
        message="Test message"
        handleClose={() => {}}
        {...props}
      />
    </DialogueContainer>
  );

describe('DialogueContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'setTimeout');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders with title and message', () => {
    renderDialogueContainer();

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  test('renders hidden initially', () => {
    renderDialogueContainer();

    const hiddenClass = document.getElementsByClassName('-cbwsdk-dialogue-instance-hidden');
    expect(hiddenClass.length).toEqual(1);

    vi.runAllTimers();
    expect(setTimeout).toHaveBeenCalledTimes(1);
  });

  test('shows action button when provided', () => {
    const onClick = vi.fn();
    renderDialogueContainer({
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
    renderDialogueContainer({
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
    renderDialogueContainer({ handleClose });

    const closeButton = document.getElementsByClassName(
      '-cbwsdk-dialogue-instance-header-close'
    )[0];
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('renders both buttons when provided', () => {
    const primaryClick = vi.fn();
    const secondaryClick = vi.fn();

    renderDialogueContainer({
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
