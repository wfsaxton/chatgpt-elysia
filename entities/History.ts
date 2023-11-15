import Message from "./Message";

export default class History {
  public history: Array<Message> = [];

  public append(message: Message) {
    this.history.push(message);
  }

  public length() : number {
    return this.history.length;
  }

  public render(): string {
    return this.history.map((message: Message) => {
      return message.render();
    }).join("\n");
  }
}
