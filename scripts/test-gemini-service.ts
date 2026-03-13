#!/usr/bin/env npx ts-node

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash-preview-05-20';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function testGeminiConnection(): Promise<void> {
  console.log('\n=== Gemini Service Test ===\n');
  
  console.log('Configuration:');
  console.log(`  API Key: ${API_KEY ? `${API_KEY.slice(0, 8)}...` : '(not set)'}`);
  console.log(`  Model: ${GEMINI_MODEL}`);
  console.log(`  Endpoint: ${GEMINI_API_URL}`);
  console.log('');

  if (!API_KEY) {
    console.error('ERROR: EXPO_PUBLIC_GEMINI_API_KEY not set');
    console.log('Set it in your .env file or export it:');
    console.log('  export EXPO_PUBLIC_GEMINI_API_KEY=your_key_here');
    process.exit(1);
  }

  console.log('Testing API connection...\n');

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: 'Say "Hello from Gemini 2.5 Flash!" in exactly those words.' }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 50,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      process.exit(1);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log('SUCCESS! API Response:');
    console.log(`  Response: "${content}"`);
    console.log(`  Usage: ${JSON.stringify(data.usageMetadata)}`);
    console.log('\nGemini integration is working correctly!');
    
  } catch (error) {
    console.error('Connection Error:', error);
    process.exit(1);
  }
}

async function testVisionCapability(): Promise<void> {
  console.log('\n=== Testing Vision Capability ===\n');

  if (!API_KEY) {
    console.log('Skipping vision test - no API key');
    return;
  }

  const TEST_IMAGE_BASE64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==';

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: TEST_IMAGE_BASE64,
                },
              },
              { text: 'What do you see in this image? Just say "I can see an image" if you received it.' }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 100,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Vision API Error (${response.status}):`, errorText);
      return;
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log('Vision test response:', content);
    console.log('\nVision capability is working!');
    
  } catch (error) {
    console.error('Vision test error:', error);
  }
}

async function main() {
  await testGeminiConnection();
  await testVisionCapability();
  console.log('\n=== All tests complete ===\n');
}

main().catch(console.error);
