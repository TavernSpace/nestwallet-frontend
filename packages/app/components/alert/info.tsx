import { TextButton } from '../button/text-button';
import { ActionSheet } from '../sheet';
import { ActionSheetHeader } from '../sheet/header';
import { Text } from '../text';
import { View } from '../view';

export function InfoAlert(props: {
  children?: React.ReactNode;
  title: string;
  body: string;
  onClose: VoidFunction;
  isVisible: boolean;
}) {
  const { children, title, body, onClose, isVisible } = props;

  return (
    <ActionSheet isShowing={isVisible} onClose={onClose} isDetached={true}>
      <ActionSheetHeader title={title} onClose={onClose} type='detached' />
      <View className='flex flex-col space-y-4 px-4'>
        <Text className='text-text-secondary text-sm font-normal'>{body}</Text>
        {children}
      </View>
    </ActionSheet>
  );
}

export function InfoSheet(props: {
  title: string;
  body: string;
  isShowing: boolean;
  buttonText?: string;
  onClose: VoidFunction;
  onPress?: VoidFunction;
}) {
  const { title, body, isShowing, buttonText, onClose, onPress } = props;

  return (
    <InfoAlert
      title={title}
      body={body}
      onClose={onClose}
      isVisible={isShowing}
    >
      {onPress && buttonText && (
        <TextButton
          text={buttonText}
          onPress={() => {
            onPress();
            onClose();
          }}
        />
      )}
    </InfoAlert>
  );
}
