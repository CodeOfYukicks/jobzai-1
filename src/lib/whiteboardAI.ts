/**
 * AI utilities for whiteboard content generation
 * Handles parsing user intents and generating structured content for tldraw
 */

import { MindMapStructure, MindMapBranch, FlowDiagramNode, FlowDiagramConnection } from '../contexts/AssistantContext';

// Whiteboard content types
export type WhiteboardContentType = 'mind_map' | 'sticky_notes' | 'flow_diagram' | 'text' | 'frame' | 'brainstorm';

// Intent detection result
export interface WhiteboardIntent {
  type: WhiteboardContentType;
  confidence: number;
  extractedTopic?: string;
  extractedCount?: number;
  rawMessage: string;
}

// Sticky note generation result
export interface GeneratedStickyNote {
  text: string;
  color: 'yellow' | 'blue' | 'green' | 'orange' | 'red' | 'violet';
}

// Keywords for intent detection
const MIND_MAP_KEYWORDS = [
  'mind map', 'mindmap', 'carte mentale', 'carte heuristique',
  'brainstorm', 'arbre', 'branches', 'map des idées', 'mapping',
  'schéma', 'organigramme des idées', 'diagramme conceptuel'
];

const STICKY_NOTE_KEYWORDS = [
  'post-it', 'postit', 'sticky', 'note', 'notes', 'post it',
  'pense-bête', 'memo', 'mémo', 'idées', 'ideas'
];

const FLOW_DIAGRAM_KEYWORDS = [
  'flow', 'diagramme', 'processus', 'process', 'workflow',
  'étapes', 'steps', 'séquence', 'sequence', 'flowchart',
  'flux', 'parcours', 'chemin', 'pipeline'
];

const FRAME_KEYWORDS = [
  'frame', 'cadre', 'groupe', 'group', 'section', 'container',
  'zone', 'area', 'encadrer', 'regrouper'
];

const TEXT_KEYWORDS = [
  'texte', 'text', 'titre', 'title', 'écrire', 'write',
  'écris', 'ajoute du texte', 'add text'
];

/**
 * Detect the user's intent for whiteboard content creation
 */
export function parseWhiteboardIntent(message: string): WhiteboardIntent {
  const lowerMessage = message.toLowerCase();
  
  // Check for mind map intent
  const mindMapMatch = MIND_MAP_KEYWORDS.some(kw => lowerMessage.includes(kw));
  if (mindMapMatch) {
    return {
      type: 'mind_map',
      confidence: 0.9,
      extractedTopic: extractTopic(message, MIND_MAP_KEYWORDS),
      rawMessage: message
    };
  }
  
  // Check for flow diagram intent
  const flowMatch = FLOW_DIAGRAM_KEYWORDS.some(kw => lowerMessage.includes(kw));
  if (flowMatch) {
    return {
      type: 'flow_diagram',
      confidence: 0.85,
      extractedTopic: extractTopic(message, FLOW_DIAGRAM_KEYWORDS),
      rawMessage: message
    };
  }
  
  // Check for sticky notes intent
  const stickyMatch = STICKY_NOTE_KEYWORDS.some(kw => lowerMessage.includes(kw));
  if (stickyMatch) {
    return {
      type: 'sticky_notes',
      confidence: 0.85,
      extractedTopic: extractTopic(message, STICKY_NOTE_KEYWORDS),
      extractedCount: extractCount(message),
      rawMessage: message
    };
  }
  
  // Check for frame intent
  const frameMatch = FRAME_KEYWORDS.some(kw => lowerMessage.includes(kw));
  if (frameMatch) {
    return {
      type: 'frame',
      confidence: 0.8,
      extractedTopic: extractTopic(message, FRAME_KEYWORDS),
      rawMessage: message
    };
  }
  
  // Check for text intent
  const textMatch = TEXT_KEYWORDS.some(kw => lowerMessage.includes(kw));
  if (textMatch) {
    return {
      type: 'text',
      confidence: 0.75,
      extractedTopic: extractTopic(message, TEXT_KEYWORDS),
      rawMessage: message
    };
  }
  
  // Default to brainstorm (general content)
  return {
    type: 'brainstorm',
    confidence: 0.5,
    extractedTopic: message,
    rawMessage: message
  };
}

