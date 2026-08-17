const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

class AIServiceClient {
  constructor(baseUrl = AI_BASE_URL) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000
    });
  }

  async checkHealth() {
    try {
      const res = await this.client.get('/ai/health');
      return res.data;
    } catch (err) {
      return { status: 'offline', error: err.message };
    }
  }

  async getModelStatus() {
    try {
      const res = await this.client.get('/ai/model-status');
      return res.data;
    } catch (err) {
      console.warn(`[AI-Client] Could not fetch model status: ${err.message}`);
      return { models: [] };
    }
  }

  async processImage(filePath, options = {}) {
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));
      
      if (options.blankThreshold) {
        form.append('blank_threshold', options.blankThreshold);
      }
      if (options.highIdThreshold) {
        form.append('high_id_threshold', options.highIdThreshold);
      }
      if (options.lowIdThreshold) {
        form.append('low_id_threshold', options.lowIdThreshold);
      }

      const res = await this.client.post('/ai/process-image', form, {
        headers: form.getHeaders()
      });
      return res.data;
    } catch (err) {
      console.error(`[AI-Client] Error processing image ${filePath}: ${err.message}`);
      throw err;
    }
  }

  async syncReferenceEmbeddings(tigers) {
    try {
      const payload = {
        tigers: tigers.map(t => ({
          tigerId: t.tigerId,
          name: t.name,
          embedding: t.embeddings || []
        }))
      };
      const res = await this.client.post('/ai/sync-embeddings', payload);
      return res.data;
    } catch (err) {
      console.warn(`[AI-Client] Sync embeddings notice: ${err.message}`);
      return { status: 'error', message: err.message };
    }
  }
}

module.exports = new AIServiceClient();
