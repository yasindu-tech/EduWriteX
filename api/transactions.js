// Vercel Serverless Function for handling transactions
import fs from 'fs';
import path from 'path';

// Path to the JSON file (in Vercel, this will be in the tmp directory)
const getDataPath = () => {
  if (process.env.VERCEL) {
    // In Vercel environment, use /tmp directory
    return '/tmp/eduwritex_transactions.json';
  } else {
    // Local development
    return path.join(process.cwd(), 'data', 'transactions.json');
  }
};

// Ensure data directory exists (for local development)
const ensureDataDir = () => {
  if (!process.env.VERCEL) {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }
};

// Read transactions from JSON file
const readTransactions = () => {
  try {
    const filePath = getDataPath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading transactions:', error);
    return [];
  }
};

// Write transactions to JSON file
const writeTransactions = (transactions) => {
  try {
    ensureDataDir();
    const filePath = getDataPath();
    fs.writeFileSync(filePath, JSON.stringify(transactions, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing transactions:', error);
    return false;
  }
};

// Main API handler
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get all transactions
        const transactions = readTransactions();
        res.status(200).json({
          success: true,
          data: transactions,
          count: transactions.length
        });
        break;

      case 'POST':
        // Add new transaction
        const { transaction } = req.body;
        
        if (!transaction) {
          return res.status(400).json({
            success: false,
            error: 'Transaction data is required'
          });
        }

        const existingTransactions = readTransactions();
        const newTransaction = {
          ...transaction,
          id: Date.now().toString(),
          timestamp: new Date().toISOString()
        };
        
        existingTransactions.push(newTransaction);
        
        if (writeTransactions(existingTransactions)) {
          res.status(201).json({
            success: true,
            data: newTransaction,
            message: 'Transaction saved successfully'
          });
        } else {
          res.status(500).json({
            success: false,
            error: 'Failed to save transaction'
          });
        }
        break;

      case 'DELETE':
        // Clear all transactions
        if (writeTransactions([])) {
          res.status(200).json({
            success: true,
            message: 'All transactions cleared successfully'
          });
        } else {
          res.status(500).json({
            success: false,
            error: 'Failed to clear transactions'
          });
        }
        break;

      default:
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