/**
 * Check if a message is a whiteboard creation request
 */
export function isWhiteboardCreationRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Check for explicit creation keywords
  const creationKeywords = [
    'crée', 'créer', 'create', 'fais', 'faire', 'génère', 'générer',
    'generate', 'ajoute', 'ajouter', 'add', 'dessine', 'draw',
    'construis', 'build', 'make', 'produce', 'design'
  ];
  
  const hasCreationKeyword = creationKeywords.some(kw => lowerMessage.includes(kw));
  
  // Check for content type keywords
  const allContentKeywords = [
    ...MIND_MAP_KEYWORDS,
    ...STICKY_NOTE_KEYWORDS,
    ...FLOW_DIAGRAM_KEYWORDS,
    ...FRAME_KEYWORDS,
    ...TEXT_KEYWORDS
  ];
  
  const hasContentKeyword = allContentKeywords.some(kw => lowerMessage.includes(kw));
  
  return hasCreationKeyword && hasContentKeyword;
}

/**
 * Extract the topic from a message by removing keywords
 */
function extractTopic(message: string, keywords: string[]): string {
  let topic = message;
  
  // Remove common prefixes
  const prefixes = [
    'crée une', 'créer une', 'create a', 'fais une', 'faire une',
    'génère une', 'générer une', 'generate a', 'ajoute une', 'add a',
    'crée un', 'créer un', 'create an', 'fais un', 'faire un',
    'génère un', 'générer un', 'generate an', 'ajoute un', 'add an',
    'dessine', 'draw', 'make a', 'build a',
    'sur le thème', 'about', 'sur', 'on', 'pour', 'for'
  ];
  
  for (const prefix of prefixes) {
    const regex = new RegExp(prefix + '\\s*', 'gi');
    topic = topic.replace(regex, '');
  }
  
  // Remove content type keywords
  for (const keyword of keywords) {
    const regex = new RegExp(keyword + '\\s*', 'gi');
    topic = topic.replace(regex, '');
  }
  
  return topic.trim() || 'Ideas';
}

/**
 * Extract a count/number from a message (e.g., "5 post-its")
 */
function extractCount(message: string): number {
  const numberMatch = message.match(/(\d+)/);
  if (numberMatch) {
    const num = parseInt(numberMatch[1], 10);
    return Math.min(Math.max(num, 1), 20); // Clamp between 1 and 20
  }
  return 5; // Default count
}

/**
 * Generate a prompt for the AI to create mind map content
 */
export function generateMindMapPrompt(topic: string, context?: any): string {
  let contextInfo = '';
  
  if (context) {
    if (context.userProfile) {
      contextInfo += `\nUser profile: ${context.userProfile.currentJobTitle || ''}, skills: ${context.userProfile.skills?.join(', ') || 'N/A'}`;
    }
    if (context.jobApplication) {
      contextInfo += `\nJob context: ${context.jobApplication.position} at ${context.jobApplication.companyName}`;
    }
  }
  
  return `Generate a mind map structure for the topic: "${topic}"
${contextInfo}

Return a JSON object with this exact structure:
{
  "centerTopic": "Main Topic",
  "branches": [
    {
      "text": "Branch 1",
      "color": "blue",
      "children": [
        { "text": "Sub-item 1" },
        { "text": "Sub-item 2" }
      ]
    },
    {
      "text": "Branch 2",
      "color": "green",
      "children": []
    }
  ]
}

Rules:
- Create 4-6 main branches
- Each branch can have 2-4 children
- Use colors: yellow, blue, green, orange, red, violet
- Keep text concise (max 50 characters per item)
- Make it relevant and actionable
- Return ONLY the JSON, no other text`;
}

/**
 * Generate a prompt for the AI to create sticky notes
 */
export function generateStickyNotesPrompt(topic: string, count: number, context?: any): string {
  let contextInfo = '';
  
  if (context) {
    if (context.userProfile) {
      contextInfo += `\nUser profile: ${context.userProfile.currentJobTitle || ''}, skills: ${context.userProfile.skills?.join(', ') || 'N/A'}`;
    }
    if (context.jobApplication) {
      contextInfo += `\nJob context: ${context.jobApplication.position} at ${context.jobApplication.companyName}`;
    }
  }
  
  return `Generate ${count} sticky notes (post-its) for the topic: "${topic}"
${contextInfo}

Return a JSON array with this exact structure:
[
  { "text": "First idea or point", "color": "yellow" },
  { "text": "Second idea or point", "color": "blue" }
]

Rules:
- Generate exactly ${count} sticky notes
- Use colors: yellow, blue, green, orange, red, violet
- Keep text concise (max 100 characters per note)
- Make each note a distinct, actionable idea
- Vary the colors for visual appeal
- Return ONLY the JSON array, no other text`;
}

