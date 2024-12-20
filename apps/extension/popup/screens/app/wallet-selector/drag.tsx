import {
  DragDropContext,
  Draggable,
  DraggableStyle,
  DropResult,
  Droppable,
} from '@hello-pangea/dnd';
import { RenderItemProps } from '@nestwallet/app/components/drag-list/draggable-flat-list';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '@nestwallet/app/design/constants';
import { WindowType, useNestWallet } from '@nestwallet/app/provider/nestwallet';
import { isNil } from 'lodash';
import { useEffect, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions(),
  );

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}

function adjustOffsets(
  style: DraggableStyle | undefined,
  offsetX: number,
  offsetY: number,
  windowType: WindowType | undefined,
) {
  if (windowType !== WindowType.tab) {
    return style;
  } else {
    const top = (style as any).top as number;
    const left = (style as any).left as number;
    return style
      ? {
          ...style,
          top: isNil(top) ? 0 : top - offsetY,
          left: isNil(left) ? 0 : left - offsetX,
        }
      : undefined;
  }
}

export function DraggableList<T, E>(props: {
  data: T[];
  extraData: E;
  renderItem: (
    params: RenderItemProps<T, boolean, () => void, E>,
  ) => JSX.Element;
  keyExtractor: (item: T) => string;
  onDragEnd: (start: number, end: number) => void;
  ListHeaderComponent?: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const {
    data,
    extraData,
    renderItem,
    keyExtractor,
    onDragEnd,
    ListHeaderComponent,
    contentContainerStyle,
  } = props;
  const { windowType } = useNestWallet();
  const { width, height } = useWindowDimensions();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    onDragEnd(result.source.index, result.destination.index);
  };

  const horizontalPadding = (width - SCREEN_WIDTH) / 2;
  const verticalPadding = (height - SCREEN_HEIGHT) / 2;

  // this drag and drop uses a lot of web-specific apis to implement the function,
  // so we need divs and to keep this out of packages/app to prevent importing this logic
  // on mobile
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId='droppable'>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={contentContainerStyle as any}
          >
            {ListHeaderComponent}
            {data.map((item, index) => (
              <Draggable
                key={keyExtractor(item)}
                draggableId={keyExtractor(item)}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      userSelect: 'none',
                      ...adjustOffsets(
                        provided.draggableProps.style,
                        horizontalPadding,
                        verticalPadding,
                        windowType,
                      ),
                    }}
                  >
                    {renderItem({
                      item,
                      isActive: snapshot.isDragging,
                      drag: () => {},
                      extraData,
                    } as any)}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
