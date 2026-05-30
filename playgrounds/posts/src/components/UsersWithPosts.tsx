import { Select } from '@base-ui/react/select';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';

import { store, type Post, type User } from '../store';

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
  onCommitPost: (id: string) => void;
  onRollbackPost: (id: string) => void;
};

function UsersWithPostsInner(props: Props) {
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
    onCommitPost,
    onRollbackPost,
  } = props;

  function getAuthorName(authorId: string): string {
    const user = users.find(u => u.id === authorId);
    return user?.name ?? authorId;
  }

  function getChangedFields(post: Post): { label: string; oldValue?: string; newValue: string }[] {
    const snap = store.posts.snapshot(post.id);
    const original = snap.original as Post | undefined;

    if (!original) {
      return [
        { label: 'Title', newValue: post.title },
        { label: 'Author', newValue: getAuthorName(post.authorId) },
      ];
    }

    const fields: { label: string; oldValue?: string; newValue: string }[] = [];
    if (original.title !== post.title) {
      fields.push({ label: 'Title', oldValue: original.title, newValue: post.title });
    }
    if (original.authorId !== post.authorId) {
      fields.push({
        label: 'Author',
        oldValue: getAuthorName(original.authorId),
        newValue: getAuthorName(post.authorId),
      });
    }
    return fields;
  }

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
              <PostsGrid>
                {userPosts.map(post => {
                  const isEditingPost = editingPostId === post.id;
                  const isDraft = store.posts.snapshot(post.id).isDraft;

                  return (
                    <PostCard key={post.id}>
                      {isEditingPost && !isDraft ? (
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
                      ) : isDraft ? (
                        <>
                          <PostCardHeader>
                            <PostTitle>{post.title}</PostTitle>
                            <DraftBadge>Draft</DraftBadge>
                          </PostCardHeader>
                          <PostMeta>Author: {getAuthorName(post.authorId)}</PostMeta>
                          <ChangedFields>
                            <ChangedFieldsTitle>
                              {store.posts.snapshot(post.id).original
                                ? 'Changes'
                                : 'New post'}
                            </ChangedFieldsTitle>
                            {getChangedFields(post).map(field => (
                              <ChangedFieldItem key={field.label}>
                                <strong>{field.label}:</strong>{' '}
                                {field.oldValue !== undefined ? (
                                  <>
                                    <span style={{ textDecoration: 'line-through', color: '#9ca3af' }}>
                                      {field.oldValue}
                                    </span>{' '}
                                    → {field.newValue}
                                  </>
                                ) : (
                                  field.newValue
                                )}
                              </ChangedFieldItem>
                            ))}
                          </ChangedFields>
                          <PostCardActions>
                            <ActionButton onClick={() => onCommitPost(post.id)}>
                              Save Draft
                            </ActionButton>
                            <ActionButton onClick={() => onRollbackPost(post.id)}>
                              Cancel
                            </ActionButton>
                          </PostCardActions>
                        </>
                      ) : (
                        <>
                          <PostCardHeader>
                            <PostTitle>{post.title}</PostTitle>
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
                          </PostCardHeader>
                          <PostMeta>
                            Author: {getAuthorName(post.authorId)}
                          </PostMeta>
                        </>
                      )}
                    </PostCard>
                  );
                })}
              </PostsGrid>
            ) : null}
          </UserEntry>
        );
      })}
    </>
  );
}

export const UsersWithPosts = observer(UsersWithPostsInner);

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

const PostsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
  padding-left: 8px;
`;

const PostCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PostCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const PostTitle = styled.div`
  font-weight: 600;
  font-size: 15px;
  color: #111827;
`;

const PostMeta = styled.div`
  font-size: 13px;
  color: #6b7280;
`;

const PostActions = styled.div`
  display: flex;
  gap: 4px;
`;

const PostCardActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
`;

const DraftBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
  font-weight: 500;
`;

const ChangedFields = styled.div`
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
`;

const ChangedFieldsTitle = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
  color: #374151;
`;

const ChangedFieldItem = styled.div`
  color: #4b5563;
  line-height: 1.5;
`;

const UserActions = styled.div`
  display: flex;
  gap: 4px;
`;
