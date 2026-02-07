import React, { useState, useCallback } from 'react';
import type { MindMapNode } from '../../types';
import { parseTextToMindMap, sampleMindMap } from '../../data/sampleData';

type InputMode = 'visual' | 'json' | 'text';

interface DataInputProps {
  data: MindMapNode;
  onDataChange: (data: MindMapNode) => void;
  selectedNodeId: string | null;
}

const DataInput: React.FC<DataInputProps> = ({ data, onDataChange, selectedNodeId }) => {
  const [mode, setMode] = useState<InputMode>('visual');
  const [jsonText, setJsonText] = useState(() => JSON.stringify(data, null, 2));
  const [textInput, setTextInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const applyJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      onDataChange(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  }, [jsonText, onDataChange]);

  const applyText = useCallback(() => {
    if (!textInput.trim()) return;
    const parsed = parseTextToMindMap(textInput);
    onDataChange(parsed);
  }, [textInput, onDataChange]);

  const loadSample = useCallback(() => {
    onDataChange(sampleMindMap);
    setJsonText(JSON.stringify(sampleMindMap, null, 2));
  }, [onDataChange]);

  // ─── Interactive Node Editing ──────────────────────────────────────
  const addChild = useCallback(
    (parentId: string) => {
      const newId = `node-${Date.now()}`;
      const updated = addChildToNode(data, parentId, {
        id: newId,
        text: 'New Node',
        children: [],
      });
      onDataChange(updated);
    },
    [data, onDataChange]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      if (nodeId === data.id) return; // Can't delete root
      const updated = removeNode(data, nodeId);
      if (updated) onDataChange(updated);
    },
    [data, onDataChange]
  );

  const startEditing = useCallback((nodeId: string, currentText: string) => {
    setEditingNodeId(nodeId);
    setEditText(currentText);
  }, []);

  const finishEditing = useCallback(() => {
    if (editingNodeId && editText.trim()) {
      const updated = updateNodeText(data, editingNodeId, editText.trim());
      onDataChange(updated);
    }
    setEditingNodeId(null);
    setEditText('');
  }, [editingNodeId, editText, data, onDataChange]);

  return (
    <div style={container}>
      {/* Mode selector */}
      <div style={modeBar}>
        {(['visual', 'json', 'text'] as InputMode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              if (m === 'json') setJsonText(JSON.stringify(data, null, 2));
            }}
            style={{
              ...modeBtn,
              background: mode === m ? '#4F46E5' : 'transparent',
              color: mode === m ? '#FFF' : '#64748B',
            }}
          >
            {m === 'visual' ? 'Editor' : m === 'json' ? 'JSON' : 'Text'}
          </button>
        ))}
        <button onClick={loadSample} style={{ ...modeBtn, marginLeft: 'auto', color: '#4F46E5' }}>
          Load Sample
        </button>
      </div>

      <div style={contentArea}>
        {/* ─── Visual Tree Editor ─── */}
        {mode === 'visual' && (
          <div style={{ padding: 8 }}>
            <TreeNodeEditor
              node={data}
              depth={0}
              selectedNodeId={selectedNodeId}
              editingNodeId={editingNodeId}
              editText={editText}
              onEditText={setEditText}
              onStartEditing={startEditing}
              onFinishEditing={finishEditing}
              onAddChild={addChild}
              onDeleteNode={deleteNode}
            />
          </div>
        )}

        {/* ─── JSON Editor ─── */}
        {mode === 'json' && (
          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              style={textareaStyle}
              spellCheck={false}
            />
            {jsonError && (
              <div style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>{jsonError}</div>
            )}
            <button onClick={applyJson} style={applyBtn}>
              Apply JSON
            </button>
          </div>
        )}

        {/* ─── Text Input ─── */}
        {mode === 'text' && (
          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>
              Enter indented text. Use spaces/tabs for hierarchy:
            </div>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`Project\n  Phase 1\n    Task A\n    Task B\n  Phase 2\n    Task C`}
              style={textareaStyle}
              spellCheck={false}
            />
            <button onClick={applyText} style={applyBtn}>
              Generate Map
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── TreeNodeEditor ──────────────────────────────────────────────────────────

const TreeNodeEditor: React.FC<{
  node: MindMapNode;
  depth: number;
  selectedNodeId: string | null;
  editingNodeId: string | null;
  editText: string;
  onEditText: (text: string) => void;
  onStartEditing: (id: string, text: string) => void;
  onFinishEditing: () => void;
  onAddChild: (parentId: string) => void;
  onDeleteNode: (id: string) => void;
}> = ({
  node,
  depth,
  selectedNodeId,
  editingNodeId,
  editText,
  onEditText,
  onStartEditing,
  onFinishEditing,
  onAddChild,
  onDeleteNode,
}) => {
  const isEditing = editingNodeId === node.id;
  const isSelected = selectedNodeId === node.id;

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 6px',
          borderRadius: 6,
          background: isSelected ? '#EEF2FF' : 'transparent',
          marginBottom: 2,
        }}
      >
        {node.children.length > 0 && (
          <span style={{ color: '#94A3B8', fontSize: 10, width: 12 }}>
            {node.collapsed ? '+' : '-'}
          </span>
        )}
        {node.children.length === 0 && <span style={{ width: 12 }} />}

        {node.icon && <span style={{ fontSize: 12 }}>{node.icon}</span>}

        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => onEditText(e.target.value)}
            onBlur={onFinishEditing}
            onKeyDown={(e) => e.key === 'Enter' && onFinishEditing()}
            autoFocus
            style={{
              flex: 1,
              fontSize: 12,
              padding: '2px 6px',
              border: '1px solid #4F46E5',
              borderRadius: 4,
              outline: 'none',
            }}
          />
        ) : (
          <span
            onDoubleClick={() => onStartEditing(node.id, node.text)}
            style={{
              flex: 1,
              fontSize: 12,
              color: depth === 0 ? '#4F46E5' : '#334155',
              fontWeight: depth === 0 ? 600 : 400,
              cursor: 'text',
            }}
          >
            {node.text}
          </span>
        )}

        <button
          onClick={() => onAddChild(node.id)}
          style={treeActionBtn}
          title="Add child"
        >
          +
        </button>
        {depth > 0 && (
          <button
            onClick={() => onDeleteNode(node.id)}
            style={{ ...treeActionBtn, color: '#EF4444' }}
            title="Delete"
          >
            x
          </button>
        )}
      </div>

      {!node.collapsed &&
        node.children.map((child) => (
          <TreeNodeEditor
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedNodeId={selectedNodeId}
            editingNodeId={editingNodeId}
            editText={editText}
            onEditText={onEditText}
            onStartEditing={onStartEditing}
            onFinishEditing={onFinishEditing}
            onAddChild={onAddChild}
            onDeleteNode={onDeleteNode}
          />
        ))}
    </div>
  );
};

