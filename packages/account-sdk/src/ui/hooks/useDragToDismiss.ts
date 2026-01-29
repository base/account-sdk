import { useCallback, useState } from 'preact/hooks';
import { usePhonePortrait } from './usePhonePortrait.js';

const DRAG_DISMISS_THRESHOLD = 100;

interface DragState {
  dragY: number;
  isDragging: boolean;
  startY: number;
}

export function useDragToDismiss(onDismiss: () => void) {
  const [dragState, setDragState] = useState<DragState>({
    dragY: 0,
    isDragging: false,
    startY: 0,
  });

  const isPhonePortrait = usePhonePortrait();

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!isPhonePortrait) return;

      const touch = e.touches[0];
      setDragState((prev) => ({
        ...prev,
        startY: touch.clientY,
        isDragging: true,
      }));
    },
    [isPhonePortrait]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!dragState.isDragging) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - dragState.startY;

      // Only allow dragging down (positive deltaY)
      if (deltaY > 0) {
        setDragState((prev) => ({ ...prev, dragY: deltaY }));
        e.preventDefault(); // Prevent scrolling
      }
    },
    [dragState.isDragging, dragState.startY]
  );

  const handleTouchEnd = useCallback(() => {
    if (!dragState.isDragging) return;

    const shouldDismiss = dragState.dragY > DRAG_DISMISS_THRESHOLD;

    if (shouldDismiss) {
      onDismiss();
    } else {
      // Reset to original position
      setDragState((prev) => ({ ...prev, dragY: 0 }));
    }

    setDragState((prev) => ({ ...prev, isDragging: false }));
  }, [dragState.isDragging, dragState.dragY, onDismiss]);

  return {
    dragY: dragState.dragY,
    isDragging: dragState.isDragging,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
