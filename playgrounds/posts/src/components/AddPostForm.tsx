import { Button } from '@base-ui/react/button';
import { Field } from '@base-ui/react/field';
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
          <Select
            value={authorId}
            onChange={e => onAuthorChange(e.target.value)}
          >
            <option value="">Select author</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
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

const Select = styled.select`
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
`;

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
