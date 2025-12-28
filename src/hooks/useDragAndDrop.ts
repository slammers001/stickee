import { useState, useRef } from 'react';

interface DragItem {
  index: number;
  id: string;
}

export const useDragAndDrop = (_items: any[], onReorder: (fromIndex: number, toIndex: number) => void, setIsDragging?: (isDragging: boolean) => void) => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragStartTime = useRef<number>(0);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleDragStart = (e: React.DragEvent, index: number, id: string) => {
    dragStartTime.current = Date.now();
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    setDraggedItem({ index, id });
    setIsDragging?.(true);
    e.dataTransfer.effectAllowed = 'move';
    
    // Set a custom drag image if needed
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.5';
    document.body.appendChild(dragImage);
    
    // Use clientX/clientY instead of offsetX/offsetY
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);

    if (draggedItem && draggedItem.index !== dropIndex) {
      onReorder(draggedItem.index, dropIndex);
    }
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
    setIsDragging?.(false);
  };

  return {
    draggedItem,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
};