/**
 * Generate a prompt for the AI to create a flow diagram
 */
export function generateFlowDiagramPrompt(topic: string, context?: any): string {
  let contextInfo = '';
  
  if (context) {
    if (context.userProfile) {
      contextInfo += `\nUser profile: ${context.userProfile.currentJobTitle || ''}, skills: ${context.userProfile.skills?.join(', ') || 'N/A'}`;
    }
    if (context.jobApplication) {
      contextInfo += `\nJob context: ${context.jobApplication.position} at ${context.jobApplication.companyName}`;
    }
  }
  
  return `Generate a flow diagram for the process: "${topic}"
${contextInfo}

Return a JSON object with this exact structure:
{
  "nodes": [
    { "id": "start", "text": "Start", "type": "start" },
    { "id": "step1", "text": "First Step", "type": "process" },
    { "id": "decision1", "text": "Decision?", "type": "decision" },
    { "id": "end", "text": "End", "type": "end" }
  ],
  "connections": [
    { "from": "start", "to": "step1" },
    { "from": "step1", "to": "decision1" },
    { "from": "decision1", "to": "end", "label": "Yes" }
  ]
}

Node types:
- "start": Starting point (oval)
- "end": End point (oval)
- "process": Process step (rectangle)
- "decision": Decision point (diamond)

Rules:
- Create 5-8 nodes for a clear flow
- Include at least one decision point if appropriate
- Connection labels are optional (for decisions)
- Keep text concise (max 40 characters per node)
- Return ONLY the JSON, no other text`;
}

/**
 * Parse mind map JSON response from AI
 */
export function parseMindMapResponse(response: string): MindMapStructure | null {
  try {
    console.log('[WHITEBOARD AI] Parsing mind map response, length:', response.length);
    console.log('[WHITEBOARD AI] Raw response preview:', response.substring(0, 500));
    
    // Clean up the response - remove markdown code blocks if present
    let cleanResponse = response
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    
    // Try to extract JSON from the response
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[WHITEBOARD AI] No JSON object found in response');
      return null;
    }
    
    console.log('[WHITEBOARD AI] Extracted JSON:', jsonMatch[0].substring(0, 300));
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!parsed.centerTopic || !Array.isArray(parsed.branches)) {
      console.error('[WHITEBOARD AI] Invalid structure - missing centerTopic or branches');
      return null;
    }
    
    console.log('[WHITEBOARD AI] Successfully parsed mind map:', parsed.centerTopic, 'with', parsed.branches.length, 'branches');
    
    return parsed as MindMapStructure;
  } catch (error) {
    console.error('[WHITEBOARD AI] Failed to parse mind map response:', error);
    console.error('[WHITEBOARD AI] Response was:', response.substring(0, 1000));
    return null;
  }
}

/**
 * Parse sticky notes JSON response from AI
 */
export function parseStickyNotesResponse(response: string): GeneratedStickyNote[] | null {
  try {
    console.log('[WHITEBOARD AI] Parsing sticky notes response, length:', response.length);
    
    // Clean up the response - remove markdown code blocks if present
    let cleanResponse = response
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    
    // Try to extract JSON array from the response
    const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[WHITEBOARD AI] No JSON array found in response');
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate it's an array
    if (!Array.isArray(parsed)) {
      console.error('[WHITEBOARD AI] Parsed value is not an array');
      return null;
    }
    
    // Validate each item
    const validNotes = parsed.filter(item => 
      typeof item.text === 'string' && 
      typeof item.color === 'string'
    ) as GeneratedStickyNote[];
    
    console.log('[WHITEBOARD AI] Successfully parsed', validNotes.length, 'sticky notes');
    
    return validNotes;
  } catch (error) {
    console.error('[WHITEBOARD AI] Failed to parse sticky notes response:', error);
    console.error('[WHITEBOARD AI] Response was:', response.substring(0, 500));
    return null;
  }
}

