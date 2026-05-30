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
                            <Select
                              value={editPostAuthorId}
                              onChange={e =>
                                onEditPostAuthorIdChange(e.target.value)
                              }
                            >
                              {users.map(u => (
                                <option key={u.id} value={u.id}>
                                  {u.name}
                                </option>
                              ))}
                            </Select>
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

const Select = styled.select`
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  width: 120px;
`;

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
