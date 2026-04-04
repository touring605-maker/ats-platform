import axios from "axios";

const apiClient = axios.create({
  baseURL: `${import.meta.env.BASE_URL}api`.replace(/\/\//g, "/"),
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const orgId = localStorage.getItem("lastats_org_id");
  if (orgId) {
    config.headers["X-Organization-Id"] = orgId;
  }
  return config;
});

export default apiClient;
