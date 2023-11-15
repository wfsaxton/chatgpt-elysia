import { Elysia, t } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { html } from "@elysiajs/html";
import { OpenAI } from "openai";
import Message from "../entities/Message";
import History from "../entities/History";

let history = new History();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL,
});

const app = new Elysia().use(html()).use(staticPlugin());

app
  .get("/", () => (
    <Layout>
      <main>
        <Chat />
      </main>
    </Layout>
  ))

  .ws("/chat", {
    async message(ws, input) {
      const { chat } = input as Message;
      console.log("Received message:", chat);

      let humanMessage = new Message(history.length() + 1 + "", "user", chat);
      history.append(humanMessage);
      let aiMessage = new Message(history.length() + 1 + "", "ai", "");
      history.append(aiMessage);

      let renderedMessages = Message.renderMultiple([humanMessage, aiMessage]);

      ws.send(renderedMessages);

      let aiChatResponse = await openai.chat.completions.create({
        model: "gpt-4",
        stream: true,
        messages: [
          {
            role: "user",
            content: chat,
          },
        ],
      });

      try {
        for await (let data of aiChatResponse) {
          if (data.choices[0].finish_reason !== "stop") {
            aiMessage.chat += data.choices[0].delta.content;
          }

          ws.send(aiMessage.render({ swapOob: true }));
        }
      } catch (error) {
        console.error("Error processing stream:", error);
      }
    },
  })

  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

// This should produce a TS error.  Need to fix!
// console.log(<div>{"<" + "/div>"}</div>);

export const Layout = ({ children }: any) => (
  <html>
    <head>
      <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      <link rel='shortcut icon' type='image/png' href='/public/favicon.ico' />
      <script src='https://unpkg.com/htmx.org@1.9.3'></script>
      <script src='https://unpkg.com/htmx.org/dist/ext/sse.js'></script>
      <script src='https://unpkg.com/htmx.org/dist/ext/ws.js'></script>
      <script src='https://unpkg.com/hyperscript.org@0.9.9'></script>
      <script src='https://cdn.tailwindcss.com'></script>
      <title>ChatGPT/Elysia</title>
    </head>
    <body>
      <div class='p-4'>
        <h1 class='text-4xl font-bold mb-4'>
          <a href='/'>ChatGPT/Elysia</a>
        </h1>
        {children}
      </div>
    </body>
  </html>
);

export const Chat = () => (
  <div hx-ext='ws' ws-connect='/chat'>
    <div id='chat-messages'></div>
    <form
      id='chat-form'
      autocomplete='off'
      // Doesn't work and gives TS error
      // _='on htmx:afterRequest reset() me'
      class='mb-4'
      ws-send
    >
      <div class='mb-2'>
        <input
          name='chat'
          type='text'
          class='bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5'
        />
      </div>
      <button
        class='text-white bg-blue-700 hover:bg-blue-800 rounded-lg px-5 py-2 text-center'
        type='submit'
      >
        Submit
      </button>
    </form>
  </div>
);
