import { Button } from '@base-ui/react/button';
import styled from 'styled-components';

import type { User } from '../store';
import { AuthorSelect } from './AuthorSelect';
import { FieldLabel, FieldRoot, Input } from './ui';

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
        <FieldLabel>Author</FieldLabel>
        <AuthorSelect
          users={users}
          value={authorId || null}
          onChange={onAuthorChange}
        />
      </FieldRoot>
      <FieldRoot>
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
