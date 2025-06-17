// src/services/freesoundApi.js
import axios from "axios";
import qs from "querystring";

const API_BASE = "https://freesound.org/apiv2";
const CLIENT_ID = import.meta.env.VITE_FREESOUND_CLIENT_ID;
const API_KEY = import.meta.env.VITE_FREESOUND_API_KEY;
const REDIRECT_URI = "http://localhost:5173/callback";

export const loginFreesound = () => {
  const authUrl = `${API_BASE}/oauth2/authorize/?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}`;
  window.location.href = authUrl;
};

export const getAccessToken = async (code) => {
  try {
    const response = await axios.post(
      `${API_BASE}/oauth2/access_token/`,
      qs.stringify({
        client_id: CLIENT_ID,
        client_secret: import.meta.env.VITE_FREESOUND_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("getAccessToken error:", error.response?.data || error.message);
    throw error;
  }
};

export const searchSounds = async (query, token) => {
  try {
    const response = await axios.get(`${API_BASE}/search/text/`, {
      params: {
        query,
        token: API_KEY,
        fields: "id,name,description,previews,tags,license,username",
      },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data.results || [];
  } catch (error) {
    console.error("searchSounds error:", error.response?.data || error.message);
    throw error;
  }
};

export const downloadSound = async (soundId, token) => {
  try {
    const response = await axios.get(`${API_BASE}/sounds/${soundId}/download/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "*/*", // Accept any content type
      },
      responseType: "blob",
      validateStatus: (status) => status >= 200 && status < 300,
    });

    // Validate response
    if (!(response.data instanceof Blob)) {
      const text = await response.data.text();
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = text;
      }
      console.error("downloadSound: Invalid Blob, received:", errorData);
      throw new Error(`Invalid response: ${JSON.stringify(errorData)}`);
    }

    // Determine Content-Type
    const contentType = response.headers["content-type"];
    const validContentTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/flac",
      "application/octet-stream",
    ];
    if (!validContentTypes.includes(contentType)) {
      console.error("downloadSound: Unexpected Content-Type:", contentType);
      throw new Error(`Unexpected Content-Type: ${contentType}`);
    }

    // Set Blob type based on Content-Type
    const blobType = contentType === "application/octet-stream" || !contentType?.startsWith("audio/")
      ? "audio/mpeg" // Default to MP3
      : contentType;
    const blob = new Blob([response.data], { type: blobType });

    return blob;
  } catch (error) {
    console.error("downloadSound error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
    });
    throw error;
  }
};