// ─── Tree Manipulation Helpers ───────────────────────────────────────────────

function addChildToNode(tree: MindMapNode, parentId: string, newChild: MindMapNode): MindMapNode {
  if (tree.id === parentId) {
    return { ...tree, children: [...tree.children, newChild] };
  }
  return {
    ...tree,
    children: tree.children.map((c) => addChildToNode(c, parentId, newChild)),
  };
}

function removeNode(tree: MindMapNode, nodeId: string): MindMapNode | null {
  if (tree.id === nodeId) return null;
  return {
    ...tree,
    children: tree.children
      .map((c) => removeNode(c, nodeId))
      .filter((c): c is MindMapNode => c !== null),
  };
}

function updateNodeText(tree: MindMapNode, nodeId: string, text: string): MindMapNode {
  if (tree.id === nodeId) return { ...tree, text };
  return {
    ...tree,
    children: tree.children.map((c) => updateNodeText(c, nodeId, text)),
  };
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const container: React.CSSProperties = {
  width: 300,
  height: '100%',
  background: '#FFFFFF',
  borderRight: '1px solid #E2E8F0',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  flexShrink: 0,
};

const modeBar: React.CSSProperties = {
  display: 'flex',
  gap: 2,
  padding: '8px 8px',
  background: '#F8FAFC',
  borderBottom: '1px solid #E2E8F0',
};

const modeBtn: React.CSSProperties = {
  padding: '6px 12px',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 600,
  transition: 'all 0.15s ease',
};

const contentArea: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
};

const textareaStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 200,
  padding: 10,
  fontFamily: "'Menlo', monospace",
  fontSize: 11,
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  resize: 'none',
  color: '#334155',
  lineHeight: 1.5,
};

const applyBtn: React.CSSProperties = {
  marginTop: 8,
  padding: '8px 16px',
  background: '#4F46E5',
  color: '#FFF',
  border: 'none',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const treeActionBtn: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: 4,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
  color: '#94A3B8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
};

export default React.memo(DataInput);
