import { ethers } from 'ethers';
import { EntryPoint__factory } from '../abi/EntryPoint';
import { config } from '../config';
import { BundlerServices, UserOperation, BatchGroup } from '../types';

export class BundlerService {
    private provider!: ethers.providers.JsonRpcProvider;
    private wallet!: ethers.Wallet;
    private entryPoint!: ethers.Contract;
    private pendingOps: UserOperation[] = [];
    private batchGroups: Map<string, BatchGroup> = new Map();

    constructor() {
        this.initializeProvider = this.initializeProvider.bind(this);
        this.processPendingOps = this.processPendingOps.bind(this);
        this.cleanupOldBatches = this.cleanupOldBatches.bind(this);
    }

    async initializeProvider(): Promise<BundlerServices> {
        try {
            this.provider = new ethers.providers.JsonRpcProvider(config.RPC_URL);
            await this.provider.getNetwork();
            console.log('Successfully connected to network');
            
            this.wallet = new ethers.Wallet(config.PRIVATE_KEY, this.provider);
            this.entryPoint = EntryPoint__factory.connect(config.ENTRYPOINT_ADDRESS, this.wallet);
            
            const code = await this.provider.getCode(config.ENTRYPOINT_ADDRESS);
            if (code === '0x') {
                throw new Error('EntryPoint contract not deployed at specified address');
            }
            console.log('Successfully connected to EntryPoint contract');

            return {
                provider: this.provider,
                wallet: this.wallet,
                entryPoint: this.entryPoint
            };
        } catch (error: any) {
            console.error('Failed to initialize provider:', error);
            throw error;
        }
    }

    async addUserOperation(userOp: UserOperation, batchId?: string): Promise<string> {
        try {
            const userOpHash = await this.entryPoint.getUserOpHash(userOp);
            
            // Validate by simulating handleOps
            await this.provider.call({
                to: config.ENTRYPOINT_ADDRESS,
                data: this.entryPoint.interface.encodeFunctionData('handleOps', [[userOp], ethers.constants.AddressZero])
            });

            if (batchId) {
                let group = this.batchGroups.get(batchId);
                if (!group) {
                    group = { ops: [], timestamp: Date.now() };
                    this.batchGroups.set(batchId, group);
                }
                group.ops.push(userOp);
                console.log(`Added operation to batch ${batchId}. Current size: ${group.ops.length}`);
            } else {
                this.pendingOps.push(userOp);
                console.log('UserOperation queued. Queue size:', this.pendingOps.length);
            }

            return userOpHash;
        } catch (error: any) {
            console.error('Error adding UserOperation:', error);
            throw error;
        }
    }

    async submitBatch(batchId: string): Promise<string> {
        const group = this.batchGroups.get(batchId);
        if (!group) {
            throw new Error('Batch not found');
        }

        try {
            const tx = await this.entryPoint.handleOps(group.ops, this.wallet.address, {
                gasLimit: config.DEFAULT_GAS_LIMIT
            });
            const receipt = await tx.wait();
            
            this.batchGroups.delete(batchId);
            return receipt.transactionHash;
        } catch (error: any) {
            console.error('Error processing batch:', error);
            throw error;
        }
    }

    async processPendingOps(): Promise<void> {
        if (this.pendingOps.length === 0) return;

        try {
            const batch = this.pendingOps.splice(0, config.MAX_BATCH_SIZE);
            console.log('Processing batch of size:', batch.length);
            
            const tx = await this.entryPoint.handleOps(batch, this.wallet.address, {
                gasLimit: config.DEFAULT_GAS_LIMIT
            });
            const receipt = await tx.wait();
            console.log('Batch processed:', receipt.transactionHash);
        } catch (error: any) {
            console.error('Error processing batch:', error);
            this.pendingOps.unshift(...this.pendingOps);
        }
    }

    cleanupOldBatches(): void {
        const now = Date.now();
        for (const [batchId, group] of this.batchGroups.entries()) {
            if (now - group.timestamp > config.BATCH_TIMEOUT) {
                console.log(`Cleaning up stale batch ${batchId}`);
                this.batchGroups.delete(batchId);
            }
        }
    }

    startProcessing(): void {
        setInterval(this.processPendingOps, 10000);
        setInterval(this.cleanupOldBatches, 60000);
    }

    async checkHealth(): Promise<boolean> {
        try {
            await this.provider.getNetwork();
            const code = await this.provider.getCode(config.ENTRYPOINT_ADDRESS);
            return code !== '0x';
        } catch {
            return false;
        }
    }
} 