const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config({ path: '../../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multi_agent_gov',
  user: process.env.DB_USER || 'agent_user',
  password: process.env.DB_PASSWORD || '1819',
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      message: 'API server is running',
      database: 'connected',
      time: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Check tables endpoint
app.get('/api/check-tables', async (req, res) => {
  try {
    const tables = ['transactions', 'agent_states', 'governance_log', 'simulation_runs'];
    const results = {};
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        results[table] = {
          exists: true,
          count: parseInt(result.rows[0].count)
        };
      } catch (err) {
        results[table] = {
          exists: false,
          error: err.message
        };
      }
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get columns for a table
app.get('/api/columns/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [table]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== CONFLICT PANEL ENDPOINTS ==========
app.get('/api/conflicts', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions ORDER BY id DESC LIMIT 100'
    );
    console.log(`✅ Fetched ${result.rows.length} conflicts`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching conflicts:', error.message);
    res.status(500).json({ 
      error: error.message,
      hint: 'Make sure the transactions table exists'
    });
  }
});

// ========== METRICS PANEL ENDPOINTS ==========
app.get('/api/metrics', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM agent_states ORDER BY id DESC LIMIT 1'
    );
    console.log(`✅ Fetched metrics: ${result.rows.length > 0 ? 'found' : 'empty'}`);
    res.json(result.rows[0] || {
      total_token_supply: 0,
      transaction_volume: 0,
      inflation_rate: 0,
      active_proposals: 0,
      total_agents: 0,
      active_agents: 0,
      average_reputation: 0,
      governance_participation: 0
    });
  } catch (error) {
    console.error('❌ Error fetching metrics:', error.message);
    res.status(500).json({ 
      error: error.message,
      hint: 'Make sure the agent_states table exists'
    });
  }
});

// ========== NETWORK GRAPH ENDPOINTS ==========
app.get('/api/agents', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions LIMIT 20'
    );
    console.log(`✅ Fetched ${result.rows.length} agents`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching agents:', error.message);
    res.status(500).json({ 
      error: error.message,
      hint: 'Make sure the transactions table exists'
    });
  }
});

// ========== RULE TIMELINE ENDPOINTS ==========
app.get('/api/rules', async (req, res) => {
  try {
    // Try different possible column names for timestamp
    let query = 'SELECT * FROM governance_log ORDER BY ';
    
    // Check if timestamp column exists, otherwise use created_at or id
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'governance_log' 
      AND column_name IN ('timestamp', 'created_at', 'time', 'datetime')
      LIMIT 1
    `);
    
    if (columnCheck.rows.length > 0) {
      query += `${columnCheck.rows[0].column_name} ASC LIMIT 100`;
    } else {
      query += 'id ASC LIMIT 100';
    }
    
    const result = await pool.query(query);
    console.log(`✅ Fetched ${result.rows.length} rules`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching rules:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: error.message,
      hint: 'Make sure the governance_log table exists'
    });
  }
});

// ========== VOTING INTERFACE ENDPOINTS ==========
app.get('/api/proposals', async (req, res) => {
  try {
    // Try different possible column names for timestamp
    let query = 'SELECT * FROM governance_log ORDER BY ';
    
    // Check if timestamp column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'governance_log' 
      AND column_name IN ('timestamp', 'created_at', 'time', 'datetime')
      LIMIT 1
    `);
    
    if (columnCheck.rows.length > 0) {
      query += `${columnCheck.rows[0].column_name} DESC LIMIT 100`;
    } else {
      query += 'id DESC LIMIT 100';
    }
    
    const result = await pool.query(query);
    console.log(`✅ Fetched ${result.rows.length} proposals`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching proposals:', error.message);
    res.status(500).json({ 
      error: error.message,
      hint: 'Make sure the governance_log table exists'
    });
  }
});

app.post('/api/vote', async (req, res) => {
  const { proposalId, voteType } = req.body;
  try {
    const column = `votes_${voteType}`;
    
    // Check if the column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'governance_log' 
      AND column_name = $1
    `, [column]);
    
    if (columnCheck.rows.length === 0) {
      throw new Error(`Column ${column} does not exist in governance_log table`);
    }
    
    await pool.query(
      `UPDATE governance_log SET ${column} = ${column} + 1 WHERE id = $1`,
      [proposalId]
    );
    
    const result = await pool.query(
      'SELECT * FROM governance_log WHERE id = $1',
      [proposalId]
    );
    console.log(`✅ Vote cast: ${voteType} for proposal ${proposalId}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error casting vote:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ========== SIMULATION CONTROL ENDPOINTS ==========
app.post('/api/simulation/start', async (req, res) => {
  const { speed, agent_count, transaction_rate, proposal_frequency, conflict_probability } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO simulation_runs (speed, agent_count, transaction_rate, proposal_frequency, conflict_probability)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [speed, agent_count, transaction_rate, proposal_frequency, conflict_probability]
    );
    console.log(`✅ Simulation started with ID: ${result.rows[0].id}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error starting simulation:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'multi_agent_gov'}`);
  console.log(`📍 Test the connection: http://localhost:${PORT}/api/health`);
  console.log(`📋 Check tables: http://localhost:${PORT}/api/check-tables`);
  console.log(`📋 Check governance_log columns: http://localhost:${PORT}/api/columns/governance_log`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
  });
});