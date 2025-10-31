import { authEndpoints } from "./auth";
import { postsEndpoints } from "./posts";
import { usersEndpoints } from "./users";
import { storageEndpoints } from "./storage";
import { chatEndpoints } from "./chat";

// TODO: CHANGE THE VALUE BACK
const useLocalhost = false;
const isSsl = true;
const url = useLocalhost ? `localhost:6169` : `api.sharinflame.com`;

export const apiUrl = `${isSsl ? "https" : "http"}://${url}/v1`;
export const websocketUrl = `${isSsl ? "wss" : "ws"}://${url}/ws`;

export const apiEndpoints = {
  auth: authEndpoints,
  posts: postsEndpoints,
  users: usersEndpoints,
  storage: storageEndpoints,
  chat: chatEndpoints,
  ping: "/ping"
};
