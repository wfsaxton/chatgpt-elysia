export default class Message {
  public id: string;
  public role: string;
  public chat: string;

  constructor(id: string, role: string, chat: string) {
    this.id = id;
    this.role = role;
    this.chat = chat;
  }

  public render({ swapOob }: { swapOob?: boolean } = {}): string {
    return `<div id="chat${this.id}" ${swapOob ? 'hx-swap-oob="true"' : ""}">${this.role}: ${this.chat}</div>`;
  }

  public static renderMultiple(messages: Message[]): string {
    return `<div class="flex flex-col" hx-swap-oob="beforeend:#chat-messages">
    ${messages
      .map((message: Message) => {
        return message.render();
      })
      .join("\n  ")}
    </div>`;
  }
}
