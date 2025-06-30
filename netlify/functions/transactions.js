const fs = require('fs');
const path = require('path');

// Path to store transactions data
const dataPath = path.join('/tmp', 'transactions.json');

// Helper function to read transactions
function readTransactions() {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading transactions:', error);
    return [];
  }
}

// Helper function to write transactions
function writeTransactions(transactions) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(transactions, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing transactions:', error);
    return false;
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    switch (event.httpMethod) {
      case 'GET':
        // Get all transactions
        const transactions = readTransactions();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: transactions
          })
        };

      case 'POST':
        // Add new transaction
        const { transaction } = JSON.parse(event.body);
        
        if (!transaction) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Transaction data is required'
            })
          };
        }

        const existingTransactions = readTransactions();
        const newTransaction = {
          ...transaction,
          id: Date.now().toString(),
          timestamp: new Date().toISOString()
        };
        
        existingTransactions.push(newTransaction);
        
        if (writeTransactions(existingTransactions)) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: newTransaction
            })
          };
        } else {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Failed to save transaction'
            })
          };
        }

      case 'DELETE':
        // Clear all transactions
        if (writeTransactions([])) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'All transactions cleared'
            })
          };
        } else {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Failed to clear transactions'
            })
          };
        }

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Method not allowed'
          })
        };
    }
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
};
