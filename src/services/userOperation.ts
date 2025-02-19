import { ethers } from 'ethers';
import { config } from '../config';
import { CreateUserOpParams, UserOperation } from '../types';

export class UserOperationService {
    constructor(
        private provider: ethers.providers.JsonRpcProvider,
        private entryPoint: ethers.Contract
    ) {}

    private async estimateVerificationGas(userOp: UserOperation): Promise<ethers.BigNumber> {
        try {
            const baseEstimate = await this.provider.estimateGas({
                from: this.entryPoint.address,
                to: userOp.sender,
                data: userOp.callData
            });

            if (!userOp.paymasterAndData || userOp.paymasterAndData === '0x') {
                return ethers.BigNumber.from(180000);
            }

            return baseEstimate.mul(130).div(100);
        } catch (error) {
            console.error('Error estimating verification gas:', error);
            return ethers.BigNumber.from(180000);
        }
    }

    private async estimateCallGas(userOp: UserOperation): Promise<ethers.BigNumber> {
        try {
            const gasEstimate = await this.provider.estimateGas({
                from: this.entryPoint.address,
                to: userOp.sender,
                data: userOp.callData
            });

            if (!userOp.paymasterAndData || userOp.paymasterAndData === '0x') {
                return gasEstimate.mul(110).div(100);
            }

            return gasEstimate.mul(130).div(100);
        } catch (error) {
            console.error('Error estimating call gas:', error);
            return ethers.BigNumber.from(100000);
        }
    }

    async createUserOperation(params: CreateUserOpParams): Promise<UserOperation> {
        try {
            // Get the nonce
            const nonceResponse = await this.entryPoint.getNonce(params.sender, 0);
            const nonce = ethers.BigNumber.from(nonceResponse).add(params.nonceOffset || 0);

            // Calculate preVerificationGas
            const preVerificationGas = params.usePaymaster ? 
                ethers.BigNumber.from(200000) : 
                ethers.BigNumber.from(100000);

            // Create temporary UserOperation for gas estimation
            const tempUserOp: UserOperation = {
                sender: params.sender,
                nonce: ethers.utils.hexZeroPad(nonce.toHexString(), 32),
                initCode: '0x',
                callData: params.callData,
                accountGasLimits: '0x',
                preVerificationGas: ethers.utils.hexZeroPad(preVerificationGas.toHexString(), 32),
                gasFees: '0x',
                paymasterAndData: '0x',
                signature: '0x'
            };

            // Estimate gas limits
            const verificationGasLimit = await this.estimateVerificationGas(tempUserOp);
            const callGasLimit = await this.estimateCallGas(tempUserOp);
            
            // Pack gas limits into bytes32
            const accountGasLimits = ethers.utils.hexZeroPad(
                ethers.utils.hexConcat([
                    ethers.utils.hexZeroPad(verificationGasLimit.toHexString(), 16),
                    ethers.utils.hexZeroPad(callGasLimit.toHexString(), 16)
                ]),
                32
            );

            // Get gas fees
            const feeData = await this.provider.getFeeData();
            const maxFeePerGas = feeData.maxFeePerGas || ethers.utils.parseUnits('20', 'gwei');
            const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.utils.parseUnits('2', 'gwei');
            
            // Pack gas fees into bytes32
            const gasFees = ethers.utils.hexZeroPad(
                ethers.utils.hexConcat([
                    ethers.utils.hexZeroPad(maxFeePerGas.toHexString(), 16),
                    ethers.utils.hexZeroPad(maxPriorityFeePerGas.toHexString(), 16)
                ]),
                32
            );

            // Create final UserOperation
            const userOp: UserOperation = {
                ...tempUserOp,
                accountGasLimits,
                gasFees
            };

            // Handle paymaster if enabled
            if (params.usePaymaster) {
                userOp.paymasterAndData = ethers.utils.hexConcat([
                    config.PAYMASTER_ADDRESS,
                    ethers.utils.hexZeroPad(ethers.utils.hexlify(3e6), 16),
                    ethers.utils.hexZeroPad(ethers.utils.hexlify(1e6), 16),
                    ethers.constants.HashZero
                ]);
            }

            return userOp;
        } catch (error: any) {
            console.error('Error creating UserOperation:', error);
            throw error;
        }
    }
} 