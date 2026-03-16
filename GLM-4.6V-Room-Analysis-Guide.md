# Z.AI GLM-4.6V Room Analysis & Task Breakdown Guide

A comprehensive guide for using GLM-4.6V vision language model to analyze rooms and break down cleaning/organization tasks.

---

## Table of Contents

1. [Overview](#overview)
2. [Why GLM-4.6V for Room Analysis](#why-glm-46v-for-room-analysis)
3. [Getting Started](#getting-started)
4. [API Reference](#api-reference)
5. [Room Analysis Prompts](#room-analysis-prompts)
6. [Task Breakdown Strategies](#task-breakdown-strategies)
7. [Implementation Examples](#implementation-examples)
8. [Best Practices](#best-practices)
9. [Pricing](#pricing)

---

## Overview

GLM-4.6V is Z.AI's flagship vision-language model with:
- **128K token context window** - process entire room photo sets in one request
- **Native multimodal tool calling** - bridges visual perception with executable actions
- **Full object detection** - identify and locate objects with bounding box coordinates
- **Multi-image processing** - analyze multiple room angles simultaneously
- **Thinking mode** - transparent reasoning for complex analysis

### Model Variants

| Model | Use Case | Input | Context | Pricing |
|-------|----------|-------|---------|---------|
| `glm-4.6v` | Flagship, highest performance | Video/Image/Text/File | 128K | $0.30/M input, $0.90/M output |
| `glm-4.6v-flashx` | Lightweight, high-speed | Video/Image/Text/File | 128K | Lower cost |
| `glm-4.6v-flash` | Completely free | Video/Image/Text/File | 128K | **Free** |

---

## Why GLM-4.6V for Room Analysis

### Key Capabilities

1. **Full Object Detection**
   - Identifies all objects in a room
   - Returns bounding box coordinates `[xmin, ymin, xmax, ymax]`
   - Labels objects with categories

2. **Multi-Image Reasoning**
   - Understands relationships across multiple room photos
   - Integrates information from different angles
   - No manual context needed per image

3. **Native Tool Calling**
   - Can trigger downstream actions based on visual analysis
   - Perfect for task management integration
   - Supports structured JSON output

4. **Long-Context Understanding**
   - Process ~150 pages of documents or 200 images
   - Analyze an entire home's worth of room photos
   - Retain details across the full context

---

## Getting Started

### Prerequisites

1. Get an API key from [Z.AI Console](https://z.ai/manage-apikey/apikey-list)
2. Install the SDK:

```bash
# Python
pip install zai-sdk

# Verify
python -c "import zai; print(zai.__version__)"
```

### Quick Test

```python
from zai import ZaiClient

client = ZaiClient(api_key="your-api-key")

response = client.chat.completions.create(
    model="glm-4.6v",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://example.com/room-photo.jpg"
                    }
                },
                {
                    "type": "text",
                    "text": "Analyze this room and identify areas that need organization."
                }
            ]
        }
    ]
)

print(response.choices[0].message.content)
```

---

## API Reference

### Endpoint

```
POST https://api.z.ai/api/paas/v4/chat/completions
```

### Headers

```
Authorization: Bearer your-api-key
Content-Type: application/json
```

### Request Body Structure

```json
{
    "model": "glm-4.6v",
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://example.com/image.jpg"
                    }
                },
                {
                    "type": "text",
                    "text": "Your prompt here"
                }
            ]
        }
    ],
    "thinking": {
        "type": "enabled"
    },
    "stream": false
}
```

### Image Input Options

```json
// URL-based
{
    "type": "image_url",
    "image_url": {
        "url": "https://example.com/room.jpg"
    }
}

// Base64-encoded
{
    "type": "image_url",
    "image_url": {
        "url": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    }
}
```

### Supported Formats
- **Image types**: `jpg`, `jpeg`, `png`
- **Max size**: 20MB per image
- **Max images**: No limit

---

## Room Analysis Prompts

### Basic Room Analysis

```python
ROOM_ANALYSIS_PROMPT = """
Analyze this room photo and provide:

1. **Room Type**: Identify what type of room this is
2. **Current State**: Rate cleanliness/organization (1-10)
3. **Problem Areas**: List specific areas needing attention
4. **Objects Identified**: List all visible objects
5. **Clutter Hotspots**: Identify areas with clutter accumulation

Respond in JSON format.
"""
```

### Detailed Object Detection with Coordinates

```python
OBJECT_DETECTION_PROMPT = """
Identify ALL objects in this room. Return results in valid JSON format.

The result should be a list where each element is a dictionary with:
- "label": object name with category
- "bbox_2d": bounding box coordinates [xmin, ymin, xmax, ymax]
- "condition": assessment of object condition (clean/dirty/damaged/misplaced)
- "priority": declutter priority (high/medium/low/keep)

Example format:
[
    {"label": "clothes-pile-1", "bbox_2d": [100, 200, 300, 400], "condition": "misplaced", "priority": "high"},
    {"label": "bookshelf-1", "bbox_2d": [500, 100, 700, 600], "condition": "clean", "priority": "keep"}
]
"""
```

### Task Breakdown Prompt

```python
TASK_BREAKDOWN_PROMPT = """
Based on this room photo, create a detailed cleaning and organization task list.

For each task provide:
1. **Task Name**: Clear, actionable task name
2. **Location**: Where in the room (use coordinates if helpful)
3. **Duration**: Estimated time in minutes
4. **Difficulty**: Easy/Medium/Hard
5. **Category**: Declutter/Clean/Organize/Repair
6. **Dependencies**: Tasks that must be done first
7. **Supplies Needed**: Required cleaning supplies or tools

Order tasks by:
- Quick wins first (< 5 min, visible impact)
- Then systematic clearing
- Deep cleaning last

Return as JSON array.
"""
```

### Multi-Room Analysis

```python
MULTI_ROOM_PROMPT = """
I'm sharing photos of multiple rooms in my home. Analyze each room and:

1. Identify each room type
2. Rate organization level (1-10)
3. List top 3 priorities per room
4. Create a prioritized whole-home task list
5. Estimate total time to declutter

Consider:
- Start with highest-impact, lowest-effort tasks
- Group similar tasks across rooms
- Identify items that could be relocated between rooms

Return structured JSON with per-room analysis and unified task list.
"""
```

---

## Task Breakdown Strategies

### Strategy 1: Zone-Based Analysis

```python
def analyze_room_by_zones(client, image_url):
    """Break room into zones and analyze each."""
    
    prompt = """
    Divide this room into logical zones and analyze each:
    
    1. Identify 4-6 distinct zones (e.g., desk area, closet, floor space)
    2. For each zone:
       - Name and location
       - Current state (1-10)
       - Items present
       - Tasks needed
       - Time estimate
    
    Return as JSON with zone-by-zone breakdown.
    """
    
    response = client.chat.completions.create(
        model="glm-4.6v",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": image_url}},
                    {"type": "text", "text": prompt}
                ]
            }
        ],
        thinking={"type": "enabled"}
    )
    
    return response.choices[0].message.content
```

### Strategy 2: Category-Based Detection

```python
def categorize_room_items(client, image_url):
    """Detect and categorize all items for decluttering."""
    
    prompt = """
    Identify all items in this room and categorize them:
    
    Categories:
    - KEEP: Essential, well-placed items
    - RELOCATE: Items belonging elsewhere
    - DONATE: Usable but not needed
    - TRASH: Damaged or garbage
    - STORE: Seasonal or rarely used
    
    For each item provide:
    {
        "item": "description",
        "bbox_2d": [x1, y1, x2, y2],
        "category": "KEEP|RELOCATE|DONATE|TRASH|STORE",
        "reason": "why this categorization",
        "action": "specific next step"
    }
    
    Return as JSON array.
    """
    
    response = client.chat.completions.create(
        model="glm-4.6v",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": image_url}},
                    {"type": "text", "text": prompt}
                ]
            }
        ]
    )
    
    return response.choices[0].message.content
```

### Strategy 3: Time-Based Task Generation

```python
def generate_timed_tasks(client, image_url, available_time_minutes):
    """Generate tasks that fit within available time."""
    
    prompt = f"""
    I have {available_time_minutes} minutes to work on this room.
    
    Analyze the room and create a task list that:
    1. Fits within my time budget
    2. Maximizes visible impact
    3. Prioritizes quick wins
    
    For each task:
    {{
        "task": "description",
        "minutes": estimated_time,
        "impact": "high|medium|low",
        "location": "where in room",
        "cumulative_time": running_total
    }}
    
    Stop adding tasks when cumulative_time approaches {available_time_minutes}.
    Include a "bonus" section for if I finish early.
    
    Return as JSON.
    """
    
    response = client.chat.completions.create(
        model="glm-4.6v",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": image_url}},
                    {"type": "text", "text": prompt}
                ]
            }
        ],
        thinking={"type": "enabled"}
    )
    
    return response.choices[0].message.content
```

---

## Implementation Examples

### Complete Room Analysis Pipeline

```python
from zai import ZaiClient
import json

class RoomAnalyzer:
    def __init__(self, api_key: str):
        self.client = ZaiClient(api_key=api_key)
        self.model = "glm-4.6v"
    
    def analyze_room(self, image_url: str) -> dict:
        """Complete room analysis with task generation."""
        
        # Step 1: Initial Analysis
        analysis = self._get_room_overview(image_url)
        
        # Step 2: Object Detection
        objects = self._detect_objects(image_url)
        
        # Step 3: Generate Tasks
        tasks = self._generate_tasks(image_url, analysis)
        
        return {
            "analysis": analysis,
            "objects": objects,
            "tasks": tasks
        }
    
    def _get_room_overview(self, image_url: str) -> dict:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": image_url}},
                    {"type": "text", "text": """
                        Analyze this room and return JSON:
                        {
                            "room_type": "bedroom|kitchen|bathroom|living|office|other",
                            "cleanliness_score": 1-10,
                            "organization_score": 1-10,
                            "main_issues": ["issue1", "issue2"],
                            "estimated_cleanup_time_minutes": number
                        }
                    """}
                ]
            }]
        )
        return json.loads(response.choices[0].message.content)
    
    def _detect_objects(self, image_url: str) -> list:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": image_url}},
                    {"type": "text", "text": """
                        List ALL objects. Return JSON array:
                        [{"label": "name", "bbox_2d": [x1,y1,x2,y2], "needs_action": true/false}]
                    """}
                ]
            }]
        )
        return json.loads(response.choices[0].message.content)
    
    def _generate_tasks(self, image_url: str, analysis: dict) -> list:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": image_url}},
                    {"type": "text", "text": f"""
                        Based on this {analysis['room_type']} with issues: {analysis['main_issues']}
                        
                        Generate prioritized task list as JSON:
                        [{{
                            "id": 1,
                            "task": "description",
                            "category": "declutter|clean|organize|repair",
                            "priority": "high|medium|low",
                            "duration_minutes": number,
                            "supplies": ["item1", "item2"]
                        }}]
                        
                        Order by priority, then by duration (quick wins first).
                    """}
                ]
            }],
            thinking={"type": "enabled"}
        )
        return json.loads(response.choices[0].message.content)


# Usage
analyzer = RoomAnalyzer(api_key="your-api-key")
result = analyzer.analyze_room("https://example.com/messy-room.jpg")

print(f"Room Type: {result['analysis']['room_type']}")
print(f"Score: {result['analysis']['cleanliness_score']}/10")
print(f"Tasks: {len(result['tasks'])}")
for task in result['tasks']:
    print(f"  - [{task['priority']}] {task['task']} ({task['duration_minutes']} min)")
```

### Streaming Response for Real-Time UI

```python
def analyze_room_streaming(client, image_url):
    """Stream analysis for real-time display."""
    
    response = client.chat.completions.create(
        model="glm-4.6v",
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": image_url}},
                {"type": "text", "text": "Analyze this room and list all cleaning tasks needed."}
            ]
        }],
        thinking={"type": "enabled"},
        stream=True
    )
    
    reasoning = ""
    answer = ""
    
    for chunk in response:
        delta = chunk.choices[0].delta
        
        # Thinking/reasoning content
        if delta.reasoning_content:
            reasoning += delta.reasoning_content
            print(f"[Thinking] {delta.reasoning_content}", end='', flush=True)
        
        # Final answer content
        if delta.content:
            answer += delta.content
            print(delta.content, end='', flush=True)
    
    return {"reasoning": reasoning, "answer": answer}
```

### cURL Example

```bash
curl -X POST \
    https://api.z.ai/api/paas/v4/chat/completions \
    -H "Authorization: Bearer your-api-key" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "glm-4.6v",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "https://example.com/room.jpg"
                        }
                    },
                    {
                        "type": "text",
                        "text": "Analyze this room. Identify all items that need to be cleaned, organized, or removed. Return a prioritized task list with time estimates."
                    }
                ]
            }
        ],
        "thinking": {
            "type": "enabled"
        }
    }'
```

---

## Best Practices

### Image Quality

1. **Good Lighting**: Ensure room is well-lit for accurate detection
2. **Multiple Angles**: Provide 2-3 photos covering different perspectives
3. **Full Coverage**: Capture entire room, including corners and floor
4. **Resolution**: Higher resolution = better object detection

### Prompt Engineering

1. **Be Specific**: "Identify items on the desk" vs "analyze room"
2. **Request Structure**: Always specify JSON output format
3. **Enable Thinking**: Use `thinking: {"type": "enabled"}` for complex analysis
4. **Set Expectations**: Specify what you want categorized and how

### Task Generation

1. **Include Time Constraints**: Specify available time for realistic lists
2. **Request Dependencies**: Ask which tasks must be done first
3. **Categorize Actions**: Declutter, Clean, Organize, Repair
4. **Prioritize Impact**: Quick wins first for motivation

### Error Handling

```python
def safe_analyze(client, image_url):
    try:
        response = client.chat.completions.create(
            model="glm-4.6v",
            messages=[...],
            timeout=60  # Set appropriate timeout
        )
        
        content = response.choices[0].message.content
        
        # Validate JSON response
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Model returned non-JSON, extract what we can
            return {"raw_response": content, "parsed": False}
            
    except Exception as e:
        return {"error": str(e), "success": False}
```

---

## Pricing

### GLM-4.6V (Flagship)

| Type | Price |
|------|-------|
| Input tokens | $0.30 per 1M tokens |
| Output tokens | $0.90 per 1M tokens |

### GLM-4.6V-FlashX (Lightweight)

Lower cost than flagship, still powerful.

### GLM-4.6V-Flash

**Completely free** - great for prototyping and testing.

### Estimation

- Average room photo: ~1,000-2,000 tokens
- Detailed analysis response: ~500-1,500 tokens
- Cost per room analysis: ~$0.001-0.003

---

## Resources

- [Official Documentation](https://docs.z.ai/guides/vlm/glm-4.6v)
- [API Reference](https://docs.z.ai/api-reference/introduction)
- [Pricing Details](https://docs.z.ai/guides/overview/pricing)
- [Get API Keys](https://z.ai/manage-apikey/apikey-list)
- [GitHub - Open Source Models](https://github.com/zai-org/GLM-V)
- [HuggingFace Collection](https://huggingface.co/collections/zai-org/glm-46v)

---

## Quick Reference Card

```
Model:     glm-4.6v (flagship) | glm-4.6v-flash (free)
Endpoint:  POST https://api.z.ai/api/paas/v4/chat/completions
Auth:      Authorization: Bearer <api-key>
Context:   128K tokens
Images:    jpg/jpeg/png, max 20MB, unlimited count

Key Params:
  - model: "glm-4.6v"
  - messages: [{role: "user", content: [...]}]
  - thinking: {"type": "enabled"}  # For reasoning
  - stream: true/false

Best For:
  - Room analysis & object detection
  - Task breakdown with coordinates
  - Multi-image understanding
  - Structured JSON output
```
