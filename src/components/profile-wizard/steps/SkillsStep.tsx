import { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Wrench, X } from 'lucide-react';

interface SkillsStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

const SkillsStep = ({ data, onUpdate }: SkillsStepProps) => {
  const [skills, setSkills] = useState(data.skills || []);
  const [tools, setTools] = useState(data.tools || []);
  const [newSkill, setNewSkill] = useState('');
  const [newTool, setNewTool] = useState('');

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const updated = [...skills, newSkill.trim()];
      setSkills(updated);
      onUpdate({ skills: updated });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    const updated = skills.filter((s: string) => s !== skill);
    setSkills(updated);
    onUpdate({ skills: updated });
  };

  const addTool = () => {
    if (newTool.trim() && !tools.includes(newTool.trim())) {
      const updated = [...tools, newTool.trim()];
      setTools(updated);
      onUpdate({ tools: updated });
      setNewTool('');
    }
  };

  const removeTool = (tool: string) => {
    const updated = tools.filter((t: string) => t !== tool);
    setTools(updated);
    onUpdate({ tools: updated });
  };

  return (
    <div className="space-y-6">
      {/* Skills */}
      <div className="max-w-2xl mx-auto">
        <motion.label
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4"
        >
          Skills
        </motion.label>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Code className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSkill()}
              placeholder="Ex: React, Python, Product Management..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
            />
          </div>
          <motion.button
            onClick={addSkill}
            whileHover={{ scale: 1.05 }}
            className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
          >
                    Add
          </motion.button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill: string, index: number) => (
            <motion.span
              key={skill}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
            >
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                className="hover:text-purple-900 dark:hover:text-purple-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.span>
          ))}
        </div>
      </div>

      {/* Outils */}
      <div className="max-w-2xl mx-auto mt-6">
        <motion.label
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4"
        >
          Tools
        </motion.label>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Wrench className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={newTool}
              onChange={(e) => setNewTool(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTool()}
              placeholder="Ex: Figma, Jira, Git..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
            />
          </div>
          <motion.button
            onClick={addTool}
            whileHover={{ scale: 1.05 }}
            className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
          >
                    Add
          </motion.button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tools.map((tool: string, index: number) => (
            <motion.span
              key={tool}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium"
            >
              {tool}
              <button
                onClick={() => removeTool(tool)}
                className="hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillsStep;

