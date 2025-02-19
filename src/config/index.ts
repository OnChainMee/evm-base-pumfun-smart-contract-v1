import dotenv from 'dotenv';

dotenv.config();

export const config = {
    ENTRYPOINT_ADDRESS: process.env.ENTRYPOINT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    RPC_URL: process.env.RPC_URL || "http://localhost:8545",
    PRIVATE_KEY: process.env.BUNDLER_PRIVATE_KEY || "",
    PORT: process.env.PORT || 3001,
    PAYMASTER_ADDRESS: process.env.PAYMASTER_ADDRESS || "",
    BATCH_TIMEOUT: 5 * 60 * 1000, // 5 minutes
    MAX_BATCH_SIZE: 10,
    DEFAULT_GAS_LIMIT: 3000000
}; 