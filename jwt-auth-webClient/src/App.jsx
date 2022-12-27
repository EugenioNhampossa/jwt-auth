import { useState } from "react";
import "./App.css";
import axios from "axios";
import jwt_decode from "jwt-decode";

const api = axios.create({
  baseURL: "http://localhost:3333/api",
});

const axiosJwt = axios.create({
  baseURL: "http://localhost:3333/api",
});

function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/login", {
        username,
        password,
      });
      setUser(res.data);
    } catch (error) {
      console.log(error.message);
    }
  };

  const refreshToken = async () => {
    try {
      const res = await axiosJwt.post("/refresh", { token: user.refreshToken });
      setUser({
        ...user,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
      return res.data;
    } catch (err) {
      console.log(err);
    }
  };

  axiosJwt.interceptors.request.use(
    async (config) => {
      let currentDate = new Date();
      const decodedToken = jwt_decode(user.accessToken);
      if (decodedToken.exp * 1000 < currentDate.getTime()) {
        const data = await refreshToken();
        config.headers["authorization"] = "Bearer " + data.accessToken;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const handleDelete = async (id) => {
    setError(false);
    setSuccess(false);
    try {
      await axiosJwt.delete("/users/" + id, {
        headers: {
          authorization: "Bearer " + user.accessToken,
        },
      });
      setSuccess(true);
    } catch (error) {
      setError(true);
      console.log(error.message);
    }
  };

  return (
    <div className="container">
      {user ? (
        <div className="home">
          <span>
            Welcome to the <b>{user.isAdmin ? "admin" : "user"}</b> dashboard{" "}
            <b>{user.username}</b>.
          </span>
          <span>Delete Users:</span>
          <button className="deleteButton" onClick={() => handleDelete(1)}>
            Delete Eugénio
          </button>
          <button className="deleteButton" onClick={() => handleDelete(2)}>
            Delete Nhampossa
          </button>
          {error && (
            <span className="error">
              You are not allowed to delete this user!
            </span>
          )}
          {success && (
            <span className="success">
              User has been deleted successfully...
            </span>
          )}
        </div>
      ) : (
        <div className="login">
          <form onSubmit={handleSubmit}>
            <span className="formTitle">LOGIN</span>
            <input
              type="text"
              placeholder="username"
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="submitButton">
              Login
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
