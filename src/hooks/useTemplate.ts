import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Template } from '../types/template';

export function useTemplate() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSave = async (template: Template) => {
    if (!currentUser) {
      toast.error('You must be logged in to save templates');
      return;
    }

    if (!template.name || !template.subject || !template.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const templateData = {
        ...template,
        tags: template.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        aiGenerated: false,
        liked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const templatesRef = collection(db, 'users', currentUser.uid, 'emailTemplates');
      await addDoc(templatesRef, templateData);

      toast.success('Template saved successfully!');
      navigate('/email-templates');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template. Please try again.');
    }
  };

  const insertMergeField = (field: string, template: Template, setTemplate: (t: Template) => void) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    const subject = document.getElementById('template-subject') as HTMLInputElement;
    const activeElement = document.activeElement;
    
    if (activeElement === subject) {
      const start = subject.selectionStart;
      const end = subject.selectionEnd;
      const newSubject = template.subject.substring(0, start) + field + template.subject.substring(end);
      setTemplate({ ...template, subject: newSubject });
      setTimeout(() => {
        subject.selectionStart = subject.selectionEnd = start + field.length;
        subject.focus();
      }, 0);
    } else {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = template.content.substring(0, start) + field + template.content.substring(end);
      setTemplate({ ...template, content: newContent });
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + field.length;
        textarea.focus();
      }, 0);
    }
  };

  return { handleSave, insertMergeField };
} 