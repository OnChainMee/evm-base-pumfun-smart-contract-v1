# 🚀 Sonic Bundler

Sonic Bundler is a **gas-optimized Ethereum bundler** that efficiently batches and processes **UserOperations** in an ERC-4337-compatible smart contract. It handles **pending operations**, groups transactions into **batches**, and submits them to the **EntryPoint contract**.

## 📌 Features

- 🏗 **Batch Processing** – Collects multiple user operations and submits them in batches.  
- 🔗 **ERC-4337 Account Abstraction** – Supports Ethereum's **EntryPoint contract** for smart accounts.  
- ⚡ **Optimized Gas Usage** – Reduces transaction costs with efficient batching.  
- ⏳ **Automated Processing** – Periodically processes pending operations and cleans up expired batches.  
- 🔄 **Health Check** – Monitors the blockchain connection and EntryPoint contract availability.  

---

## 📥 Installation

### **1️⃣ Clone the Repository**
```bash
git clone https://github.com/murathanje/sonic-bundler-bot.git
cd sonic-bundler-bot
```

### **2️⃣ Install Dependencies**
```bash
npm install
```

### **3️⃣ Configure Environment Variables**
Create a `.env` file and set up the required configurations:
```bash
RPC_URL=https://your_rpc_url
PRIVATE_KEY=your_private_key
ENTRYPOINT_ADDRESS=0xEntryPointAddress
DEFAULT_GAS_LIMIT=1000000
MAX_BATCH_SIZE=5
BATCH_TIMEOUT=60000
```

## 🚀 Usage

### Add a User Operation
```typescript
const userOp: UserOperation = { /* Define UserOperation */ };
const userOpHash = await bundlerService.addUserOperation(userOp);
console.log("User Operation added:", userOpHash);
```
Queues a UserOperation for processing.
Can optionally be added to a batch.

### Submit a Batch of Transactions
```typescript
const txHash = await bundlerService.submitBatch("batch123");
console.log("Batch submitted with Tx:", txHash);
```
Retrieves all pending operations in a batch and submits them to the EntryPoint contract.

### Start Automated Processing
```typescript
bundlerService.startProcessing();
```
Runs a loop to process transactions every 10 seconds and clean stale batches every 60 seconds.

### Check Service Health
```typescript
const isHealthy = await bundlerService.checkHealth();
console.log("Bundler service status:", isHealthy ? "✅ Online" : "❌ Offline");
```
Ensures the blockchain connection is active and the EntryPoint contract exists.

## 🛠 API Reference
`initializeProvider()`
Initializes the Ethereum provider, connects the wallet, and verifies the EntryPoint contract.

`addUserOperation(userOp: UserOperation, batchId?: string): Promise<string>`
Adds a UserOperation to the queue or a specific batch.

`submitBatch(batchId: string): Promise<string>`
Processes and submits all transactions in a given batch.

`processPendingOps(): Promise<void>`
Automatically processes pending operations in batches.

`cleanupOldBatches(): void`
Removes expired transaction batches to free memory.

`startProcessing(): void`
Starts an interval loop to process transactions and clean old batches.

`checkHealth(): Promise<boolean>`
Checks if the RPC connection and EntryPoint contract are working.

## 📞 Contact
If you have any questions, feel free to reach out:

📧 Telegram: [T-rustdev](https://github.com/T_rustdev)