/**
 * Parse flow diagram JSON response from AI
 */
export function parseFlowDiagramResponse(response: string): { nodes: FlowDiagramNode[]; connections: FlowDiagramConnection[] } | null {
  try {
    console.log('[WHITEBOARD AI] Parsing flow diagram response, length:', response.length);
    
    // Clean up the response - remove markdown code blocks if present
    let cleanResponse = response
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    
    // Try to extract JSON from the response
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[WHITEBOARD AI] No JSON object found in response');
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.connections)) {
      console.error('[WHITEBOARD AI] Invalid structure - missing nodes or connections arrays');
      return null;
    }
    
    console.log('[WHITEBOARD AI] Successfully parsed flow diagram with', parsed.nodes.length, 'nodes');
    
    return {
      nodes: parsed.nodes as FlowDiagramNode[],
      connections: parsed.connections as FlowDiagramConnection[]
    };
  } catch (error) {
    console.error('[WHITEBOARD AI] Failed to parse flow diagram response:', error);
    console.error('[WHITEBOARD AI] Response was:', response.substring(0, 500));
    return null;
  }
}

/**
 * Generate fallback content if AI fails
 * Note: These are basic templates - the AI should normally provide better content
 */
export function generateFallbackMindMap(topic: string): MindMapStructure {
  console.warn('[WHITEBOARD AI] Using fallback mind map for topic:', topic);
  return {
    centerTopic: topic.length > 30 ? topic.substring(0, 27) + '...' : topic,
    branches: [
      { 
        text: 'Points clés', 
        color: 'blue', 
        children: [
          { text: `Aspect 1 de ${topic.substring(0, 20)}` }, 
          { text: `Aspect 2 de ${topic.substring(0, 20)}` }
        ] 
      },
      { 
        text: 'Actions à faire', 
        color: 'green', 
        children: [
          { text: 'Rechercher plus d\'infos' }, 
          { text: 'Préparer les documents' }
        ] 
      },
      { 
        text: 'Questions', 
        color: 'orange', 
        children: [
          { text: 'Points à clarifier' }
        ] 
      },
      { 
        text: 'Ressources', 
        color: 'violet', 
        children: [
          { text: 'Documents utiles' }
        ] 
      }
    ]
  };
}

/**
 * Generate fallback sticky notes if AI fails
 */
export function generateFallbackStickyNotes(topic: string, count: number): GeneratedStickyNote[] {
  console.warn('[WHITEBOARD AI] Using fallback sticky notes for topic:', topic);
  const colors: GeneratedStickyNote['color'][] = ['yellow', 'blue', 'green', 'orange', 'red', 'violet'];
  const templates = [
    `Point important sur ${topic}`,
    `Question à explorer: ${topic}`,
    `Action: approfondir ${topic}`,
    `Idée: améliorer ${topic}`,
    `Note: aspects de ${topic}`,
    `Réflexion sur ${topic}`,
  ];
  return Array.from({ length: count }, (_, i) => ({
    text: templates[i % templates.length].substring(0, 100),
    color: colors[i % colors.length]
  }));
}

/**
 * Generate fallback flow diagram if AI fails
 */
export function generateFallbackFlowDiagram(topic: string): { nodes: FlowDiagramNode[]; connections: FlowDiagramConnection[] } {
  console.warn('[WHITEBOARD AI] Using fallback flow diagram for topic:', topic);
  return {
    nodes: [
      { id: 'start', text: 'Début', type: 'start' },
      { id: 'step1', text: `Analyser: ${topic.substring(0, 25)}`, type: 'process' },
      { id: 'decision', text: 'Prêt?', type: 'decision' },
      { id: 'step2', text: 'Préparer davantage', type: 'process' },
      { id: 'step3', text: 'Exécuter', type: 'process' },
      { id: 'end', text: 'Fin', type: 'end' }
    ],
    connections: [
      { from: 'start', to: 'step1' },
      { from: 'step1', to: 'decision' },
      { from: 'decision', to: 'step2', label: 'Non' },
      { from: 'decision', to: 'step3', label: 'Oui' },
      { from: 'step2', to: 'decision' },
      { from: 'step3', to: 'end' }
    ]
  };
}

