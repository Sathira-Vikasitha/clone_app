export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
};

export type Post = {
  id: string;
  caption: string;
  imageUrl: string | null;
  createdAt: string;
  likedByMe: boolean;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  comments: {
    id: string;
    body: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      username: string;
      avatarUrl: string | null;
    };
  }[];
  _count: {
    likes: number;
    comments: number;
  };
};

export type UserProfile = {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  posts: Post[];
  _count: {
    posts: number;
  };
};

export type ChatUser = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: ChatUser;
};

export type Conversation = {
  id: string;
  createdAt: string;
  updatedAt: string;
  members: {
    id: string;
    userId: string;
    user: ChatUser;
  }[];
  messages: Message[];
};

export type Notification = {
  id: string;
  recipientId: string;
  actorId: string;
  type: "like" | "comment" | "message";
  message: string;
  postId: string | null;
  conversationId: string | null;
  readAt: string | null;
  createdAt: string;
  actor: ChatUser;
};
