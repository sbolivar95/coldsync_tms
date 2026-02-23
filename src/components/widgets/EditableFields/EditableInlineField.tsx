import { useState, useEffect, useRef } from 'react';
import { Pencil } from 'lucide-react';
import { Input } from '../../ui/Input';
import { cn } from '../../../lib/utils';

interface EditableInlineFieldProps {
  label: string;
  value: string | number;
  fieldKey: string;
  type?: 'text' | 'number' | 'date' | 'time';
  canEdit?: boolean;
  onSave: (fieldKey: string, value: string | number) => Promise<void>;
  className?: string;
  step?: string;
  min?: string;
  max?: string;
}

export function EditableInlineField({
  label,
  value,
  fieldKey,
  type = 'text',
  canEdit = true,
  onSave,
  className,
  step,
  min,
  max,
}: EditableInlineFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState<string | number>(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = async () => {
    if (tempValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(fieldKey, tempValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving field:', error);
      setTempValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!canEdit) {
    return (
      <div className={className}>
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
          {label}
        </div>
        <div className="text-xs font-semibold text-gray-900">
          {value || '-'}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </div>
      {isEditing ? (
        <Input
          ref={inputRef}
          type={type}
          value={tempValue}
          onChange={(e) => setTempValue(type === 'number' ? Number(e.target.value) : e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          step={step}
          min={min}
          max={max}
          className="h-7 px-2 text-xs font-semibold text-gray-900 border-primary focus:ring-1 focus:ring-primary"
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className={cn(
            'text-xs font-semibold text-gray-900 cursor-pointer rounded px-2 py-1 -mx-2 -my-1 transition-all',
            'hover:bg-gray-50 hover:ring-1 hover:ring-gray-200'
          )}
        >
          <div className="flex items-center justify-between group">
            <span>{value || '-'}</span>
            <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}
    </div>
  );
}