/**
 * Calculate layout positions for mind map branches
 * Uses a radial layout with proper spacing to avoid overlaps
 */
export function calculateMindMapLayout(
  structure: MindMapStructure,
  center: { x: number; y: number },
  noteWidth: number = 200,
  noteHeight: number = 100
): { 
  centerPosition: { x: number; y: number }; 
  branchPositions: { x: number; y: number; angle: number }[];
  childPositions: Map<number, { x: number; y: number; angle: number }[]>;
  branchRadius: number;
  childRadius: number;
} {
  const branchCount = structure.branches.length;
  
  // Calculate radius based on branch count to avoid overlaps
  // More branches = larger radius
  const baseRadius = 350;
  const branchRadius = baseRadius + Math.max(0, branchCount - 4) * 50;
  const childRadius = 200; // Distance from branch to children
  
  const startAngle = -Math.PI / 2; // Start at top
  const angleStep = (2 * Math.PI) / branchCount;
  
  const branchPositions = structure.branches.map((_, index) => {
    const angle = startAngle + (index * angleStep);
    return {
      x: center.x + Math.cos(angle) * branchRadius - noteWidth / 2,
      y: center.y + Math.sin(angle) * branchRadius - noteHeight / 2,
      angle
    };
  });
  
  // Pre-calculate child positions for each branch
  const childPositions = new Map<number, { x: number; y: number; angle: number }[]>();
  structure.branches.forEach((branch, branchIndex) => {
    if (branch.children && branch.children.length > 0) {
      const branchAngle = branchPositions[branchIndex].angle;
      const childCount = branch.children.length;
      const childAngleSpread = Math.min(Math.PI / 2, (Math.PI / 4) * childCount); // Dynamic spread
      const childAngleStep = childAngleSpread / Math.max(childCount - 1, 1);
      const childStartAngle = branchAngle - childAngleSpread / 2;
      
      const positions = branch.children.map((_, childIndex) => {
        const angle = childCount === 1 
          ? branchAngle 
          : childStartAngle + childIndex * childAngleStep;
        
        return {
          x: branchPositions[branchIndex].x + noteWidth / 2 + Math.cos(angle) * childRadius - noteWidth * 0.4,
          y: branchPositions[branchIndex].y + noteHeight / 2 + Math.sin(angle) * childRadius - noteHeight * 0.4,
          angle
        };
      });
      childPositions.set(branchIndex, positions);
    }
  });
  
  return {
    centerPosition: { x: center.x - noteWidth / 2, y: center.y - noteHeight / 2 },
    branchPositions,
    childPositions,
    branchRadius,
    childRadius
  };
}

/**
 * Calculate layout positions for sticky notes (grid layout with generous spacing)
 */
export function calculateStickyNotesLayout(
  count: number,
  center: { x: number; y: number },
  noteWidth: number = 220,
  noteHeight: number = 220,
  spacing: number = 60
): { x: number; y: number }[] {
  // Aim for a more horizontal layout for readability
  const cols = Math.min(count, Math.max(3, Math.ceil(Math.sqrt(count * 1.5))));
  const rows = Math.ceil(count / cols);
  
  const totalWidth = cols * noteWidth + (cols - 1) * spacing;
  const totalHeight = rows * noteHeight + (rows - 1) * spacing;
  
  const startX = center.x - totalWidth / 2;
  const startY = center.y - totalHeight / 2;
  
  return Array.from({ length: count }, (_, i) => ({
    x: startX + (i % cols) * (noteWidth + spacing),
    y: startY + Math.floor(i / cols) * (noteHeight + spacing)
  }));
}

/**
 * Calculate layout positions for flow diagram (vertical layout with better spacing)
 */
export function calculateFlowDiagramLayout(
  nodes: FlowDiagramNode[],
  center: { x: number; y: number },
  nodeWidth: number = 220,
  nodeHeight: number = 100,
  spacing: number = 80
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  
  const totalHeight = nodes.length * nodeHeight + (nodes.length - 1) * spacing;
  const startY = center.y - totalHeight / 2;
  
  nodes.forEach((node, index) => {
    positions.set(node.id, {
      x: center.x - nodeWidth / 2,
      y: startY + index * (nodeHeight + spacing)
    });
  });
  
  return positions;
}

