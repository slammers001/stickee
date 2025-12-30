import { useState, useRef } from 'react';

interface DragItem {
  index: number;
  id: string;
}

export const useDragAndDrop = (_items: any[], onReorder: (fromIndex: number, toIndex: number) => void, setIsDragging?: (isDragging: boolean) => void) => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const dragStartTime = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent, index: number, id: string) => {
    e.preventDefault();
    setIsMouseDown(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    dragStartTime.current = Date.now();
    setDraggedItem({ index, id });
    setIsDragging?.(true);
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !draggedItem) return;
    
    const deltaX = e.clientX - dragStartPos.x;
    const deltaY = e.clientY - dragStartPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Only start dragging if moved enough
    if (distance > 10) {
      // Dragging started
    }
  };

  const handleMouseUp = (targetIndex: number) => {
    if (!isMouseDown || !draggedItem) return;
    
    if (draggedItem.index !== targetIndex) {
      onReorder(draggedItem.index, targetIndex);
    }
    
    setIsMouseDown(false);
    setDraggedItem(null);
    setDragOverIndex(null);
    setIsDragging?.(false);
    
    // Restore text selection
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
  };

  const handleMouseOver = (index: number) => {
    if (isMouseDown) {
      setDragOverIndex(index);
    }
  };

  const handleMouseLeave = () => {
    setDragOverIndex(null);
  };

  return {
    draggedItem,
    dragOverIndex,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseOver,
    handleMouseLeave,
    // Keep old names for compatibility
    handleDragStart: handleMouseDown,
    handleDragOver: (e: React.DragEvent, index: number) => {
      e.preventDefault();
      setDragOverIndex(index);
    },
    handleDragLeave: handleMouseLeave,
    handleDrop: (e: React.DragEvent, index: number) => {
      e.preventDefault();
      handleMouseUp(index);
    },
    handleDragEnd: () => {
      setIsMouseDown(false);
      setDraggedItem(null);
      setDragOverIndex(null);
      setIsDragging?.(false);
      
      // Restore text selection
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    },
  };
};
