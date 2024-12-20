import { faImage, faTrash } from '@fortawesome/pro-solid-svg-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ReactNativeFile } from '../../common/hooks/graphql';
import { adjust, withSize } from '../../common/utils/style';
import { colors } from '../../design/constants';
import { IFile } from '../../graphql/client/generated/graphql';
import { FontAwesomeIcon } from '../font-awesome-icon';
import { ListItemButton } from '../list/list-item';
import { ActionSheet } from '../sheet';
import { ActionSheetHeader } from '../sheet/header';
import { View } from '../view';
import { FileInputButton } from './button';
import { getExtractableFileFromImagePickerAsset } from './utils';

export interface IFileInputProps {
  title: string;
  defaultValue?: IFile;
  value?: File | ReactNativeFile | null;
  onChange: (value: File | ReactNativeFile) => void;
  onDelete: VoidFunction;
}

export function FileInput(props: IFileInputProps) {
  const { title, defaultValue, value, onChange, onDelete } = props;

  const [isShowingSheet, setIsShowingSheet] = useState(false);

  const handleUploadImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      const file = getExtractableFileFromImagePickerAsset(result.assets[0]);
      setIsShowingSheet(false);
      onChange(file);
    }
  };

  const handleRemoveImage = () => {
    onDelete();
    setIsShowingSheet(false);
  };

  const handleOpen = () => {
    setIsShowingSheet(true);
  };

  const size = adjust(36);
  const iconSize = adjust(18, 2);

  return (
    <>
      <FileInputButton
        onPress={handleOpen}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value ?? undefined}
      />
      <ActionSheet
        isShowing={isShowingSheet}
        isDetached={true}
        onClose={() => setIsShowingSheet(false)}
      >
        <ActionSheetHeader
          title={title}
          onClose={() => setIsShowingSheet(false)}
          type='detached'
        />
        <View className='flex flex-col'>
          <ListItemButton
            icon={
              <View
                className='bg-primary/10 flex flex-row items-center justify-center overflow-hidden rounded-full'
                style={withSize(size)}
              >
                <FontAwesomeIcon
                  icon={faImage}
                  size={iconSize}
                  color={colors.primary}
                />
              </View>
            }
            title='Upload Image'
            onPress={handleUploadImage}
          />
          <ListItemButton
            icon={
              <View
                className='bg-failure/10 flex flex-row items-center justify-center overflow-hidden rounded-full'
                style={withSize(size)}
              >
                <FontAwesomeIcon
                  icon={faTrash}
                  size={iconSize}
                  color={colors.failure}
                />
              </View>
            }
            title='Remove Image'
            onPress={handleRemoveImage}
          />
        </View>
      </ActionSheet>
    </>
  );
}
