import { Button } from '@base-ui/react/button';
import styled from 'styled-components';

import { FieldLabel, FieldRoot, Input } from './ui';

type Props = {
  name: string;
  age: string;
  onNameChange: (name: string) => void;
  onAgeChange: (age: string) => void;
  onAdd: () => void;
};

export function AddUserForm(props: Props) {
  const { name, age, onNameChange, onAgeChange, onAdd } = props;

  return (
    <>
      <FieldRoot>
        <FieldLabel>Name</FieldLabel>
        <Input
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Joe"
        />
      </FieldRoot>
      <FieldRoot>
        <FieldLabel>Age</FieldLabel>
        <Input
          value={age}
          onChange={e => onAgeChange(e.target.value)}
          placeholder="30"
          type="number"
        />
      </FieldRoot>
      <StyledButton onClick={onAdd}>Add user</StyledButton>
    </>
  );
}

const StyledButton = styled(Button)`
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-300);
  background: var(--color-white);
  cursor: pointer;
  font-size: var(--font-size-base);

  &:hover {
    background: var(--color-gray-50);
  }
`;
