import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:4000/api" });
// base url for all api calls
export const fetchResponses = () => api.get("/responses");

// send an expert score for a specific response
export const submitScore = (id, expertScore) =>
  api.patch(`/responses/${id}`, { expertScore });
