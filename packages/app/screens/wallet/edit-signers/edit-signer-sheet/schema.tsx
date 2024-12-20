import { SafeInfoResponse } from '@safe-global/api-kit';
import { ethers } from 'ethers';
import * as Yup from 'yup';

export const AddSignerInputSchema = (safeInfo: SafeInfoResponse) =>
  Yup.object().shape({
    address: Yup.string()
      .required('please select an address')
      .test((value, ctx) => {
        try {
          if (!value) {
            return false;
          }
          ethers.getAddress(value);
          if (BigInt(value) === 1n || BigInt(value) === 0n) {
            return ctx.createError({
              message: 'This address cannot be a Safe signer',
            });
          }
          if (
            safeInfo.owners
              .map((owner) => owner.toLowerCase())
              .includes(value.toLowerCase())
          ) {
            return ctx.createError({
              message: 'This address is already an signer of the Safe',
            });
          }
          return true;
        } catch (err: any) {
          if (err.message.startsWith('bad address checksum')) {
            return ctx.createError({
              message: 'Invalid ethereum checksum',
            });
          } else {
            return ctx.createError({
              message: 'Invalid ethereum address',
            });
          }
        }
      }),
    threshold: Yup.number()
      .integer()
      .positive()
      .required()
      .test((value, ctx) => {
        if (!value) {
          return ctx.createError({
            message: 'Invalid threshold provided',
          });
        } else if (value > safeInfo.owners.length + 1) {
          return ctx.createError({
            message:
              'The new threshold must be no greater than the new total amount of signers',
          });
        } else {
          return true;
        }
      }),
  });

export const RemoveSignerInputSchema = (safeInfo: SafeInfoResponse) =>
  Yup.object().shape({
    threshold: Yup.number()
      .integer()
      .positive()
      .required()
      .test((value, ctx) => {
        if (!value) {
          return ctx.createError({
            message: 'Invalid threshold provided',
          });
        } else if (value > safeInfo.owners.length - 1) {
          return ctx.createError({
            message:
              'The new threshold must be no greater than the new total amount of signers',
          });
        } else {
          return true;
        }
      }),
  });

export const SwapSignerInputSchema = (safeInfo: SafeInfoResponse) =>
  Yup.object().shape({
    address: Yup.string()
      .required('please select an address')
      .test((value, ctx) => {
        try {
          if (!value) {
            return false;
          }
          ethers.getAddress(value);
          if (BigInt(value) === 1n || BigInt(value) === 0n) {
            return ctx.createError({
              message: 'This address cannot be a Safe signer',
            });
          }
          if (
            safeInfo.owners
              .map((owner) => owner.toLowerCase())
              .includes(value.toLowerCase())
          ) {
            return ctx.createError({
              message: 'This address is already a signer of the Safe',
            });
          }
          return true;
        } catch (err: any) {
          if (err.message.startsWith('bad address checksum')) {
            return ctx.createError({
              message: 'Invalid ethereum checksum',
            });
          } else {
            return ctx.createError({
              message: 'Invalid ethereum address',
            });
          }
        }
      }),
  });

export const ChangeThresholdInputSchema = (safeInfo: SafeInfoResponse) =>
  Yup.object().shape({
    threshold: Yup.number()
      .integer()
      .positive()
      .required()
      .test((value, ctx) => {
        if (!value) {
          return ctx.createError({
            message: 'Invalid threshold provided',
          });
        } else if (value > safeInfo.owners.length) {
          return ctx.createError({
            message:
              'The new threshold must be no greater than the total amount of signers',
          });
        } else {
          return true;
        }
      }),
  });
