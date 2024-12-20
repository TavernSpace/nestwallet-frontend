import _ from 'lodash';
import { styled } from 'nativewind';
import { useEffect, useState } from 'react';
import { ImageStyle } from 'react-native';
import { NestWalletClient } from '../../common/api/nestwallet/client';
import { ReactNativeFile } from '../../common/hooks/graphql';
import { IFile } from '../../graphql/client/generated/graphql';
import { Image } from '../image';
import { isIFile } from './utils';

export interface IMediaProps {
  src?: string | File | IFile | ReactNativeFile;
  type: 'image';
  style?: ImageStyle;
}

export const Media = styled(function (props: IMediaProps) {
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    if (_.isString(props.src)) {
      setSrc(props.src);
    } else if (props.src instanceof File) {
      setSrc(URL.createObjectURL(props.src as File));
    } else if (props.src instanceof ReactNativeFile) {
      setSrc(props.src.uri);
    } else if (isIFile(props.src)) {
      const file = props.src as IFile;
      setSrc(NestWalletClient.getFileURL(file.id));
    }
  }, [props.src]);
  if (!src) {
    return null;
  }
  return <Image source={{ uri: src }} style={props.style} />;
});
