import { ethers } from 'ethers';

export interface UserOperation {
    sender: string;
    nonce: string;
    initCode: string;
    callData: string;
    accountGasLimits: string;
    preVerificationGas: string;
    gasFees: string;
    paymasterAndData: string;
    signature: string;
}

export interface BatchGroup {
    ops: UserOperation[];
    timestamp: number;
}

export interface CreateUserOpParams {
    sender: string;
    callData: string;
    usePaymaster: boolean;
    nonceOffset?: number;
}

export interface BundlerServices {
    provider: ethers.providers.JsonRpcProvider;
    wallet: ethers.Wallet;
    entryPoint: ethers.Contract;
} 