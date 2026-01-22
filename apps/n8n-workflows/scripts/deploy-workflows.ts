import 'dotenv/config';
import axios from 'axios';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const N8N_API_URL = process.env.N8N_API_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_URL || !N8N_API_KEY) {
  console.error('❌ N8N_API_URL or N8N_API_KEY not set');
  process.exit(1);
}

const workflows = [
  'morning-greeting.json',
  'user-profiling.json',
  'conversation-analysis.json'
];

async function deployWorkflow(workflowFile: string) {
  try {
    console.log(`📤 Deploying workflow: ${workflowFile}`);

    const workflowPath = join(__dirname, '../workflows', workflowFile);
    const workflowContent = readFileSync(workflowPath, 'utf-8');
    const workflow = JSON.parse(workflowContent);

    // 檢查工作流程是否已存在
    const existingWorkflows = await axios.get(`${N8N_API_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    const existing = existingWorkflows.data.data?.find(
      (w: any) => w.name === workflow.name
    );

    if (existing) {
      // 更新現有工作流程
      console.log(`🔄 Updating existing workflow: ${workflow.name} (ID: ${existing.id})`);
      
      const response = await axios.patch(
        `${N8N_API_URL}/workflows/${existing.id}`,
        workflow,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Updated workflow: ${workflow.name}`);
      return response.data;
    } else {
      // 建立新工作流程
      console.log(`📝 Creating new workflow: ${workflow.name}`);
      
      const response = await axios.post(
        `${N8N_API_URL}/workflows`,
        workflow,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Created workflow: ${workflow.name} (ID: ${response.data.id})`);
      return response.data;
    }
  } catch (error: any) {
    console.error(`❌ Failed to deploy ${workflowFile}:`, error.message);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting n8n workflow deployment...\n');

  let successCount = 0;
  let failCount = 0;

  for (const workflowFile of workflows) {
    try {
      await deployWorkflow(workflowFile);
      successCount++;
    } catch (error) {
      failCount++;
    }
    console.log(''); // 空行分隔
  }

  console.log('📊 Deployment Summary:');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📝 Total: ${workflows.length}`);

  if (failCount > 0) {
    console.error('\n⚠️ Some workflows failed to deploy');
    process.exit(1);
  } else {
    console.log('\n🎉 All workflows deployed successfully!');
  }
}

main().catch(error => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});
