import { User } from "../models/user.js";

// Here the user with same email is found and returned
export function getUserByEmail(request) {
  return User.findOne({
    email: request.body.email,
  });
}

export function getUserById(userID) {
  return User.findById(userID).select("_id username email");
}
