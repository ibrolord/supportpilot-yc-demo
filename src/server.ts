import { createApp } from "./app.js";

const port = Number(process.env.PORT || 3000);

createApp().listen(port, () => {
  console.log(`SupportPilot listening on http://127.0.0.1:${port}`);
});
