"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL, apiFetch } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import type { Conversation, Message, User } from "@/lib/types";

export default function MessagesPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const selectedConversationIdRef = useRef("");

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  );

  const selectedRecipient = useMemo(() => {
    if (!selectedConversation || !me) {
      return null;
    }

    return selectedConversation.members.find((member) => member.userId !== me.id)
      ?.user;
  }, [me, selectedConversation]);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    apiFetch("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Not logged in");
        }

        return response.json();
      })
      .then(setMe)
      .catch(() => {
        clearAccessToken();
        router.push("/login");
      });

    loadConversations(token);

    const events = new EventSource(
      `${API_URL}/chats/events?token=${encodeURIComponent(token)}`,
    );

    events.addEventListener("message", (event) => {
      const nextMessage = JSON.parse(event.data) as Message;
      const activeConversationId = selectedConversationIdRef.current;

      if (nextMessage.conversationId === activeConversationId) {
        setMessages((currentMessages) => {
          if (currentMessages.some((message) => message.id === nextMessage.id)) {
            return currentMessages;
          }

          return [...currentMessages, nextMessage];
        });
      }

      loadConversations(token);
    });

    return () => events.close();
  }, [router]);

  async function loadConversations(token = getAccessToken()) {
    if (!token) {
      return;
    }

    const response = await apiFetch("/chats", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = (await response.json()) as Conversation[];
      setConversations(data);

      if (!selectedConversationId && data[0]) {
        selectConversation(data[0].id, token);
      }
    }
  }

  async function selectConversation(conversationId: string, token = getAccessToken()) {
    if (!token) {
      router.push("/login");
      return;
    }

    selectedConversationIdRef.current = conversationId;
    setSelectedConversationId(conversationId);
    const response = await apiFetch(`/chats/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      setMessages(await response.json());
    }
  }

  async function startConversation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const response = await apiFetch("/chats/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Could not start chat");
      return;
    }

    setUsername("");
    setConversations((currentConversations) => {
      const exists = currentConversations.some(
        (conversation) => conversation.id === data.id,
      );

      return exists ? currentConversations : [data, ...currentConversations];
    });
    selectConversation(data.id, token);
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const token = getAccessToken();

    if (!token || !selectedConversationId) {
      return;
    }

    const response = await apiFetch(
      `/chats/${selectedConversationId}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body }),
      },
    );
    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Could not send message");
      return;
    }

    setBody("");
    setMessages((currentMessages) => {
      if (currentMessages.some((message) => message.id === data.id)) {
        return currentMessages;
      }

      return [...currentMessages, data];
    });
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <nav className="flex items-center justify-between">
          <Link className="text-xl font-semibold" href="/">
            InstaClone
          </Link>
          <div className="flex items-center gap-3">
            {me ? (
              <Link
                className="rounded-md border border-teal-300/50 px-4 py-2 text-sm text-teal-200"
                href={`/profile/${me.username}`}
              >
                Profile
              </Link>
            ) : null}
            <Link
              className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/80"
              href="/"
            >
              Feed
            </Link>
          </div>
        </nav>

        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-md border border-white/10 bg-white/10 p-4">
            {me ? (
              <div className="mb-4 rounded-md border border-white/10 bg-neutral-900 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-teal-300">
                  Logged in as
                </p>
                <p className="mt-1 font-semibold">{me.name}</p>
                <p className="text-sm text-white/55">@{me.username}</p>
              </div>
            ) : null}

            <form onSubmit={startConversation} className="flex gap-2">
              <input
                className="h-11 min-w-0 flex-1 rounded-md border border-white/15 bg-neutral-900 px-3 outline-none focus:border-teal-300"
                placeholder="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
              <button className="h-11 rounded-md bg-teal-300 px-4 font-semibold text-neutral-950">
                Chat
              </button>
            </form>

            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

            <div className="mt-5 flex flex-col gap-2">
              {conversations.map((conversation) => {
                const otherUser = conversation.members.find(
                  (member) => member.userId !== me?.id,
                )?.user;
                const latestMessage = conversation.messages[0];
                const latestMessageLabel = getLatestMessageLabel(
                  latestMessage,
                  otherUser?.name,
                  me?.id,
                );

                return (
                  <button
                    key={conversation.id}
                    onClick={() => selectConversation(conversation.id)}
                    className={`flex items-center gap-3 rounded-md p-3 text-left ${
                      selectedConversationId === conversation.id
                        ? "bg-teal-300 text-neutral-950"
                        : "bg-neutral-900 text-white"
                    }`}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
                      {otherUser?.avatarUrl ? (
                        <img
                          className="h-full w-full rounded-full object-cover"
                          src={otherUser.avatarUrl}
                          alt=""
                        />
                      ) : (
                        (otherUser?.name || "C").slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {otherUser?.name || "Conversation"}
                      </p>
                      <p className="truncate text-sm opacity-70">
                        {latestMessageLabel}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-h-[620px] flex-col rounded-md border border-white/10 bg-white/10">
            <header className="border-b border-white/10 p-4">
              <div className="flex items-center gap-3">
                {selectedRecipient ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-300 text-lg font-bold text-neutral-950">
                    {selectedRecipient.avatarUrl ? (
                      <img
                        className="h-full w-full rounded-full object-cover"
                        src={selectedRecipient.avatarUrl}
                        alt=""
                      />
                    ) : (
                      selectedRecipient.name.slice(0, 1).toUpperCase()
                    )}
                  </div>
                ) : null}
                <div>
                  <h1 className="text-2xl font-semibold">
                    {selectedRecipient ? selectedRecipient.name : "Messages"}
                  </h1>
                  {selectedRecipient ? (
                    <p className="text-sm text-white/55">
                      @{selectedRecipient.username}
                    </p>
                  ) : (
                    <p className="text-sm text-white/55">
                      Start a chat by entering a username.
                    </p>
                  )}
                </div>
              </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              {messages.map((message) => {
                const isMine = message.senderId === me?.id;

                return (
                  <div
                    key={message.id}
                    className={`flex w-full items-end gap-2 ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isMine ? (
                      <div className="mb-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
                        {message.sender.avatarUrl ? (
                          <img
                            className="h-full w-full rounded-full object-cover"
                            src={message.sender.avatarUrl}
                            alt=""
                          />
                        ) : (
                          message.sender.name.slice(0, 1).toUpperCase()
                        )}
                      </div>
                    ) : null}
                    <div className={isMine ? "items-end" : "items-start"}>
                      <p
                        className={`mb-1 text-xs text-white/45 ${
                          isMine ? "text-right" : "text-left"
                        }`}
                      >
                        {isMine ? "You" : message.sender.name}
                      </p>
                      <div
                        className={`w-fit max-w-[min(520px,72vw)] rounded-2xl px-4 py-3 shadow-sm ${
                          isMine
                            ? "rounded-br-md bg-teal-300 text-neutral-950"
                            : "rounded-bl-md bg-neutral-900 text-white"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.body}
                        </p>
                        <p className="mt-1 text-xs opacity-60">
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={sendMessage} className="flex gap-2 border-t border-white/10 p-4">
              <input
                className="h-12 min-w-0 flex-1 rounded-md border border-white/15 bg-neutral-900 px-4 outline-none focus:border-teal-300"
                placeholder="Write a message..."
                value={body}
                onChange={(event) => setBody(event.target.value)}
                disabled={!selectedConversationId}
              />
              <button
                className="h-12 rounded-md bg-teal-300 px-5 font-semibold text-neutral-950 disabled:opacity-40"
                disabled={!selectedConversationId}
              >
                Send
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

function getLatestMessageLabel(
  latestMessage: Message | undefined,
  otherUserName: string | undefined,
  currentUserId: string | undefined,
) {
  if (!latestMessage) {
    return "No messages yet";
  }

  const preview =
    latestMessage.body.length > 42
      ? `${latestMessage.body.slice(0, 42)}...`
      : latestMessage.body;

  if (latestMessage.senderId === currentUserId) {
    return `You messaged ${otherUserName || "them"}: ${preview}`;
  }

  return `${latestMessage.sender.name} messaged you: ${preview}`;
}
