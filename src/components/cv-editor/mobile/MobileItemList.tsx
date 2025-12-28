import { Plus, ChevronRight, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface MobileItemListProps {
    items: any[];
    onSelect: (itemId: string) => void;
    onAdd: () => void;
    onDelete: (itemId: string) => void;
    onReorder: (items: any[]) => void;
    titleKey: string;
    subtitleKey?: string;
    dateKey?: string;
}

export default function MobileItemList({
    items,
    onSelect,
    onAdd,
    onDelete,
    onReorder,
    titleKey,
    subtitleKey,
    dateKey
}: MobileItemListProps) {

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const newItems = Array.from(items);
        const [reorderedItem] = newItems.splice(result.source.index, 1);
        newItems.splice(result.destination.index, 0, reorderedItem);

        onReorder(newItems);
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-[#1c1c1e]">
            <div className="flex-1 overflow-y-auto p-4 pb-20">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-[#2c2c2e] rounded-full flex items-center justify-center mb-4">
                            <Plus className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                            No items yet
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Add your first item to get started
                        </p>
                        <button
                            onClick={onAdd}
                            className="px-6 py-2.5 bg-[#635BFF] text-white font-medium rounded-xl shadow-sm active:scale-95 transition-all"
                        >
                            Add Item
                        </button>
                    </div>
                ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="mobile-items">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-3"
                                >
                                    {items.map((item, index) => (
                                        <Draggable
                                            key={item.id}
                                            draggableId={item.id}
                                            index={index}
                                        >
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    style={provided.draggableProps.style}
                                                    className={`
                            bg-white dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-[#3a3a3c] shadow-sm overflow-hidden
                            ${snapshot.isDragging ? 'shadow-lg ring-2 ring-[#635BFF] z-50' : ''}
                          `}
                                                >
                                                    <div className="flex items-center p-3">
                                                        {/* Drag Handle */}
                                                        <div
                                                            {...provided.dragHandleProps}
                                                            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                                        >
                                                            <GripVertical className="w-5 h-5" />
                                                        </div>

                                                        {/* Content */}
                                                        <div
                                                            className="flex-1 min-w-0 cursor-pointer px-1"
                                                            onClick={() => onSelect(item.id)}
                                                        >
                                                            <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                                                                {item[titleKey] || '(Untitled)'}
                                                            </h3>
                                                            {(subtitleKey || dateKey) && (
                                                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                                    {subtitleKey && item[subtitleKey] && (
                                                                        <span className="truncate">{item[subtitleKey]}</span>
                                                                    )}
                                                                    {subtitleKey && dateKey && <span>•</span>}
                                                                    {dateKey && item[dateKey] && (
                                                                        <span className="truncate">{item[dateKey]}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onDelete(item.id);
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>

                                                            <button
                                                                onClick={() => onSelect(item.id)}
                                                                className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                                            >
                                                                <ChevronRight className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                )}
            </div>

            {/* Floating Action Button for adding items (if list not empty) */}
            {items.length > 0 && (
                <div className="absolute bottom-6 right-6 z-10">
                    <button
                        onClick={onAdd}
                        className="w-14 h-14 bg-[#635BFF] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#5249e6] active:scale-95 transition-all"
                    >
                        <Plus className="w-7 h-7" />
                    </button>
                </div>
            )}
        </div>
    );
}
