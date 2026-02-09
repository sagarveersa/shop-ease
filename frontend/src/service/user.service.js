import { v4 as uuidv4 } from "uuid";
import { usersDB } from "./db";
import { createToken, verifyToken } from "../utils/jwt";

const users = usersDB || [];

export const UserService = {
  register: async (name, email, password) => {
    const id = uuidv4();
    let response;
    if (!name || !email || !password) {
      console.log("Invalid data");
      response = { success: false, data: { error: "Invalid data" } };
    } else {
      users.push({ id: id, name: name, email: email, password: password });
      response = { success: true, data: { id: id } };
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(response), 500);
    });
  },

  login: async (email, password) => {
    let foundUser = null;
    let response;
    for (const user of users) {
      if (user.email === email) {
        foundUser = user;
      }
    }

    if (!foundUser) {
      response = { success: false, data: { error: "User not found" } };
    } else if (password !== foundUser.password) {
      response = {
        success: false,
        data: { error: "Incorrect username or password" },
      };
    } else {
      const payload = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
      };

      const token = await createToken(payload);
      response = {
        success: true,
        data: {
          accessToken: token,
          userID: foundUser.id,
          name: foundUser.name,
        },
      };
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(response), 500);
    });
  },

  authenticate: async (token, userID, name) => {
    const payload = await verifyToken(token);
    if (!payload || payload.userID !== userID || payload.name !== name) {
      return {
        success: false,
        data: {
          error: "Invalid token",
        },
      };
    }

    return { success: true, data: {} };
  },
};
