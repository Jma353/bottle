import { Select } from '@base-ui/react/select';
import styled from 'styled-components';

import type { Post, User } from '../store';

type Props = {
  users: readonly User[];
  posts: readonly Post[];
  editingUserId: string | null;
  editName: string;
  editAge: string;
  onStartEditUser: (user: User) => void;
  onEditNameChange: (name: string) => void;
  onEditAgeChange: (age: string) => void;
  onSaveUserEdit: () => void;
  onCancelUserEdit: () => void;
  editingPostId: string | null;
  editPostTitle: string;
  editPostAuthorId: string;
  onStartEditPost: (post: Post) => void;
  onEditPostTitleChange: (title: string) => void;
  onEditPostAuthorIdChange: (authorId: string) => void;
  onSavePostEdit: () => void;
  onCancelPostEdit: () => void;
  onDeletePost: (id: string) => void;
  onDeleteUser: (id: string) => void;
};

export function UsersWithPosts(props: Props) {
  const {
    users,
    posts,
    editingUserId,
    editName,
    editAge,
    onStartEditUser,
    onEditNameChange,
    onEditAgeChange,
    onSaveUserEdit,
    onCancelUserEdit,
    editingPostId,
    editPostTitle,
    editPostAuthorId,
    onStartEditPost,
    onEditPostTitleChange,
    onEditPostAuthorIdChange,
    onSavePostEdit,
    onCancelPostEdit,
    onDeletePost,
    onDeleteUser,
  } = props;

  return (
    <>
      {users.length === 0 ? (
        <div style={{ fontSize: '14px', color: '#6b7280' }}>No users yet.</div>
      ) : null}
      {users.map(user => {
        const userPosts: Post[] = [];
        for (const p of posts) {
          if (p.authorId === user.id) {
            userPosts.push(p);
          }
        }
        const isEditingUser = editingUserId === user.id;

        return (
          <UserEntry key={user.id}>
            {isEditingUser ? (
              <>
                <EditRow>
                  <Input
                    value={editName}
                    onChange={e => onEditNameChange(e.target.value)}
                    placeholder="Name"
                  />
                  <Input
                    value={editAge}
                    onChange={e => onEditAgeChange(e.target.value)}
                    placeholder="Age"
                    type="number"
                  />
                </EditRow>
                <EditRow>
                  <ActionButton onClick={onSaveUserEdit}>Save</ActionButton>
                  <ActionButton onClick={onCancelUserEdit}>Cancel</ActionButton>
                </EditRow>
              </>
            ) : (
              <UserHeader>
                <UserName>
                  {user.name} (age {user.age})
                </UserName>
                <UserActions>
                  <ActionButton onClick={() => onStartEditUser(user)}>
                    Edit
                  </ActionButton>
                  <ActionButton onClick={() => onDeleteUser(user.id)}>
                    Delete
                  </ActionButton>
                </UserActions>
              </UserHeader>
            )}
            {userPosts.length > 0 ? (
              <PostsList>
                {userPosts.map(post => {
                  const isEditingPost = editingPostId === post.id;
                  return (
                    <PostItem key={post.id}>
                      {isEditingPost ? (
                        <>
                          <EditRow>
                            <Input
                              value={editPostTitle}
                              onChange={e =>
                                onEditPostTitleChange(e.target.value)
                              }
                              placeholder="Title"
                            />
                            <Select.Root
                              value={editPostAuthorId || null}
                              onValueChange={(v: string | null) =>
                                onEditPostAuthorIdChange(v ?? '')
                              }
                            >
                              <SelectTrigger>
                                <Select.Value>
                                  {(value: string | null) => {
                                    if (value === null) {
                                      return 'Select author';
                                    }
                                    const u = users.find(
                                      user => user.id === value
                                    );
                                    return u?.name ?? value;
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
                                        <SelectItem
                                          key={user.id}
                                          value={user.id}
                                        >
                                          <SelectItemText>
                                            {user.name}
                                          </SelectItemText>
                                        </SelectItem>
                                      ))}
                                    </SelectList>
                                  </SelectPopup>
                                </SelectPositioner>
                              </Select.Portal>
                            </Select.Root>
                          </EditRow>
                          <EditRow>
                            <ActionButton onClick={onSavePostEdit}>
                              Save
                            </ActionButton>
                            <ActionButton onClick={onCancelPostEdit}>
                              Cancel
                            </ActionButton>
                          </EditRow>
                        </>
                      ) : (
                        <PostHeader>
                          <span>{post.title}</span>
                          <PostActions>
                            <ActionButton
                              onClick={() => onStartEditPost(post)}
                            >
                              Edit
                            </ActionButton>
                            <ActionButton
                              onClick={() => onDeletePost(post.id)}
                            >
                              Delete
                            </ActionButton>
                          </PostActions>
                        </PostHeader>
                      )}
                    </PostItem>
                  );
                })}
              </PostsList>
            ) : null}
          </UserEntry>
        );
      })}
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

const UserEntry = styled.div`
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const UserHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const UserName = styled.div`
  font-weight: 600;
  font-size: 15px;
`;

const EditRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
`;

const Input = styled.input`
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  width: 120px;
`;

const SelectTrigger = styled(Select.Trigger)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  font-family: system-ui, -apple-system, sans-serif;
  background: white;
  cursor: pointer;
  width: 120px;
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
  border-radius: 4px;
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
  padding: 4px 8px;
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

const ActionButton = styled.button`
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: white;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: #f9fafb;
  }
`;

const PostsList = styled.ul`
  margin: 4px 0 0 20px;
  padding: 0;
  list-style: disc;
`;

const PostItem = styled.li`
  font-size: 14px;
  color: #374151;
  padding: 2px 0;
`;

const PostHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const UserActions = styled.div`
  display: flex;
  gap: 4px;
`;

const PostActions = styled.div`
  display: flex;
  gap: 4px;
`;
