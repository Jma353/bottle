import { Collection } from 'bottle';
import { makeAutoObservable } from 'mobx';

type User = {
  id: string;
  name: string;
  age: number;
};

type Post = {
  id: string;
  title: string;
  authorId: string;
};

const API_BASE = '/api';

class Store {
  users = new Collection<User>('users');
  posts = new Collection<Post>('posts');

  constructor() {
    makeAutoObservable(this);
  }

  async loadUsers() {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) {
      throw new Error('Failed to load users');
    }
    const users: User[] = await res.json();
    for (const user of users) {
      this.users.ingest({ entity: user });
    }
  }

  async loadPosts() {
    const res = await fetch(`${API_BASE}/posts`);
    if (!res.ok) {
      throw new Error('Failed to load posts');
    }
    const posts: Post[] = await res.json();
    for (const post of posts) {
      this.posts.ingest({ entity: post });
    }
  }

  addUser(args: { name: string; age: number }) {
    const { name, age } = args;
    const id = `u-${Date.now()}`;
    this.users.upsert({
      entity: { id, name, age },
      sync: async changes => {
        const res = await fetch(`${API_BASE}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changes.entity),
        });
        if (!res.ok) {
          throw new Error('Failed to create user');
        }
      },
      autoCommit: true,
    });
  }

  updateUser(args: { id: string; name: string; age: number }) {
    const { id, name, age } = args;
    this.users.update({
      id,
      patch: { name, age },
      sync: async changes => {
        const res = await fetch(`${API_BASE}/users/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changes.entity),
        });
        if (!res.ok) {
          throw new Error('Failed to update user');
        }
      },
      autoCommit: true,
    });
  }

  deleteUser(args: { id: string }) {
    const { id } = args;
    this.users.delete({
      id,
      sync: async () => {
        const res = await fetch(`${API_BASE}/users/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          throw new Error('Failed to delete user');
        }
      },
      autoCommit: true,
    });
  }

  addPost(args: { title: string; authorId: string }) {
    const { title, authorId } = args;
    const id = `p-${Date.now()}`;
    this.posts.upsert({
      entity: { id, title, authorId },
      sync: async changes => {
        const res = await fetch(`${API_BASE}/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changes.entity),
        });
        if (!res.ok) {
          throw new Error('Failed to create post');
        }
      },
      autoCommit: true,
    });
  }

  updatePost(args: { id: string; title: string; authorId: string }) {
    const { id, title, authorId } = args;
    this.posts.update({
      id,
      patch: { title, authorId },
      sync: async changes => {
        const res = await fetch(`${API_BASE}/posts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changes.entity),
        });
        if (!res.ok) {
          throw new Error('Failed to update post');
        }
      },
      autoCommit: true,
    });
  }

  deletePost(args: { id: string }) {
    const { id } = args;
    this.posts.delete({
      id,
      sync: async () => {
        const res = await fetch(`${API_BASE}/posts/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          throw new Error('Failed to delete post');
        }
      },
      autoCommit: true,
    });
  }
}

export const store = new Store();
export type { User, Post };
