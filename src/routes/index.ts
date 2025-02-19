import { Router } from 'express';
import { BundlerService } from '../services/bundler';
import { UserOperationService } from '../services/userOperation';
import { CreateUserOpParams } from '../types';

export function setupRoutes(bundlerService: BundlerService, userOpService: UserOperationService): Router {
    const router = Router();

    router.get('/health', async (req, res) => {
        try {
            const isHealthy = await bundlerService.checkHealth();
            if (isHealthy) {
                res.json({ status: 'ok' });
            } else {
                res.status(503).json({ status: 'error', message: 'Service unavailable' });
            }
        } catch (error: any) {
            res.status(503).json({ 
                status: 'error',
                message: 'Service unavailable',
                details: error.message 
            });
        }
    });

    router.post('/createUserOperation', async (req, res) => {
        try {
            const params: CreateUserOpParams = req.body;
            const userOp = await userOpService.createUserOperation(params);
            res.json({ success: true, userOp });
        } catch (error: any) {
            console.error('Error creating UserOperation:', error);
            res.status(500).json({ 
                error: 'Failed to create UserOperation',
                details: error.message 
            });
        }
    });

    router.post('/userOperation', async (req, res) => {
        try {
            const userOp = req.body;
            const batchId = req.query.batchId as string;
            
            const userOpHash = await bundlerService.addUserOperation(userOp, batchId);
            res.json({ success: true, message: 'UserOperation queued', userOpHash });
        } catch (error: any) {
            console.error('Error processing UserOperation:', error);
            res.status(500).json({ 
                error: 'Failed to process UserOperation',
                details: error.message 
            });
        }
    });

    router.post('/submitBatch', async (req, res) => {
        try {
            const { batchId } = req.body;
            if (!batchId) {
                return res.status(400).json({ error: 'batchId is required' });
            }

            const txHash = await bundlerService.submitBatch(batchId);
            res.json({ 
                success: true, 
                message: 'Batch processed',
                transactionHash: txHash 
            });
        } catch (error: any) {
            console.error('Error in submitBatch:', error);
            res.status(500).json({ 
                error: 'Failed to submit batch',
                details: error.message 
            });
        }
    });

    return router;
} 