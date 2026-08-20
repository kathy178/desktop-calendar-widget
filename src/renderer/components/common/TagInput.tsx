import { KeyboardEvent, useState } from 'react'
import formStyles from './form.module.css'

export default function TagInput({
  tags,
  onChange,
  placeholder = '输入标签后回车'
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}): JSX.Element {
  const [draft, setDraft] = useState('')

  function commitDraft(): void {
    const value = draft.trim()
    if (value && !tags.includes(value)) {
      onChange([...tags, value])
    }
    setDraft('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitDraft()
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className={formStyles.tagInputRow}>
      {tags.map((tag) => (
        <span key={tag} className={formStyles.tagChip}>
          {tag}
          <span
            className={formStyles.tagChipRemove}
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            role="button"
          >
            ×
          </span>
        </span>
      ))}
      <input
        className={formStyles.tagInput}
        value={draft}
        placeholder={tags.length === 0 ? placeholder : ''}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commitDraft}
      />
    </div>
  )
}
