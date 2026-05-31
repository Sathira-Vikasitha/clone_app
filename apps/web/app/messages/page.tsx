"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppNav } from "@/components/AppNav";
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

  const selectConversation = useCallback(
    async (conversationId: string, token = getAccessToken()) => {
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
    },
    [router],
  );

  const loadConversations = useCallback(
    async (token = getAccessToken()) => {
      if (!token) {
        return;
      }

      const response = await apiFetch("/chats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = (await response.json()) as Conversation[];
        setConversations(data);

        if (!selectedConversationIdRef.current && data[0]) {
          selectConversation(data[0].id, token);
        }
      }
    },
    [selectConversation],
  );

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

    void Promise.resolve().then(() => loadConversations(token));

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
  }, [loadConversations, router]);

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
    <main className="min-h-screen bg-[#071311] px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <AppNav user={me} />

        <header className="rounded-3xl border border-[#2DD4BF]/15 bg-[#162B27]/80 p-7 shadow-2xl shadow-black/20">
          <p className="text-sm uppercase tracking-[0.24em] text-[#F4C95D]">
            Direct messages
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
            Conversations
          </h1>
          <p className="mt-3 text-[#94A3B8]">
            Keep chats separated by account and follow the conversation in real time.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl border border-[#2DD4BF]/15 bg-[#162B27]/80 p-4 shadow-xl shadow-black/10">
            {me ? (
              <div className="mb-4 rounded-md border border-[#2DD4BF]/15 bg-[#10201D] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[#2DD4BF]">
                  Logged in as
                </p>
                <p className="mt-1 font-semibold">{me.name}</p>
                <p className="text-sm text-[#94A3B8]/90">@{me.username}</p>
              </div>
            ) : null}

            <form onSubmit={startConversation} className="flex gap-2">
              <input
                className="h-11 min-w-0 flex-1 rounded-md border border-[#2DD4BF]/25 bg-[#10201D] px-3 outline-none focus:border-[#2DD4BF]"
                placeholder="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
              <button className="h-11 rounded-md bg-[#2DD4BF] px-4 font-semibold text-neutral-950">
                Chat
              </button>
            </form>

            {error ? <p className="mt-3 text-sm text-[#F87171]">{error}</p> : null}

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
                        ? "bg-[#2DD4BF] text-neutral-950"
                        : "bg-[#10201D] text-white"
                    }`}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
                      {otherUser?.avatarUrl ? (
                        <Image
                          className="h-full w-full rounded-full object-cover"
                          src={otherUser.avatarUrl}
                          alt=""
                          width={44}
                          height={44}
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

          <section className="flex min-h-[620px] flex-col overflow-hidden rounded-3xl border border-[#2DD4BF]/15 bg-[#162B27]/80 shadow-xl shadow-black/10">
            <header className="border-b border-[#2DD4BF]/15 p-4">
              <div className="flex items-center gap-3">
                {selectedRecipient ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2DD4BF] text-lg font-bold text-neutral-950">
                    {selectedRecipient.avatarUrl ? (
                      <Image
                        className="h-full w-full rounded-full object-cover"
                        src={selectedRecipient.avatarUrl}
                        alt=""
                        width={48}
                        height={48}
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
                    <p className="text-sm text-[#94A3B8]/90">
                      @{selectedRecipient.username}
                    </p>
                  ) : (
                    <p className="text-sm text-[#94A3B8]/90">
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
                          <Image
                            className="h-full w-full rounded-full object-cover"
                            src={message.sender.avatarUrl}
                            alt=""
                            width={32}
                            height={32}
                          />
                        ) : (
                          message.sender.name.slice(0, 1).toUpperCase()
                        )}
                      </div>
                    ) : null}
                    <div className={isMine ? "items-end" : "items-start"}>
                      <p
                        className={`mb-1 text-xs text-[#94A3B8]/75 ${
                          isMine ? "text-right" : "text-left"
                        }`}
                      >
                        {isMine ? "You" : message.sender.name}
                      </p>
                      <div
                        className={`w-fit max-w-[min(520px,72vw)] rounded-2xl px-4 py-3 shadow-sm ${
                          isMine
                            ? "rounded-br-md bg-[#2DD4BF] text-neutral-950"
                            : "rounded-bl-md bg-[#10201D] text-white"
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

            <form onSubmit={sendMessage} className="flex gap-2 border-t border-[#2DD4BF]/15 p-4">
              <input
                className="h-12 min-w-0 flex-1 rounded-md border border-[#2DD4BF]/25 bg-[#10201D] px-4 outline-none focus:border-[#2DD4BF]"
                placeholder="Write a message..."
                value={body}
                onChange={(event) => setBody(event.target.value)}
                disabled={!selectedConversationId}
              />
              <button
                className="h-12 rounded-md bg-[#2DD4BF] px-5 font-semibold text-neutral-950 disabled:opacity-40"
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
