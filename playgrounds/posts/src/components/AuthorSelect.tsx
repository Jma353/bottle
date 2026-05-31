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
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: var(--font-sans);
  background: var(--color-white);
  cursor: pointer;
  width: 100%;
  text-align: left;
`;

const SelectIcon = styled(Select.Icon)`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-gray-500);
`;

const SelectPositioner = styled(Select.Positioner)`
  z-index: 100;
`;

const SelectPopup = styled(Select.Popup)`
  background: var(--color-white);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  outline: none;
  min-width: var(--anchor-width);
  font-family: var(--font-sans);
`;

const SelectList = styled(Select.List)`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const SelectItem = styled(Select.Item)`
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-base);
  font-family: var(--font-sans);
  cursor: pointer;

  &[data-highlighted] {
    background: var(--color-gray-100);
  }

  &[data-selected] {
    background: var(--color-gray-200);
  }
`;

const SelectItemText = styled(Select.ItemText)``;
