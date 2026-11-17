import API from "./index";

const rlService = {
  getDatasets: async () => {
    return await API.get("/rl/datasets");
  },

  trainAgent: async (episodes = 100) => {
    return await API.post("/rl/train", { episodes });
  },

  simulate: async (datasetType = "synthetic", budgetK = 5) => {
    return await API.post("/rl/simulate", { datasetType, budgetK });
  },

  sendFeedback: async (payload) => {
    return await API.post("/rl/feedback", payload);
  },
};

export default rlService;
