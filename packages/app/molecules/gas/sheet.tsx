import {
  faClock,
  faFire,
  faGear,
  faTurtle,
  IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';
import { ethers } from 'ethers';
import { useFormik } from 'formik';
import {
  formatCrypto,
  formatCryptoFloat,
  formatMoney,
} from '../../common/format/number';
import { BasicFeeData, Tuple } from '../../common/types';
import { opacity } from '../../common/utils/functions';
import { adjust, withSize } from '../../common/utils/style';
import { TextButton } from '../../components/button/text-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { ListItem } from '../../components/list/list-item';
import { ActionSheet } from '../../components/sheet';
import { ActionSheetHeader } from '../../components/sheet/header';
import { Text } from '../../components/text';
import { TextInput } from '../../components/text-input';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { ChainId, getChainInfo } from '../../features/chain';
import { validDecimalAmount } from '../../features/crypto/transfer';
import { GasPriceLevel } from '../../features/proposal/types';
import { IFeeData, IGasLevel } from '../../graphql/client/generated/graphql';
import { CustomGasSchema } from './schema';
import { aggregateTotalFees, customGasLevel } from './utils';

interface GasSelectSheetProps {
  isShowing: boolean;
  chainId: number;
  selectedGasLevel: GasPriceLevel;
  gasLevels: Tuple<GasPriceLevel, 3>;
  feeData: IFeeData | BasicFeeData;
  gasLimit: bigint;
  onGasLevelChange: (gas: GasPriceLevel) => void;
  onClose: VoidFunction;
}

export function GasSelectSheet(props: GasSelectSheetProps) {
  const {
    isShowing,
    chainId,
    selectedGasLevel,
    gasLevels,
    feeData,
    gasLimit,
    onGasLevelChange,
    onClose,
  } = props;

  return (
    <ActionSheet isShowing={isShowing} onClose={onClose} isDetached={true}>
      <ActionSheetHeader
        title='Edit Network Fee'
        onClose={onClose}
        type='detached'
      />
      <View className='flex flex-col px-4'>
        <View className='bg-card mb-4 flex flex-col overflow-hidden rounded-2xl'>
          <TransactionSpeedItem
            chainId={chainId}
            feeData={feeData}
            gasLimit={gasLimit}
            gasLevel={gasLevels[2]}
            icon={faFire}
            color={colors.failure}
            title='Fast'
            time={`~${gasLevels[2].estimatedTimeSeconds}s`}
            onPress={() => onGasLevelChange(gasLevels[2])}
          />
          <TransactionSpeedItem
            chainId={chainId}
            feeData={feeData}
            gasLimit={gasLimit}
            gasLevel={gasLevels[1]}
            icon={faClock}
            color={colors.approve}
            title='Normal'
            time={`~${gasLevels[1].estimatedTimeSeconds}s`}
            onPress={() => onGasLevelChange(gasLevels[1])}
          />
          <TransactionSpeedItem
            chainId={chainId}
            feeData={feeData}
            gasLimit={gasLimit}
            gasLevel={gasLevels[0]}
            icon={faTurtle}
            color={colors.success}
            title='Slow'
            time={`~${gasLevels[0].estimatedTimeSeconds}s`}
            onPress={() => onGasLevelChange(gasLevels[0])}
          />
        </View>
        <CustomSection
          chainId={chainId}
          selectedGasLevel={selectedGasLevel}
          gasLevels={gasLevels}
          gasLimit={gasLimit}
          onGasLevelChange={onGasLevelChange}
        />
      </View>
    </ActionSheet>
  );
}

function TransactionSpeedItem(props: {
  chainId: number;
  feeData: IFeeData | BasicFeeData;
  gasLimit: bigint;
  gasLevel: GasPriceLevel;
  title: string;
  time: string;
  icon: IconDefinition;
  color: string;
  onPress: VoidFunction;
}) {
  const {
    chainId,
    feeData,
    gasLimit,
    gasLevel,
    icon,
    color,
    title,
    time,
    onPress,
  } = props;

  const totalFees = aggregateTotalFees(feeData, gasLimit, gasLevel);
  const chainInfo = getChainInfo(chainId);

  return (
    <ListItem onPress={onPress}>
      <View className='flex flex-row items-center justify-between px-4 py-3'>
        <View className='flex flex-row space-x-3'>
          <View
            className='items-center justify-center rounded-full'
            style={{
              backgroundColor: opacity(color, 10),
              ...withSize(adjust(36)),
            }}
          >
            <FontAwesomeIcon icon={icon} color={color} size={adjust(20, 2)} />
          </View>
          <View className='flex flex-col'>
            <Text className='text-text-primary text-sm font-medium'>
              {title}
            </Text>
            <Text className='text-text-secondary text-xs font-normal'>
              {time}
            </Text>
          </View>
        </View>
        <View className='flex flex-1 flex-col items-end'>
          <View className='flex flex-row items-center space-x-2'>
            {chainId !== ChainId.Solana && (
              <View className='bg-card-highlight items-center justify-center rounded-full px-2 py-0.5'>
                <Text className='text-text-secondary text-xs font-normal'>
                  {`${formatCrypto(gasLevel.estimatedGasPrice, 9)} gwei`}
                </Text>
              </View>
            )}
            <Text className='text-text-primary text-sm font-medium'>
              {`${formatCryptoFloat(Math.abs(totalFees.totalFee))} ${
                chainInfo.nativeCurrency.symbol
              }`}
            </Text>
          </View>
          <Text className='text-text-secondary text-xs font-normal'>
            {formatMoney(Math.abs(totalFees.totalFeeUSD))}
          </Text>
        </View>
      </View>
    </ListItem>
  );
}

function CustomSection(props: {
  chainId: number;
  selectedGasLevel: GasPriceLevel;
  gasLevels: Tuple<GasPriceLevel, 3>;
  gasLimit: bigint;
  onGasLevelChange: (gas: GasPriceLevel) => void;
}) {
  const { chainId, selectedGasLevel, gasLevels, gasLimit, onGasLevelChange } =
    props;

  const handleGasLevelChange = (input: { fee: string }) => {
    const fee =
      chainId === ChainId.Solana
        ? ethers.parseUnits(input.fee, 15) / gasLimit
        : ethers.parseUnits(input.fee, 9);
    onGasLevelChange(customGasLevel(fee, chainId, gasLevels[0].gasLimit));
  };

  const formik = useFormik({
    initialValues: {
      fee:
        selectedGasLevel.level !== IGasLevel.Custom
          ? ''
          : chainId === ChainId.Solana
          ? // TODO: this has small rounding errors, we should eventually store the actual sol amount instead of the ul amount
            ethers.formatUnits(
              Math.round(
                parseFloat(
                  ethers.formatUnits(
                    selectedGasLevel.estimatedGasPrice * gasLimit,
                    6,
                  ),
                ),
              ),
              9,
            )
          : ethers.formatUnits(selectedGasLevel.estimatedGasPrice, 9),
    },
    onSubmit: handleGasLevelChange,
    validationSchema: CustomGasSchema,
  });

  return (
    <View className='bg-card space-y-4 rounded-2xl px-4 py-3'>
      <View className='flex flex-row items-center space-x-2'>
        <View
          className='bg-card-highlight items-center justify-center rounded-full'
          style={{
            ...withSize(adjust(24)),
          }}
        >
          <FontAwesomeIcon
            icon={faGear}
            color={colors.textSecondary}
            size={adjust(16, 2)}
          />
        </View>
        <View className='flex flex-col'>
          <Text className='text-text-primary text-sm font-medium'>
            {'Custom Fee'}
          </Text>
        </View>
      </View>
      <TextInput
        inputProps={{
          id: 'custom_gas',
          placeholder:
            chainId === ChainId.Solana
              ? 'Enter SOL amount'
              : 'Enter gwei amount',
          onChangeText: (text) =>
            formik.setFieldValue(
              'fee',
              validDecimalAmount(text, chainId === ChainId.Solana ? 9 : 6),
            ),
          inputMode: 'decimal',
          value: formik.values.fee,
        }}
        errorText={formik.errors.fee}
        filled={true}
        endAdornment={
          formik.values.fee === '' ? undefined : (
            <View className='pr-4'>
              <Text className='text-text-secondary text-sm font-normal'>
                {chainId === ChainId.Solana ? 'SOL' : 'gwei'}
              </Text>
            </View>
          )
        }
      />
      <TextButton
        text='Set'
        disabled={!!formik.errors.fee || formik.values.fee === ''}
        disabledColor={colors.cardHighlight}
        onPress={formik.submitForm}
      />
    </View>
  );
}
