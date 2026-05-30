import { Button } from '@base-ui/react/button';
import { Field } from '@base-ui/react/field';
import { Select } from '@base-ui/react/select';
import styled from 'styled-components';

import type { User } from '../store';

type Props = {
  title: string;
  authorId: string;
  users: readonly User[];
  onTitleChange: (title: string) => void;
  onAuthorChange: (authorId: string) => void;
  onAdd: () => void;
};

export function AddPostForm(props: Props) {
  const { title, authorId, users, onTitleChange, onAuthorChange, onAdd } =
    props;

  return (
    <>
      <FieldRoot>
        <FieldRoot>
          <FieldLabel>Author</FieldLabel>
          <Select.Root
            value={authorId || null}
            onValueChange={(v: string | null) => onAuthorChange(v ?? '')}
          >
            <SelectTrigger>
              <Select.Value>
                {(value: string | null) => {
                  if (value === null) {
                    return 'Select author';
                  }
                  const user = users.find(u => u.id === value);
                  return user?.name ?? value;
                }}
              </Select.Value>
              <SelectIcon>
                <ChevronIcon />
              </SelectIcon>
            </SelectTrigger>
            <Select.Portal>
              <SelectPositioner side="bottom" sideOffset={4}>
                <SelectPopup>
                  <SelectList>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <SelectItemText>{user.name}</SelectItemText>
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </Select.Portal>
          </Select.Root>
        </FieldRoot>
        <FieldLabel>Title</FieldLabel>
        <Input
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Hello world"
        />
      </FieldRoot>

      <StyledButton onClick={onAdd}>Add post</StyledButton>
    </>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const FieldRoot = styled(Field.Root)`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
`;

const FieldLabel = styled(Field.Label)`
  font-size: 14px;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
`;

const SelectTrigger = styled(Select.Trigger)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: system-ui, -apple-system, sans-serif;
  background: white;
  cursor: pointer;
  width: 100%;
  text-align: left;
`;

const SelectIcon = styled(Select.Icon)`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
`;

const SelectPositioner = styled(Select.Positioner)`
  z-index: 100;
`;

const SelectPopup = styled(Select.Popup)`
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 4px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  outline: none;
  min-width: var(--anchor-width);
  font-family: system-ui, -apple-system, sans-serif;
`;

const SelectList = styled(Select.List)`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const SelectItem = styled(Select.Item)`
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 14px;
  font-family: system-ui, -apple-system, sans-serif;
  cursor: pointer;

  &[data-highlighted] {
    background: #f3f4f6;
  }

  &[data-selected] {
    background: #e5e7eb;
  }
`;

const SelectItemText = styled(Select.ItemText)``;

const StyledButton = styled(Button)`
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: white;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: #f9fafb;
  }
`;
