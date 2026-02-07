import type { MindMapNode } from '../types';

export const sampleMindMap: MindMapNode = {
  id: 'root',
  text: 'Mind Map Platform',
  children: [
    {
      id: 'design',
      text: 'Design',
      icon: '🎨',
      children: [
        {
          id: 'design-ui',
          text: 'UI/UX',
          children: [
            { id: 'design-ui-wireframes', text: 'Wireframes', children: [] },
            { id: 'design-ui-prototypes', text: 'Prototypes', children: [] },
            { id: 'design-ui-usability', text: 'Usability Tests', children: [] },
          ],
        },
        {
          id: 'design-visual',
          text: 'Visual Design',
          children: [
            { id: 'design-visual-colors', text: 'Color System', children: [] },
            { id: 'design-visual-typo', text: 'Typography', children: [] },
            { id: 'design-visual-icons', text: 'Iconography', children: [] },
          ],
        },
        {
          id: 'design-brand',
          text: 'Branding',
          children: [
            { id: 'design-brand-logo', text: 'Logo', children: [] },
            { id: 'design-brand-guide', text: 'Style Guide', children: [] },
          ],
        },
      ],
    },
    {
      id: 'tech',
      text: 'Technology',
      icon: '⚙️',
      children: [
        {
          id: 'tech-front',
          text: 'Frontend',
          children: [
            { id: 'tech-front-react', text: 'React', children: [] },
            { id: 'tech-front-svg', text: 'SVG Engine', children: [] },
            { id: 'tech-front-canvas', text: 'Canvas API', children: [] },
          ],
        },
        {
          id: 'tech-perf',
          text: 'Performance',
          children: [
            { id: 'tech-perf-render', text: 'Render Optimization', children: [] },
            { id: 'tech-perf-memory', text: 'Memory Management', children: [] },
          ],
        },
        {
          id: 'tech-export',
          text: 'Export Engine',
          children: [
            { id: 'tech-export-svg', text: 'SVG Export', children: [] },
            { id: 'tech-export-png', text: 'PNG Export', children: [] },
            { id: 'tech-export-jpeg', text: 'JPEG Export', children: [] },
          ],
        },
      ],
    },
    {
      id: 'features',
      text: 'Features',
      icon: '✨',
      children: [
        {
          id: 'features-layout',
          text: 'Layouts',
          children: [
            { id: 'features-layout-radial', text: 'Radial', children: [] },
            { id: 'features-layout-tree', text: 'Tree', children: [] },
            { id: 'features-layout-horizontal', text: 'Horizontal', children: [] },
          ],
        },
        {
          id: 'features-themes',
          text: 'Themes',
          children: [
            { id: 'features-themes-light', text: 'Light', children: [] },
            { id: 'features-themes-dark', text: 'Dark', children: [] },
            { id: 'features-themes-custom', text: 'Custom', children: [] },
          ],
        },
        {
          id: 'features-collab',
          text: 'Collaboration',
          children: [
            { id: 'features-collab-share', text: 'Share Link', children: [] },
            { id: 'features-collab-embed', text: 'Embed', children: [] },
          ],
        },
      ],
    },
    {
      id: 'business',
      text: 'Business',
      icon: '💼',
      children: [
        {
          id: 'business-market',
          text: 'Marketing',
          children: [
            { id: 'business-market-seo', text: 'SEO', children: [] },
            { id: 'business-market-social', text: 'Social Media', children: [] },
          ],
        },
        {
          id: 'business-revenue',
          text: 'Revenue',
          children: [
            { id: 'business-revenue-free', text: 'Freemium', children: [] },
            { id: 'business-revenue-pro', text: 'Pro Plan', children: [] },
          ],
        },
      ],
    },
    {
      id: 'research',
      text: 'Research',
      icon: '🔬',
      children: [
        {
          id: 'research-users',
          text: 'User Research',
          children: [
            { id: 'research-users-surveys', text: 'Surveys', children: [] },
            { id: 'research-users-interviews', text: 'Interviews', children: [] },
          ],
        },
        {
          id: 'research-comp',
          text: 'Competitive Analysis',
          children: [
            { id: 'research-comp-xmind', text: 'XMind', children: [] },
            { id: 'research-comp-miro', text: 'Miro', children: [] },
            { id: 'research-comp-whimsical', text: 'Whimsical', children: [] },
          ],
        },
      ],
    },
  ],
};

export function parseTextToMindMap(text: string): MindMapNode {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length === 0) {
    return { id: 'root', text: 'Empty', children: [] };
  }

  let idCounter = 0;
  const genId = () => `node-${idCounter++}`;

  const root: MindMapNode = { id: genId(), text: lines[0].trim(), children: [] };
  const stack: { node: MindMapNode; indent: number }[] = [{ node: root, indent: -1 }];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const stripped = line.replace(/^[\s\t]*[-*•]\s*/, '');
    const indent = line.search(/\S/);
    const newNode: MindMapNode = { id: genId(), text: stripped.trim(), children: [] };

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    stack[stack.length - 1].node.children.push(newNode);
    stack.push({ node: newNode, indent });
  }

  return root;
}
