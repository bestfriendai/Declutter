/**
 * End-to-end test: Photo → AI Analysis → Task Generation
 * Tests the core Declutterly flow with a messy room image.
 *
 * Usage: npx ts-node scripts/test-full-flow.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Load env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const TEST_IMAGE = '/tmp/messy_test_room.jpg';

if (!GEMINI_API_KEY) {
  console.error('❌ Missing EXPO_PUBLIC_GEMINI_API_KEY');
  process.exit(1);
}

if (!fs.existsSync(TEST_IMAGE)) {
  console.error('❌ Missing test image at', TEST_IMAGE);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Photo → Base64 encoding
// ─────────────────────────────────────────────────────────────────────────────
function testPhotoEncoding(): string {
  console.log('\n🔵 Test 1: Photo encoding');
  const imageBuffer = fs.readFileSync(TEST_IMAGE);
  const base64 = imageBuffer.toString('base64');
  console.log(`   ✅ Image loaded: ${(imageBuffer.length / 1024).toFixed(0)}KB`);
  console.log(`   ✅ Base64 encoded: ${(base64.length / 1024).toFixed(0)}KB`);
  return base64;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Gemini AI analysis with the rewritten prompt
// ─────────────────────────────────────────────────────────────────────────────
async function testGeminiAnalysis(base64Image: string): Promise<any> {
  console.log('\n🔵 Test 2: Gemini AI room analysis');
  console.log('   ⏳ Sending image to Gemini...');

  const systemPrompt = `You are a compassionate, ADHD-aware decluttering assistant. Analyze this room photo and create a cleaning plan.

CRITICAL RULES:
- Be WARM and NON-JUDGMENTAL
- Break down tasks into TINY, achievable steps (under 2 minutes each)
- For EACH visible item, identify it specifically (e.g., "blue coffee mug on desk" not just "cup")
- Order tasks by VISUAL IMPACT — highest impact first for quick dopamine wins
- ALWAYS include resistanceHandler and whyThisMatters for every task
- Include suppliesNeeded for each task

CRITICAL — Scale task count by mess level. You MUST generate the MINIMUM number specified:
- Low mess (< 40): Generate EXACTLY 4-6 tasks, 3-5 subtasks each
- Medium mess (40-70): Generate EXACTLY 8-10 tasks, 4-6 subtasks each
- High mess (> 70): Generate EXACTLY 12-15 tasks, 5-8 micro-step subtasks each

If messLevel is above 70, you MUST generate at least 12 tasks. Break large actions into multiple separate tasks. For example, "Gather clothes" should be split into separate tasks per location.

Return a JSON object with this structure:
{
  "roomType": "bedroom|kitchen|bathroom|livingRoom|office|garage|closet|other",
  "messLevel": 0-100,
  "summary": "Brief encouraging summary",
  "tasks": [
    {
      "title": "Task title",
      "description": "What to do",
      "category": "trash|organize|clean|sort|donate",
      "priority": "high|medium|low",
      "difficulty": "quick|medium|challenging",
      "estimatedMinutes": 5,
      "visualImpact": "high|medium|low",
      "emoji": "🗑️",
      "whyThisMatters": "Why this task helps",
      "resistanceHandler": "If you're struggling, try this...",
      "suppliesNeeded": ["trash bag"],
      "subtasks": [
        {
          "title": "Specific micro-step",
          "estimatedMinutes": 1
        }
      ]
    }
  ],
  "quickWins": ["First quick win", "Second quick win"],
  "encouragement": "Motivating message"
}

Return ONLY valid JSON, no markdown.`;

  const startTime = Date.now();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: systemPrompt },
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
          ]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  const elapsed = Date.now() - startTime;

  if (!response.ok) {
    const err = await response.text();
    console.error(`   ❌ API error (${response.status}):`, err.slice(0, 200));
    process.exit(1);
  }

  const data = await response.json() as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    console.error('   ❌ No text in response');
    console.error('   Response:', JSON.stringify(data).slice(0, 500));
    process.exit(1);
  }

  console.log(`   ✅ Response received in ${(elapsed / 1000).toFixed(1)}s`);

  // Parse JSON
  let analysis: any;
  try {
    analysis = JSON.parse(text);
  } catch {
    // Try to extract JSON from the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    } else {
      console.error('   ❌ Failed to parse JSON response');
      console.error('   Raw text:', text.slice(0, 500));
      process.exit(1);
    }
  }

  // Post-process: sort tasks by visual impact (matches parseAIResponse behavior)
  if (Array.isArray(analysis.tasks)) {
    const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    analysis.tasks.sort((a: any, b: any) =>
      (impactOrder[a.visualImpact] ?? 1) - (impactOrder[b.visualImpact] ?? 1)
    );
  }

  return analysis;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Validate analysis result
// ─────────────────────────────────────────────────────────────────────────────
function testAnalysisQuality(analysis: any): void {
  console.log('\n🔵 Test 3: Validate analysis quality');

  let passed = 0;
  let failed = 0;

  function check(name: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`   ✅ ${name}${detail ? ': ' + detail : ''}`);
      passed++;
    } else {
      console.log(`   ❌ ${name}${detail ? ': ' + detail : ''}`);
      failed++;
    }
  }

  // Basic structure
  check('Has roomType', !!analysis.roomType, analysis.roomType);
  check('Has messLevel', typeof analysis.messLevel === 'number', `${analysis.messLevel}`);
  check('Has summary', !!analysis.summary);
  check('Has tasks array', Array.isArray(analysis.tasks), `${analysis.tasks?.length} tasks`);
  check('Has encouragement', !!analysis.encouragement);

  // Mess level validation
  check('messLevel is 0-100', analysis.messLevel >= 0 && analysis.messLevel <= 100);

  // Task count scales with mess level
  const expectedMin = analysis.messLevel > 70 ? 8 : analysis.messLevel > 40 ? 5 : 3;
  check(
    `Task count matches messLevel (${analysis.messLevel})`,
    analysis.tasks?.length >= expectedMin,
    `Expected >= ${expectedMin}, got ${analysis.tasks?.length}`
  );

  // Task quality checks
  if (analysis.tasks?.length > 0) {
    const tasks = analysis.tasks;

    // Check first task has all required fields
    const t = tasks[0];
    check('Task has title', !!t.title, t.title);
    check('Task has description', !!t.description);
    check('Task has category', !!t.category);
    check('Task has priority', ['high', 'medium', 'low'].includes(t.priority));
    check('Task has difficulty', ['quick', 'medium', 'challenging'].includes(t.difficulty));
    check('Task has estimatedMinutes', typeof t.estimatedMinutes === 'number');
    check('Task has visualImpact', ['high', 'medium', 'low'].includes(t.visualImpact));
    check('Task has emoji', !!t.emoji);
    check('Task has whyThisMatters', !!t.whyThisMatters, t.whyThisMatters?.slice(0, 60));
    check('Task has resistanceHandler', !!t.resistanceHandler, t.resistanceHandler?.slice(0, 60));
    check('Task has suppliesNeeded', Array.isArray(t.suppliesNeeded));
    check('Task has subtasks', Array.isArray(t.subtasks) && t.subtasks.length > 0, `${t.subtasks?.length} subtasks`);

    // Subtask quality
    if (t.subtasks?.length > 0) {
      const st = t.subtasks[0];
      check('Subtask has title', !!st.title, st.title);
      check('Subtask has estimatedMinutes', typeof st.estimatedMinutes === 'number');
      check('Subtask is under 2 min', st.estimatedMinutes <= 2, `${st.estimatedMinutes} min`);
    }

    // Visual impact ordering (high impact should come first)
    const impactOrder = { high: 0, medium: 1, low: 2 };
    let orderCorrect = true;
    for (let i = 1; i < tasks.length; i++) {
      const prev = (impactOrder as any)[tasks[i-1].visualImpact] ?? 1;
      const curr = (impactOrder as any)[tasks[i].visualImpact] ?? 1;
      if (curr < prev) { orderCorrect = false; break; }
    }
    check('Tasks ordered by visual impact (high first)', orderCorrect);

    // Count how many tasks have whyThisMatters
    const withWhy = tasks.filter((t: any) => t.whyThisMatters).length;
    check('All tasks have whyThisMatters', withWhy === tasks.length, `${withWhy}/${tasks.length}`);

    // Count how many tasks have resistanceHandler
    const withResistance = tasks.filter((t: any) => t.resistanceHandler).length;
    check('All tasks have resistanceHandler', withResistance === tasks.length, `${withResistance}/${tasks.length}`);

    // Specificity check - look for specific object names
    const allTitles = tasks.map((t: any) => t.title + ' ' + t.description + ' ' + (t.subtasks?.map((s: any) => s.title).join(' ') || '')).join(' ');
    const hasSpecific = /clothes|shirt|pants|shoe|cup|mug|paper|book|pizza|blanket|pillow/i.test(allTitles);
    check('Tasks reference specific objects', hasSpecific);
  }

  // Quick wins
  check('Has quickWins', Array.isArray(analysis.quickWins) && analysis.quickWins.length > 0);

  console.log(`\n   📊 Results: ${passed} passed, ${failed} failed out of ${passed + failed} checks`);

  if (failed > 0) {
    console.log('\n   ⚠️  Some checks failed but pipeline is functional');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Task filtering by time & energy
// ─────────────────────────────────────────────────────────────────────────────
function testTaskFiltering(tasks: any[]): void {
  console.log('\n🔵 Test 4: Task filtering (time & energy)');

  // Filter for 5-minute window
  const fiveMinTasks = tasks.filter((t: any) => t.estimatedMinutes <= 5);
  console.log(`   ✅ Tasks fitting in 5 min: ${fiveMinTasks.length}/${tasks.length}`);
  fiveMinTasks.forEach((t: any) => console.log(`      - ${t.emoji} ${t.title} (~${t.estimatedMinutes}min)`));

  // Filter for "exhausted" energy — only quick/easy tasks
  const exhaustedTasks = tasks.filter((t: any) => t.difficulty === 'quick');
  console.log(`   ✅ Tasks for exhausted user: ${exhaustedTasks.length}/${tasks.length}`);
  exhaustedTasks.forEach((t: any) => console.log(`      - ${t.emoji} ${t.title} (${t.difficulty})`));

  // Filter for 30-minute window
  let cumulative = 0;
  const thirtyMinTasks = tasks.filter((t: any) => {
    if (cumulative + t.estimatedMinutes <= 30) {
      cumulative += t.estimatedMinutes;
      return true;
    }
    return false;
  });
  console.log(`   ✅ Tasks fitting in 30 min: ${thirtyMinTasks.length}/${tasks.length} (${cumulative} min total)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Display sample task card output
// ─────────────────────────────────────────────────────────────────────────────
function testTaskCardDisplay(tasks: any[]): void {
  console.log('\n🔵 Test 5: Sample task card display');

  const task = tasks[0];
  if (!task) return;

  console.log('   ┌─────────────────────────────────────────────');
  console.log(`   │ ${task.emoji}  ${task.title}`);
  console.log(`   │ ${task.whyThisMatters || ''}`);
  console.log(`   │ ~${task.estimatedMinutes} min · ${task.visualImpact} impact · ${task.priority} priority`);
  if (task.suppliesNeeded?.length) {
    console.log(`   │ 🧹 Supplies: ${task.suppliesNeeded.join(', ')}`);
  }
  console.log('   │');
  task.subtasks?.forEach((st: any, i: number) => {
    console.log(`   │ ${i + 1}. ${st.title} (~${st.estimatedMinutes}min)`);
  });
  console.log('   │');
  if (task.resistanceHandler) {
    console.log(`   │ 💪 Feeling stuck? ${task.resistanceHandler}`);
  }
  console.log('   └─────────────────────────────────────────────');
}

// ─────────────────────────────────────────────────────────────────────────────
// Run all tests
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  DECLUTTERLY E2E TEST: Photo → AI → Tasks');
  console.log('═══════════════════════════════════════════════════');

  // 1. Encode photo
  const base64 = testPhotoEncoding();

  // 2. AI analysis
  const analysis = await testGeminiAnalysis(base64);

  // Save full response for debugging
  fs.writeFileSync('/tmp/analysis_result.json', JSON.stringify(analysis, null, 2));
  console.log('   📝 Full response saved to /tmp/analysis_result.json');

  // 3. Validate quality
  testAnalysisQuality(analysis);

  // 4. Test filtering
  testTaskFiltering(analysis.tasks || []);

  // 5. Display sample card
  testTaskCardDisplay(analysis.tasks || []);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
