import express from 'express';
import cors from 'cors';
import { config } from './config';
import { BundlerService } from './services/bundler';
import { UserOperationService } from './services/userOperation';
import { setupRoutes } from './routes';

const app = express();
app.use(cors());
app.use(express.json());

async function startServer() {
    try {
        // Initialize bundler service
        const bundlerService = new BundlerService();
        const services = await bundlerService.initializeProvider();

        // Initialize user operation service
        const userOpService = new UserOperationService(
            services.provider,
            services.entryPoint
        );

        // Setup routes
        app.use('/', setupRoutes(bundlerService, userOpService));

        // Start processing operations
        bundlerService.startProcessing();

        // Start server
        const PORT = config.PORT;
        app.listen(PORT, () => {
            console.log(`Bundler running on port ${PORT}`);
        });
    } catch (error: any) {
        console.error('Failed to start bundler:', error);
        process.exit(1);
    }
}

startServer(); 