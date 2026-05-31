import { Select } from '@base-ui/react/select';
import styled from 'styled-components';

import type { User } from '../store';

type Props = {
  users: readonly User[];
  value: string | null;
  onChange: (value: string) => void;
};

export function AuthorSelect(props: Props) {
  const { users, value, onChange } = props;

  return (
    <Select.Root
      value={value}
      onValueChange={(v: string | null) => onChange(v ?? '')}
    >
      <SelectTrigger>
        <Select.Value>
          {(selected: string | null) => {
            if (selected === null) {
              return 'Select author';
            }
            const user = users.find(u => u.id === selected);
            return user?.name ?? selected;
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
